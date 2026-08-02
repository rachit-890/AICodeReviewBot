package com.proj.prreviewbot.config;

import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.googleai.GoogleAiEmbeddingModel;
import dev.langchain4j.store.embedding.pgvector.PgVectorEmbeddingStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Configuration class for LangChain4j PgVectorEmbeddingStore and Google Gemini EmbeddingModel.
 * 
 * Extracts host, port, database, user, and password from spring.datasource.url
 * to support seamless deployment on cloud platforms like Render.
 */
@Configuration
public class EmbeddingStoreConfig {

    private static final Logger log = LoggerFactory.getLogger(EmbeddingStoreConfig.class);

    @Value("${spring.datasource.url:jdbc:postgresql://localhost:5432/codereviewdb}")
    private String datasourceUrl;

    @Value("${spring.datasource.username:rachit}")
    private String datasourceUser;

    @Value("${spring.datasource.password:rachit123}")
    private String datasourcePassword;

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
    public PgVectorEmbeddingStore embeddingStore() {
        String dbHost = "localhost";
        int dbPort = 5432;
        String dbName = "codereviewdb";
        String dbUser = datasourceUser;
        String dbPass = datasourcePassword;

        Pattern pattern = Pattern.compile("(?:jdbc:)?postgresql://(?:([^:]+):([^@]+)@)?([^:/]+)(?::(\\d+))?/([^?]+)");
        Matcher matcher = pattern.matcher(datasourceUrl);

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

        log.info("Configuring PgVectorEmbeddingStore for host '{}', port {}, database '{}'", dbHost, dbPort, dbName);

        return PgVectorEmbeddingStore.builder()
                .host(dbHost)
                .port(dbPort)
                .database(dbName)
                .user(dbUser)
                .password(dbPass)
                .table(tableName)
                .dimension(dimension)
                .build();
    }

    @Bean
    public EmbeddingModel embeddingModel() {
        return GoogleAiEmbeddingModel.builder()
                .apiKey(geminiApiKey)
                .modelName("text-embedding-004")
                .build();
    }
}
