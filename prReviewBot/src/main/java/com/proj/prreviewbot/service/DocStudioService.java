package com.proj.prreviewbot.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.proj.prreviewbot.dto.DocGenRequest;
import com.proj.prreviewbot.dto.DocGenResponse;
import com.proj.prreviewbot.dto.ExplainRequest;
import com.proj.prreviewbot.dto.ExplainResponse;
import dev.langchain4j.model.googleai.GoogleAiGeminiChatModel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Service for Code Explanation & Documentation Studio (Phase 3).
 */
@Service
public class DocStudioService {

    private static final Logger log = LoggerFactory.getLogger(DocStudioService.class);

    private final ObjectMapper objectMapper;
    private final JdbcTemplate jdbcTemplate;

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    public DocStudioService(ObjectMapper objectMapper, JdbcTemplate jdbcTemplate) {
        this.objectMapper = objectMapper;
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Explains an arbitrary code snippet using Gemini 2.5 Flash.
     */
    public ExplainResponse explainCode(ExplainRequest request) {
        log.info("Analyzing code snippet in language '{}'", request.getLanguage());

        GoogleAiGeminiChatModel model = GoogleAiGeminiChatModel.builder()
                .apiKey(geminiApiKey)
                .modelName("gemini-2.5-flash")
                .build();

        String prompt = buildExplainPrompt(request);
        String rawResponse = model.chat(prompt);

        return parseExplainResponse(rawResponse);
    }

    /**
     * Generates documentation (README, ARCHITECTURE, API_SPEC, CHANGELOG) grounded in indexed repository code.
     */
    public DocGenResponse generateDoc(DocGenRequest request) {
        log.info("Generating documentation of type '{}' for repository '{}'", request.getDocType(), request.getRepository());

        // 1. Fetch indexed repository source chunks
        String sql = "SELECT file_path, content FROM repo_documents WHERE repository = ? ORDER BY file_path LIMIT 40";
        List<String> repoChunks = jdbcTemplate.query(sql, (rs, rowNum) ->
                String.format("File: %s\n%s", rs.getString("file_path"), rs.getString("content")),
                request.getRepository()
        );

        if (repoChunks.isEmpty()) {
            throw new IllegalArgumentException("Repository '" + request.getRepository() + "' has not been indexed yet. Please trigger POST /api/v1/rag/index first.");
        }

        String aggregatedContext = String.join("\n\n---\n\n", repoChunks);

        GoogleAiGeminiChatModel model = GoogleAiGeminiChatModel.builder()
                .apiKey(geminiApiKey)
                .modelName("gemini-2.5-flash")
                .build();

        String prompt = buildDocGenPrompt(request.getDocType(), request.getRepository(), aggregatedContext);
        String markdownResult = model.chat(prompt).strip();

        // Clean markdown code blocks if wrapped unnecessarily
        if (markdownResult.startsWith("```markdown")) {
            markdownResult = markdownResult
                    .replaceAll("^```markdown\\s*", "")
                    .replaceAll("```\\s*$", "")
                    .strip();
        }

        return DocGenResponse.builder()
                .repository(request.getRepository())
                .docType(request.getDocType().toUpperCase())
                .markdownContent(markdownResult)
                .generatedAt(LocalDateTime.now())
                .build();
    }

    private String buildExplainPrompt(ExplainRequest request) {
        return """
            You are a senior software architect and expert developer.
            Analyze the following %s code snippet and return ONLY a valid JSON object.
            No explanation, no markdown code blocks, no preamble. Just raw JSON.

            Return exactly this structure:
            {
              "explanation": "detailed step-by-step technical explanation of what this code does",
              "complexity": "time and space complexity breakdown (e.g. O(N) time, O(1) space)",
              "keyComponents": ["component or concept 1", "component or concept 2", ...],
              "securityNotes": "security considerations, memory management, or edge-case risks"
            }

            Code Snippet:
            %s

            Additional Developer Context:
            %s
            """.formatted(
                request.getLanguage() != null ? request.getLanguage() : "java",
                request.getCode(),
                request.getContext() != null ? request.getContext() : "None provided"
        );
    }

    private String buildDocGenPrompt(String docType, String repository, String codeContext) {
        return """
            You are SentinAI Technical Documentation Studio.
            Synthesize a comprehensive, professional, production-grade %s document for the repository '%s' in GitHub-Flavored Markdown.
            Base all details on the actual repository source code chunks provided below.

            Source Code Chunks:
            %s

            Guidelines for %s:
            - Write clear, well-structured GitHub-Flavored Markdown with headings, bullet points, and code blocks.
            - Include architecture overview, module breakdowns, configuration keys, and usage instructions where appropriate.
            - Do NOT include generic placeholder text like '[Insert details here]'; populate actual details from code.
            """.formatted(docType, repository, codeContext, docType);
    }

    private ExplainResponse parseExplainResponse(String raw) {
        try {
            String cleaned = raw.strip();
            if (cleaned.startsWith("```")) {
                cleaned = cleaned
                        .replaceAll("^```(json)?\\s*", "")
                        .replaceAll("```\\s*$", "")
                        .strip();
            }

            JsonNode root = objectMapper.readTree(cleaned);

            String explanation = root.path("explanation").asText("No explanation available");
            String complexity = root.path("complexity").asText("N/A");
            String securityNotes = root.path("securityNotes").asText("None");

            List<String> keyComponents = new ArrayList<>();
            for (JsonNode c : root.path("keyComponents")) {
                keyComponents.add(c.asText());
            }

            return ExplainResponse.builder()
                    .explanation(explanation)
                    .complexity(complexity)
                    .keyComponents(keyComponents)
                    .securityNotes(securityNotes)
                    .build();
        } catch (Exception e) {
            log.error("Failed to parse code explanation response: {}", e.getMessage());
            return ExplainResponse.builder()
                    .explanation(raw)
                    .complexity("Unknown")
                    .keyComponents(List.of())
                    .securityNotes("Parsing failed")
                    .build();
        }
    }
}
