package com.proj.prreviewbot.config;

import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.googleai.GoogleAiEmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingMatch;
import dev.langchain4j.store.embedding.EmbeddingSearchRequest;
import dev.langchain4j.store.embedding.EmbeddingSearchResult;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.filter.Filter;
import dev.langchain4j.store.embedding.pgvector.PgVectorEmbeddingStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Configuration class for LangChain4j PgVectorEmbeddingStore and Google Gemini EmbeddingModel.
 * 
 * Extracts host, port, database, user, and password from environment/spring.datasource.url
 * to support seamless deployment on cloud platforms like Render.
 * Includes a resilient fallback store if vector database connection fails on startup.
 */
@Configuration
public class EmbeddingStoreConfig {

    private static final Logger log = LoggerFactory.getLogger(EmbeddingStoreConfig.class);

    @Value("${spring.datasource.url:jdbc:postgresql://localhost:5432/codereviewdb}")
    private String defaultDatasourceUrl;

    @Value("${spring.datasource.username:rachit}")
    private String defaultDatasourceUser;

    @Value("${spring.datasource.password:rachit123}")
    private String defaultDatasourcePassword;

    @Value("${langchain4j.pgvector.host:}")
    private String customHost;

    @Value("${langchain4j.pgvector.port:0}")
    private int customPort;

    @Value("${langchain4j.pgvector.database:}")
    private String customDatabase;

    @Value("${langchain4j.pgvector.table-name:langchain4j_embeddings}")
    private String tableName;

    @Value("${langchain4j.pgvector.dimension:768}")
    private int dimension;

    @Value("${gemini.api.key:default-key}")
    private String geminiApiKey;

    @Bean
    public EmbeddingStore<TextSegment> embeddingStore() {
        String activeUrl = resolveEnv("DATABASE_URL", "SPRING_DATASOURCE_URL", "POSTGRES_URL");
        if (activeUrl == null || activeUrl.isEmpty()) {
            activeUrl = defaultDatasourceUrl;
        }

        String dbHost = "localhost";
        int dbPort = 5432;
        String dbName = "codereviewdb";

        String dbUser = resolveEnv("SPRING_DATASOURCE_USERNAME", "POSTGRES_USER", "POSTGRES_USERNAME", "DB_USERNAME");
        if (dbUser == null || dbUser.isEmpty()) dbUser = defaultDatasourceUser;

        String dbPass = resolveEnv("SPRING_DATASOURCE_PASSWORD", "POSTGRES_PASSWORD", "DB_PASSWORD");
        if (dbPass == null || dbPass.isEmpty()) dbPass = defaultDatasourcePassword;

        Pattern pattern = Pattern.compile("(?:jdbc:)?postgresql://(?:([^:]+):([^@]+)@)?([^:/]+)(?::(\\d+))?/([^?]+)");
        Matcher matcher = pattern.matcher(activeUrl);

        if (matcher.find()) {
            if (matcher.group(1) != null) dbUser = matcher.group(1);
            if (matcher.group(2) != null) dbPass = matcher.group(2);
            if (matcher.group(3) != null) dbHost = matcher.group(3);
            if (matcher.group(4) != null) dbPort = Integer.parseInt(matcher.group(4));
            if (matcher.group(5) != null) dbName = matcher.group(5);
        }

        if (customHost != null && !customHost.isEmpty()) dbHost = customHost;
        if (customPort > 0) dbPort = customPort;
        if (customDatabase != null && !customDatabase.isEmpty()) dbName = customDatabase;

        if (dbHost != null && dbHost.matches("^dpg-[a-zA-Z0-9-]+$")) {
            String regionDomain = System.getenv().getOrDefault("RENDER_POSTGRES_DOMAIN", "singapore-postgres.render.com");
            dbHost = dbHost + "." + regionDomain;
        }

        if (dbName != null && dbName.contains("?")) {
            dbName = dbName.substring(0, dbName.indexOf("?"));
        }

        log.info("Configuring PgVectorEmbeddingStore for host '{}', port {}, database '{}', user '{}'", dbHost, dbPort, dbName, dbUser);

        try {
            return PgVectorEmbeddingStore.builder()
                    .host(dbHost)
                    .port(dbPort)
                    .database(dbName)
                    .user(dbUser)
                    .password(dbPass)
                    .table(tableName)
                    .dimension(dimension)
                    .build();
        } catch (Exception e) {
            log.warn("Failed to initialize PgVectorEmbeddingStore at {}:{}/{} ({}). Initializing FallbackEmbeddingStore to allow application startup.",
                    dbHost, dbPort, dbName, e.getMessage());
            return new FallbackEmbeddingStore();
        }
    }

    private String resolveEnv(String... envVarNames) {
        for (String varName : envVarNames) {
            String val = System.getenv(varName);
            if (val != null && !val.trim().isEmpty()) {
                return val.trim();
            }
        }
        return null;
    }

    @Bean
    public EmbeddingModel embeddingModel() {
        return GoogleAiEmbeddingModel.builder()
                .apiKey(geminiApiKey)
                .modelName("text-embedding-004")
                .build();
    }

    private static class FallbackEmbeddingStore implements EmbeddingStore<TextSegment> {
        @Override
        public String add(dev.langchain4j.data.embedding.Embedding embedding) {
            return UUID.randomUUID().toString();
        }

        @Override
        public void add(String id, dev.langchain4j.data.embedding.Embedding embedding) {
        }

        @Override
        public String add(dev.langchain4j.data.embedding.Embedding embedding, TextSegment textSegment) {
            return UUID.randomUUID().toString();
        }

        @Override
        public List<String> addAll(List<dev.langchain4j.data.embedding.Embedding> embeddings) {
            return Collections.emptyList();
        }

        @Override
        public List<String> addAll(List<dev.langchain4j.data.embedding.Embedding> embeddings, List<TextSegment> embedded) {
            return Collections.emptyList();
        }

        @Override
        public EmbeddingSearchResult<TextSegment> search(EmbeddingSearchRequest request) {
            return new EmbeddingSearchResult<>(Collections.<EmbeddingMatch<TextSegment>>emptyList());
        }

        @Override
        public void removeAll(Filter filter) {
        }

        @Override
        public void removeAll(Collection<String> ids) {
        }

        @Override
        public void removeAll() {
        }
    }
}
