package com.proj.prreviewbot.service;

import com.proj.prreviewbot.dto.ChatResponse;
import dev.langchain4j.data.document.Metadata;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.googleai.GoogleAiGeminiChatModel;
import dev.langchain4j.store.embedding.EmbeddingMatch;
import dev.langchain4j.store.embedding.EmbeddingSearchRequest;
import dev.langchain4j.store.embedding.EmbeddingSearchResult;
import dev.langchain4j.store.embedding.filter.Filter;
import dev.langchain4j.store.embedding.filter.comparison.IsEqualTo;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.filter.Filter;
import dev.langchain4j.store.embedding.filter.comparison.IsEqualTo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.FileSystems;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.PathMatcher;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Core RAG (Retrieval-Augmented Generation) Service.
 * 
 * Design & Architecture Decisions:
 * 1. Idempotent Re-Indexing & Purge (Correction 6):
 *    Before indexing a repository, all existing metadata rows in repo_documents AND vector embeddings
 *    in EmbeddingStore for that repository are purged to prevent stale chunks or secret leaks.
 * 2. Double-Gated Metadata Isolation (Correction 2):
 *    Applies DB-level metadata filtering (IsEqualTo("repository", repository)) AND 
 *    in-memory post-filtering validation to guarantee ZERO cross-repository leakage.
 * 3. Secret & Config Exclusion (Correction 4 & 8):
 *    Excludes secret-bearing and config files via configurable NIO glob patterns ('rag.indexing.excluded-patterns').
 */
@Service
public class RAGService {

    private static final Logger log = LoggerFactory.getLogger(RAGService.class);

    private static final int CHUNK_SIZE_CHARS = 2000;  // ~500 tokens
    private static final int CHUNK_OVERLAP_CHARS = 200; // ~50 tokens

    private static final Set<String> IGNORED_DIRS = Set.of(
            ".git", "node_modules", "target", "build", ".idea", ".vscode", ".settings", "dist", "out"
    );

    private static final Set<String> BINARY_EXTENSIONS = Set.of(
            "png", "jpg", "jpeg", "gif", "ico", "svg", "pdf", "zip", "tar", "gz", "7z",
            "jar", "war", "ear", "class", "exe", "dll", "so", "dylib", "db", "sqlite"
    );

    private final EmbeddingStore<TextSegment> embeddingStore;
    private final EmbeddingModel embeddingModel;
    private final JdbcTemplate jdbcTemplate;

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    /**
     * Configurable exclusion patterns using Java NIO glob syntax (Correction 8).
     */
    @Value("${rag.indexing.excluded-patterns:**/.env*,**/application*.properties,**/application*.yml,**/docker-compose*.yml,**/k8s/secret*.yaml,**/k8s/secret*.yml}")
    private String[] excludedPatterns;

    public RAGService(EmbeddingStore<TextSegment> embeddingStore,
                      EmbeddingModel embeddingModel,
                      JdbcTemplate jdbcTemplate) {
        this.embeddingStore = embeddingStore;
        this.embeddingModel = embeddingModel;
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Synchronous repository indexer (Idempotent: purges stale records and vectors first).
     */
    public int indexRepositorySync(String repoPathStr, String repository) {
        log.info("Starting synchronous repository indexing for repo '{}' at path '{}'", repository, repoPathStr);
        Path rootPath = Paths.get(repoPathStr);

        if (!Files.exists(rootPath) || !Files.isDirectory(rootPath)) {
            throw new IllegalArgumentException("Invalid repoPath: Directory does not exist at " + repoPathStr);
        }

        // Correction 6: Purge existing metadata rows AND vector embeddings for this repository before indexing
        purgeRepositoryData(repository);

        int totalChunksIndexed = 0;

        try (Stream<Path> pathStream = Files.walk(rootPath)) {
            List<Path> filesToIndex = pathStream
                    .filter(Files::isRegularFile)
                    .filter(p -> shouldIndexFile(rootPath, p))
                    .collect(Collectors.toList());

            log.info("Found {} source files to index in repository '{}' (after excluding secret/config files)", filesToIndex.size(), repository);

            for (Path filePath : filesToIndex) {
                String relativePath = rootPath.relativize(filePath).toString().replace('\\', '/');
                try {
                    String content = Files.readString(filePath);
                    if (content.isBlank()) {
                        continue;
                    }

                    List<String> chunks = chunkText(content);
                    for (int i = 0; i < chunks.size(); i++) {
                        String chunkText = chunks.get(i);

                        // 1. Save metadata into repo_documents table
                        String docSql = """
                            INSERT INTO repo_documents (repository, file_path, chunk_index, content)
                            VALUES (?, ?, ?, ?)
                            ON CONFLICT (repository, file_path, chunk_index)
                            DO UPDATE SET content = EXCLUDED.content
                        """;
                        jdbcTemplate.update(docSql, repository, relativePath, i);

                        // 2. Build metadata for LangChain4j vector segment
                        Metadata metadata = new Metadata();
                        metadata.put("repository", repository);
                        metadata.put("file_path", relativePath);
                        metadata.put("chunk_index", i);

                        TextSegment segment = TextSegment.from(chunkText, metadata);

                        // 3. Generate embedding and store in PgVectorEmbeddingStore
                        Embedding embedding = embeddingModel.embed(segment).content();
                        embeddingStore.add(embedding, segment);

                        totalChunksIndexed++;
                    }
                } catch (Exception e) {
                    log.warn("Failed to index file '{}' in repo '{}': {}", relativePath, repository, e.getMessage());
                }
            }
        } catch (IOException e) {
            log.error("Failed to walk directory path '{}': {}", repoPathStr, e.getMessage(), e);
            throw new RuntimeException("Directory traversal failed: " + e.getMessage(), e);
        }

        log.info("Completed indexing repo '{}': total chunks indexed = {}", repository, totalChunksIndexed);
        return totalChunksIndexed;
    }

    /**
     * Purges existing documents in relational store and vector embedding store for repository.
     */
    private void purgeRepositoryData(String repository) {
        log.info("Purging stale relational metadata and vector embeddings for repository '{}'", repository);
        try {
            int deletedDocs = jdbcTemplate.update("DELETE FROM repo_documents WHERE repository = ?", repository);
            log.info("Deleted {} rows from repo_documents for repository '{}'", deletedDocs, repository);

            Filter repoFilter = new IsEqualTo("repository", repository);
            embeddingStore.removeAll(repoFilter);
            log.info("Successfully purged vector embeddings from PgVectorEmbeddingStore for repository '{}'", repository);
        } catch (Exception e) {
            log.warn("Warning during repository purge for '{}': {}", repository, e.getMessage());
        }
    }

    /**
     * Asynchronous repository indexer.
     */
    @Async
    public void indexRepositoryAsync(String repoPathStr, String repository) {
        try {
            indexRepositorySync(repoPathStr, repository);
        } catch (Exception e) {
            log.error("Async indexing failed for repo '{}': {}", repository, e.getMessage(), e);
        }
    }

    /**
     * Grounded RAG search & answer generation.
     */
    public ChatResponse chatWithRepo(String query, String repository) {
        log.info("Received RAG chat request for repository '{}' with query: '{}'", repository, query);

        // 1. Check if repository has been indexed
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM repo_documents WHERE repository = ?",
                Integer.class,
                repository
        );

        if (count == null || count == 0) {
            log.warn("Repository '{}' has not been indexed yet", repository);
            return ChatResponse.builder()
                    .answer("Repository '" + repository + "' has not been indexed yet. Please trigger indexing via POST /api/v1/rag/index first.")
                    .sources(Collections.emptyList())
                    .build();
        }

        // 2. Generate embedding for user query
        Embedding queryEmbedding = embeddingModel.embed(query).content();

        // 3. Query PgVectorEmbeddingStore with metadata filter for repository
        Filter repoFilter = new IsEqualTo("repository", repository);
        EmbeddingSearchRequest searchRequest = EmbeddingSearchRequest.builder()
                .queryEmbedding(queryEmbedding)
                .filter(repoFilter)
                .maxResults(25)
                .build();

        EmbeddingSearchResult<TextSegment> searchResult = embeddingStore.search(searchRequest);
        List<EmbeddingMatch<TextSegment>> matches = searchResult.matches();

        // LOG PRE-FILTER RESULTS TO VERIFY DB-LEVEL METADATA FILTERING
        log.info("RAW DB Search Result count from PgVectorEmbeddingStore (pre-filter): {}", matches.size());
        for (int i = 0; i < matches.size(); i++) {
            EmbeddingMatch<TextSegment> m = matches.get(i);
            String matchRepo = (m.embedded() != null && m.embedded().metadata() != null)
                    ? m.embedded().metadata().getString("repository")
                    : "unknown";
            String matchFile = (m.embedded() != null && m.embedded().metadata() != null)
                    ? m.embedded().metadata().getString("file_path")
                    : "unknown";
            log.info("  [PRE-FILTER DB MATCH {}] score={:.4f}, repo='{}', file='{}'", i + 1, m.score(), matchRepo, matchFile);
        }

        // 4. Double-gated post-filtering: Ensure strict isolation for repository
        List<EmbeddingMatch<TextSegment>> filteredMatches = matches.stream()
                .filter(match -> match.embedded() != null && match.embedded().metadata() != null)
                .filter(match -> repository.equals(match.embedded().metadata().getString("repository")))
                .limit(5)
                .collect(Collectors.toList());

        if (filteredMatches.isEmpty()) {
            log.info("No matching code chunks found for repository '{}'", repository);
            return ChatResponse.builder()
                    .answer("No relevant context found in repository '" + repository + "' for your query.")
                    .sources(Collections.emptyList())
                    .build();
        }

        // 5. Aggregate retrieved context & distinct source paths
        StringBuilder contextBuilder = new StringBuilder();
        List<String> sources = new ArrayList<>();

        for (int i = 0; i < filteredMatches.size(); i++) {
            TextSegment segment = filteredMatches.get(i).embedded();
            String filePath = segment.metadata().getString("file_path");
            if (filePath != null && !sources.contains(filePath)) {
                sources.add(filePath);
            }

            contextBuilder.append(String.format("--- Context Chunk %d [%s] ---\n", i + 1, filePath));
            contextBuilder.append(segment.text()).append("\n\n");
        }

        // 6. Synthesize grounded answer using Gemini Chat Model
        GoogleAiGeminiChatModel chatModel = GoogleAiGeminiChatModel.builder()
                .apiKey(geminiApiKey)
                .modelName("gemini-2.5-flash")
                .build();

        String prompt = buildRAGPrompt(query, repository, contextBuilder.toString());
        String rawAnswer = chatModel.chat(prompt);

        return ChatResponse.builder()
                .answer(rawAnswer.strip())
                .sources(sources)
                .build();
    }

    private String buildRAGPrompt(String query, String repository, String contextText) {
        return """
            You are SentinAI, an expert AI software architect assisting developers with questions about codebase repository '%s'.
            Answer the user's question accurately using ONLY the provided code context chunks below.
            If the answer cannot be determined from the provided context, state clearly what context is missing.
            
            Code Context Chunks:
            %s
            
            User Question:
            %s
            """.formatted(repository, contextText, query);
    }

    private boolean shouldIndexFile(Path rootPath, Path filePath) {
        Path relative = rootPath.relativize(filePath);

        // Check directory exclusions
        for (Path component : relative) {
            if (IGNORED_DIRS.contains(component.toString())) {
                return false;
            }
        }

        String fileName = filePath.getFileName().toString();
        if (fileName.startsWith(".")) {
            return false;
        }

        // Check binary file extensions
        int dotIndex = fileName.lastIndexOf('.');
        if (dotIndex > 0) {
            String ext = fileName.substring(dotIndex + 1).toLowerCase();
            if (BINARY_EXTENSIONS.contains(ext)) {
                return false;
            }
        }

        // Correction 4 & 8: Check configured secret & config file exclusions using NIO glob matcher
        if (isExcludedSecretOrConfigFile(relative)) {
            log.info("Excluding secret/config file: {}", relative);
            return false;
        }

        // Skip files larger than 1MB
        try {
            if (Files.size(filePath) > 1024 * 1024) {
                return false;
            }
        } catch (IOException ignored) {}

        return true;
    }

    /**
     * Evaluates relative file path against NIO glob patterns specified in excludedPatterns (Correction 8).
     */
    private boolean isExcludedSecretOrConfigFile(Path relativePath) {
        if (excludedPatterns == null || excludedPatterns.length == 0) {
            return false;
        }

        Path normalizedRelative = relativePath.normalize();
        String pathStr = normalizedRelative.toString().replace('\\', '/');

        for (String rawPattern : excludedPatterns) {
            String pattern = rawPattern.trim();
            if (pattern.isEmpty()) {
                continue;
            }

            try {
                // Java NIO PathMatcher using glob: syntax exclusively
                PathMatcher matcher = FileSystems.getDefault().getPathMatcher("glob:" + pattern);
                if (matcher.matches(normalizedRelative) || matcher.matches(Paths.get(pathStr))) {
                    return true;
                }
            } catch (Exception e) {
                log.warn("Failed to evaluate NIO glob pattern '{}': {}", pattern, e.getMessage());
            }
        }
        return false;
    }

    private List<String> chunkText(String text) {
        List<String> chunks = new ArrayList<>();
        int length = text.length();

        if (length <= CHUNK_SIZE_CHARS) {
            chunks.add(text);
            return chunks;
        }

        int start = 0;
        while (start < length) {
            int end = Math.min(start + CHUNK_SIZE_CHARS, length);
            chunks.add(text.substring(start, end));

            if (end == length) {
                break;
            }
            start += (CHUNK_SIZE_CHARS - CHUNK_OVERLAP_CHARS);
        }

        return chunks;
    }
}
