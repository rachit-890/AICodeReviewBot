-- Enable vector extension for PostgreSQL
CREATE EXTENSION IF NOT EXISTS vector;

-- Metadata source of truth for repository chunks
CREATE TABLE repo_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repository VARCHAR(255) NOT NULL,
    file_path VARCHAR(512) NOT NULL,
    chunk_index INT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_repo_file_chunk UNIQUE (repository, file_path, chunk_index)
);
