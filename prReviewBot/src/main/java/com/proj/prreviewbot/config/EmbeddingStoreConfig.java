package com.proj.prreviewbot.config;

import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.googleai.GoogleAiEmbeddingModel;
import dev.langchain4j.store.embedding.pgvector.PgVectorEmbeddingStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration class for LangChain4j PgVectorEmbeddingStore and Google Gemini EmbeddingModel.
 * 
 * Non-obvious design decision:
 * PgVectorEmbeddingStore auto-creates and manages its own embedding storage table (configured via table-name).
 * Relational metadata (repository, file_path, chunk_index) is separately stored in repo_documents table as the source-of-truth.
 */
@Configuration
public class EmbeddingStoreConfig {

    @Value("${langchain4j.pgvector.host:localhost}")
    private String host;

    @Value("${langchain4j.pgvector.port:5432}")
    private int port;

    @Value("${langchain4j.pgvector.database:codereviewdb}")
    private String database;

    @Value("${langchain4j.pgvector.user:rachit}")
    private String user;

    @Value("${langchain4j.pgvector.password:rachit123}")
    private String password;

    @Value("${langchain4j.pgvector.table-name:langchain4j_embeddings}")
    private String tableName;

    @Value("${langchain4j.pgvector.dimension:768}")
    private int dimension;

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    @Bean
    public PgVectorEmbeddingStore embeddingStore() {
        return PgVectorEmbeddingStore.builder()
                .host(host)
                .port(port)
                .database(database)
                .user(user)
                .password(password)
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
