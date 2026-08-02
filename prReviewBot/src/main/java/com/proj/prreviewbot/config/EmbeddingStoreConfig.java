package com.proj.prreviewbot.config;

import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.googleai.GoogleAiEmbeddingModel;
import dev.langchain4j.store.embedding.pgvector.PgVectorEmbeddingStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.net.URI;

/**
 * Configuration class for LangChain4j PgVectorEmbeddingStore and Google Gemini EmbeddingModel.
 * 
 * Dynamically extracts host, port, database, user, and password from spring.datasource.url
 * to support seamless deployment on cloud platforms like Render.
 */
@Configuration
public class EmbeddingStoreConfig {

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

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    @Bean
    public PgVectorEmbeddingStore embeddingStore() {
        String dbHost = "localhost";
        int dbPort = 5432;
        String dbName = "codereviewdb";
        String dbUser = datasourceUser;
        String dbPass = datasourcePassword;

        try {
            String cleanUrl = datasourceUrl.replace("jdbc:", "");
            URI uri = URI.create(cleanUrl);
            if (uri.getHost() != null) {
                dbHost = uri.getHost();
            }
            if (uri.getPort() != -1) {
                dbPort = uri.getPort();
            }
            if (uri.getPath() != null && uri.getPath().length() > 1) {
                dbName = uri.getPath().substring(1);
            }
            if (uri.getUserInfo() != null) {
                String[] userInfo = uri.getUserInfo().split(":");
                if (userInfo.length > 0 && !userInfo[0].isEmpty()) dbUser = userInfo[0];
                if (userInfo.length > 1 && !userInfo[1].isEmpty()) dbPass = userInfo[1];
            }
        } catch (Exception ignored) {
        }

        if (customHost != null && !customHost.isEmpty()) dbHost = customHost;
        if (customPort > 0) dbPort = customPort;
        if (customDatabase != null && !customDatabase.isEmpty()) dbName = customDatabase;

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
