# 🛠️ Document 3: Implementation Blueprint & Step-by-Step Execution Plan

This document details the exact step-by-step technical blueprint for implementing all missing features into **AICodeReviewBot**.

---

## Phase 1: Database Setup & `pgvector` Migration

### 1. Update Docker Setup for Postgres Vector
Ensure PostgreSQL image supports `pgvector`. In `prReviewBot/docker-compose.yml`, change the postgres image to:
```yaml
  postgres:
    image: pgvector/pgvector:pg16
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: codereviewdb
      POSTGRES_USER: rachit
      POSTGRES_PASSWORD: rachit123
```

### 2. Create Flyway Migration `V3__enable_pgvector_and_create_rag_tables.sql`
File path: `prReviewBot/src/main/resources/db/migration/V3__enable_pgvector_and_create_rag_tables.sql`
```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE repo_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_path VARCHAR(512) NOT NULL,
    chunk_index INT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE repo_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES repo_documents(id) ON DELETE CASCADE,
    embedding vector(768),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_repo_embeddings_cosine ON repo_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

---

## Phase 2: RAG Engine & Vector Search in Spring Boot

### 1. Add Dependencies to `pom.xml`
```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-pgvector</artifactId>
    <version>0.35.0</version>
</dependency>
```

### 2. Create Vector DTOs & Services
* **`dto/ChatRequest.java`**: `query` string, `repository` string.
* **`dto/ChatResponse.java`**: `answer` string, `sources` list of file paths.
* **`service/RAGService.java`**:
  1. `indexRepository(String repoPath)`: Scans code files, chunks text into 500-token pieces, generates embeddings via Gemini, and persists to `repo_documents` & `repo_embeddings`.
  2. `chatWithRepo(String query)`: Generates embedding for query, runs Cosine Similarity search in DB (`ORDER BY embedding <=> :queryVector LIMIT 5`), and sends context + prompt to Gemini.

### 3. Create `ChatController.java`
File path: `prReviewBot/src/main/java/com/proj/prreviewbot/controller/ChatController.java`
* `POST /api/v1/chat`: Endpoint for repo QA chat.
* `POST /api/v1/rag/index`: Endpoint to trigger repository indexing.

---

## Phase 3: Code Explanation & Documentation Service

### 1. Create `DocGenService.java`
File path: `prReviewBot/src/main/java/com/proj/prreviewbot/service/DocGenService.java`
Methods:
* `explainCode(String codeSnippet, String language)`: Uses Gemini with a specialized system prompt to output Markdown explanations covering Purpose, Logic Flow, Edge Cases, and Performance.
* `generateDocumentation(String codeSnippet, String docFormat)`: Generates Javadoc / Markdown documentation strings.

### 2. Create `DocController.java`
File path: `prReviewBot/src/main/java/com/proj/prreviewbot/controller/DocController.java`
Endpoints:
* `POST /api/v1/docs/explain`
* `POST /api/v1/docs/generate`

---

## Phase 4: SonarQube Static Analysis Integration

### 1. Add Configuration Properties
In `application.properties`:
```properties
sonarqube.url=http://localhost:9000
sonarqube.token=${SONARQUBE_TOKEN:default-token}
```

### 2. Create `SonarQubeService.java`
File path: `prReviewBot/src/main/java/com/proj/prreviewbot/service/SonarQubeService.java`
* Uses `WebClient` to query `GET /api/issues/search?componentKeys={repo}`.
* Transforms raw SonarQube issues into finding DTOs.
* Merges SonarQube static metrics into `LLMService` review prompts for enriched hybrid analysis.

---

## Phase 5: Optional FastAPI + LangGraph Agent Microservice

If true LangGraph multi-agent routing is desired:
1. Create `agent-service/` folder in project root.
2. Add `requirements.txt`:
   ```text
   fastapi==0.111.0
   uvicorn==0.30.1
   langgraph==0.1.5
   langchain-google-genai==1.0.6
   pydantic==2.7.4
   ```
3. Add `agent-service/main.py`:
   Exposes `POST /api/v1/agent/review` which runs a stateful LangGraph graph consisting of:
   * **Node 1: Security Agent** (Scans for secrets & OWASP Top 10)
   * **Node 2: Performance Agent** (Scans for memory leaks & DB query issues)
   * **Node 3: Aggregator Node** (Combines agent outputs into final review payload)
4. Add service to `docker-compose.yml`.

---

## Phase 6: Cursor IDE Integration (MCP / OpenAPI)

1. Add `springdoc-openapi-starter-webmvc-ui` to `pom.xml`:
   ```xml
   <dependency>
       <groupId>org.springdoc</groupId>
       <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
       <version>2.5.0</version>
   </dependency>
   ```
2. Open endpoint `/v3/api-docs` so Cursor IDE can auto-discover backend capabilities.

---

## Phase 7: React Dashboard Enhancements (`dashboard-react/`)

Update `App.tsx` to add 3 new interactive tabs:
1. **💬 Repo Chat (RAG Studio):** Chat assistant window for asking natural language questions about the codebase with source file links.
2. **📖 Doc Generator:** Input code snippets to generate explanations and Javadoc/Markdown docs in real-time.
3. **📊 SonarQube Security Panel:** Display static metrics and Sonar issue severity breakdown alongside AI reviews.

---

## Phase 8: Kubernetes Deployment Setup (`k8s/`)

Create directory `/home/fedora/codeReviewBot/k8s/` with deployment manifests:
* `k8s/01-postgres-vector.yaml`
* `k8s/02-redis.yaml`
* `k8s/03-backend.yaml`
* `k8s/04-frontend.yaml`
* `k8s/05-ingress.yaml`

---

## 📋 Implementation Checklist

- [ ] **Step 1:** Run Docker Compose with `pgvector/pgvector:pg16`.
- [ ] **Step 2:** Apply Flyway `V3` migration script for RAG tables.
- [ ] **Step 3:** Implement `RAGService` & `ChatController` in Spring Boot.
- [ ] **Step 4:** Implement `DocGenService` & `DocController` in Spring Boot.
- [ ] **Step 5:** Implement `SonarQubeService` integration.
- [ ] **Step 6:** Add RAG Chat & Documentation tabs to `dashboard-react`.
- [ ] **Step 7:** Create K8s deployment manifests in `k8s/`.
- [ ] **Step 8:** Run end-to-end verification.
