# SentinAI (AICodeReviewBot)

SentinAI is an automated pull request review and codebase intelligence platform. The project combines a Java 21 Spring Boot core application, a Python FastAPI microservice running stateful multi-agent analysis graphs, and a React 19 single-page developer dashboard.

The system listens for GitHub pull request webhooks, executes automated security and performance code audits using Google Gemini models, computes vector embeddings over repository source files into PostgreSQL PgVector for retrieval-augmented generation (RAG) codebase chat, and tracks client access quotas using Redis rate limiting.

---

## Visual Workflow

![SentinAI Code Security and Pull Request Intelligence Dashboard](docs/images/sentinai_features_landing.png)

```mermaid
sequenceDiagram
    autonumber
    actor Developer as Developer / GitHub
    participant Gateway as ApiKeyAuthFilter (Spring Security)
    participant Redis as Redis (Rate Limiter & Cache)
    participant Backend as Java Core (prReviewBot :8080)
    participant Agent as Python Microservice (agent-service :8000)
    participant Gemini as Google Gemini AI API
    participant VectorDB as PostgreSQL 18 (PgVector)

    Developer->>Gateway: POST /api/v1/review (X-API-Key + PR URL)
    Gateway->>Redis: Check Sliding-Window Rate Limit (Max 10 req/min)
    Redis-->>Gateway: Rate Limit Allowed
    Gateway->>Backend: Pass Request to ReviewController

    Backend->>Redis: Query Cached Review (PR URL + Head SHA)
    alt Cache Hit
        Redis-->>Backend: Return Cached Review Scorecard
    else Cache Miss
        Backend->>Developer: Fetch Pull Request Diff via GitHub API
        Backend->>Gemini: Request Initial LLM Analysis (gemini-2.5-flash)
        Backend->>Agent: Delegate Multi-Agent Audit (POST /api/v1/agent/review)
        
        Note over Agent: LangGraph Pipeline Execution
        Agent->>Gemini: Security Agent Audit (gemini-1.5-flash)
        Agent->>Gemini: Performance Agent Audit (gemini-1.5-flash)
        Agent->>Gemini: Aggregator Node Synthesis
        Agent-->>Backend: Return Combined Multi-Agent Findings
        
        Backend->>VectorDB: Query Semantic Code Context (text-embedding-004)
        VectorDB-->>Backend: Return Similarity Matches (PgVector)
        
        Backend->>VectorDB: Save Complete Review Scorecard
        Backend->>Redis: Cache Review Result
    end

    Backend-->>Developer: Return Final Review Scorecard & Post GitHub Comment
```

![SentinAI Developer Dashboard Scorecard & RAG Interface](docs/images/sentinai_dashboard_preview.png)

---

## Table of Contents

- [Visual Workflow](#visual-workflow)
- [Technologies Used](#technologies-used)
- [Requirements](#requirements)
- [Installation Instructions](#installation-instructions)
- [Usage Instructions](#usage-instructions)
- [Support Information](#support-information)
- [Project Status & Known Limitations](#project-status--known-limitations)
- [Contribution Guidelines](#contribution-guidelines)
- [Acknowledgments](#acknowledgments)
- [License Information](#license-information)

---

## Technologies Used

Every technology version listed below is verified directly against the project's dependency manifest files.

### 1. Java Core Service (`prReviewBot/pom.xml`)
- **JDK Version**: Java 21 (`<java.version>21</java.version>`)
- **Framework**: Spring Boot 4.1.0 (`<artifactId>spring-boot-starter-parent</artifactId><version>4.1.0</version>`)
- **LLM Integration**: LangChain4j Gemini 1.15.1 (`<artifactId>langchain4j-google-ai-gemini</artifactId><version>1.15.1</version>`) — configured to use model `gemini-2.5-flash`
- **Vector Store**: LangChain4j PgVector 0.35.0 (`<artifactId>langchain4j-pgvector</artifactId><version>0.35.0</version>`) — configured to use model `text-embedding-004` (768 dimensions)
- **API Documentation**: Springdoc OpenAPI UI 2.8.5 (`<artifactId>springdoc-openapi-starter-webmvc-ui</artifactId><version>2.8.5</version>`)
- **Environment Loader**: Dotenv-Java 3.0.0 (`<artifactId>dotenv-java</artifactId><version>3.0.0</version>`)
- **Database & Migrations**: PostgreSQL 18, HikariCP pool, Flyway (`spring-boot-starter-flyway` & `flyway-database-postgresql`)
- **Testing Tools**: Embedded Redis 0.7.3 (`<artifactId>embedded-redis</artifactId><version>0.7.3</version>`), Mockito

### 2. Python Agent Microservice (`agent-service/requirements.txt`)
- **Python Runtime**: Python 3.11+
- **Framework**: FastAPI 0.111.0 (`fastapi==0.111.0`), Uvicorn 0.30.1 (`uvicorn==0.30.1`)
- **Multi-Agent Orchestration**: LangGraph 0.1.5 (`langgraph==0.1.5`)
- **LLM Integration**: LangChain Google GenAI 1.0.6 (`langchain-google-genai==1.0.6`) — configured to use model `gemini-1.5-flash`
- **Validation**: Pydantic 2.7.4 (`pydantic==2.7.4`), Python-Dotenv 1.0.1 (`python-dotenv==1.0.1`)

### 3. React Developer Dashboard (`dashboard-react/package.json`)
- **Core Framework**: React 19.2.7 (`"react": "^19.2.7"`), React DOM 19.2.7 (`"react-dom": "^19.2.7"`)
- **Build Tooling**: Vite 8.1.1 (`"vite": "^8.1.1"`), `@vitejs/plugin-react` 6.0.3 (`"@vitejs/plugin-react": "^6.0.3"`)
- **Language**: TypeScript 6.0.2 (`"typescript": "~6.0.2"`)
- **UI & Motion**: Framer Motion 12.42.2 (`"framer-motion": "^12.42.2"`), Lucide React 1.24.0 (`"lucide-react": "^1.24.0"`)
- **Code Quality**: Oxlint 1.71.0 (`"oxlint": "^1.71.0"`)
- **Styling**: Custom Vanilla CSS (`src/index.css`) — *Tailwind CSS is not used*.

### 4. Data Layer & Caching
- **Database**: PostgreSQL 18 with `pgvector` extension
- **Cache & Rate Limiting**: Redis 7+ (`spring-boot-starter-data-redis` / Lettuce client)

---

## Requirements

To build and run all three services locally, install the following software versions:

- **Java Development Kit (JDK)**: OpenJDK 21 or higher
- **Build Engine**: Apache Maven 3.9+
- **Python Environment**: Python 3.11 or 3.12 with `pip`
- **Node.js Environment**: Node.js 18+ and `npm`
- **PostgreSQL Database**: PostgreSQL 18 instance compiled with the `pgvector` extension
- **Redis Server**: Redis 7.0+

---

## Installation Instructions

### 1. Database & Cache Setup (Docker)
Run local PostgreSQL 18 (with `pgvector`) and Redis instances using Docker:

```bash
# Start PostgreSQL 18 with pgvector
docker run -d --name sentinai-postgres -p 5432:5432 \
  -e POSTGRES_DB=codereviewdb \
  -e POSTGRES_USER=rachit \
  -e POSTGRES_PASSWORD=rachit123 \
  ankane/pgvector:v0.5.1

# Start Redis
docker run -d --name sentinai-redis -p 6379:6379 redis:7-alpine
```

### 2. Spring Boot Core Service (`prReviewBot`)
The Java backend dynamically selects connection strings by checking environment variables in order: `DATABASE_URL` → `SPRING_DATASOURCE_URL` → `POSTGRES_URL`.

```bash
cd prReviewBot

# Export environment variables
export GITHUB_TOKEN="your_github_personal_access_token"
export GEMINI_API_KEY="your_google_gemini_api_key"
export SPRING_DATASOURCE_URL="jdbc:postgresql://localhost:5432/codereviewdb"
export SPRING_DATASOURCE_USERNAME="rachit"
export SPRING_DATASOURCE_PASSWORD="rachit123"

# Run Maven build and start application
mvn spring-boot:run
```
The Java service will start on port `8080`.

### 3. Python Agent Microservice (`agent-service`)
```bash
cd agent-service

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Export environment variables
export GEMINI_API_KEY="your_google_gemini_api_key"

# Start Uvicorn server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
The Python service will start on port `8000`.

### 4. React Developer Dashboard (`dashboard-react`)
```bash
cd dashboard-react

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Usage Instructions

### 1. Generate an API Key
Unauthenticated request to generate an `X-API-Key` required for subsequent endpoints:

```bash
curl -X POST http://localhost:8080/api/v1/keys/generate \
  -H "Content-Type: application/json" \
  -d '{
    "clientName": "DevCLI",
    "ownerEmail": "developer@example.com"
  }'
```
*Response returns the unhashed API key string (e.g. `sk_live_...`). Include this key in header `X-API-Key` for protected endpoints.*

### 2. Trigger an Automated PR Review
```bash
curl -X POST http://localhost:8080/api/v1/review \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sk_live_your_generated_key" \
  -d '{
    "prUrl": "https://github.com/rachit-890/AICodeReviewBot/pull/1"
  }'
```

### 3. Index Codebase Repository for RAG
Synchronously index repository source code into PostgreSQL PgVector:

```bash
curl -X POST http://localhost:8080/api/v1/rag/index \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sk_live_your_generated_key" \
  -d '{
    "repository": "rachit-890/AICodeReviewBot",
    "repoPath": "/path/to/local/cloned/repo",
    "sync": true
  }'
```

### 4. Query RAG Codebase Chat
```bash
curl -X POST http://localhost:8080/api/v1/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sk_live_your_generated_key" \
  -d '{
    "repository": "rachit-890/AICodeReviewBot",
    "query": "How does ApiKeyAuthFilter validate requests?"
  }'
```

### 5. Explain Code Snippet (Doc Studio)
```bash
curl -X POST http://localhost:8080/api/v1/doc/explain \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sk_live_your_generated_key" \
  -d '{
    "code": "public boolean isAllowed(String id) { return redis.opsForValue().increment(id) <= 10; }",
    "language": "java"
  }'
```

---

## Support Information

If you encounter issues or find bugs during local setup or deployment:

- **GitHub Issues**: Submit bug reports and feature requests directly at [github.com/rachit-890/AICodeReviewBot/issues](https://github.com/rachit-890/AICodeReviewBot/issues).
- **Maintainer**: Rachit ([@rachit-890](https://github.com/rachit-890)).

---

## Project Status & Known Limitations

The platform is operational in production, but several architectural trade-offs and configuration drift items should be noted by developers:

1. **Spring Security Layer Delegation**: In `SecurityConfig.java`, Spring Security's authorization chain explicitly ends with `.anyRequest().permitAll()`. Framework-level authorization checking is bypassed, and all request authentication and rate-limiting enforcement is performed singularly within `ApiKeyAuthFilter`.
2. **Model Differentiation**: The Java core backend calls Google `gemini-2.5-flash` for review generation and `text-embedding-004` for RAG vector embeddings via LangChain4j. The Python microservice independently calls `gemini-1.5-flash` via LangGraph.
3. **Render Free-Tier Storage Expiration**: Managed PostgreSQL instances hosted on Render's free tier expire after a fixed duration (~30 days from creation). When expired, connection attempts will fail with pool initialization errors until re-provisioned or upgraded.
4. **Inactive CI/CD Workflow**: The deployment workflow `deploy.yml` is stored at `prReviewBot/.github/workflows/deploy.yml`. Because GitHub Actions requires workflow files to be located at `.github/workflows/` in the repository root, automated builds do not currently run on push.
5. **Legacy Dashboard Folder**: The root `/dashboard` folder contains an unintegrated static HTML/Python prototype. The active production UI resides in `/dashboard-react`.

---

## Contribution Guidelines

Contributions are welcome. Since this project is maintained as a solo portfolio project, please follow these guidelines:

1. **Branching & Pull Requests**: Fork the repository, create a descriptive topic branch (`feature/xyz` or `fix/abc`), and submit a pull request against `main`.
2. **Java Package Conventions**: New Java components must reside inside `com.proj.prreviewbot` and adhere to established layer separation (`controller`, `service`, `dto`, `entity`, `config`).
3. **Code Formatting**: Ensure Java code compiles with Maven (`mvn compile`) and frontend changes pass Oxlint (`npm run lint`).

---

## Acknowledgments

This project relies on the following open-source frameworks and cloud platforms:

- [Google Gemini API](https://ai.google.dev/) — Generative AI models (`gemini-2.5-flash`, `gemini-1.5-flash`, `text-embedding-004`)
- [LangChain4j](https://github.com/langchain4j/langchain4j) — Java LLM and PgVector abstraction library
- [LangGraph](https://github.com/langchain-ai/langgraph) & [FastAPI](https://fastapi.tiangolo.com/) — Stateful Python multi-agent orchestration
- [PostgreSQL PgVector](https://github.com/pgvector/pgvector) — Vector database extension
- [Flyway](https://flywaydb.org/) — Database schema migration management
- [HikariCP](https://github.com/brettwooldridge/HikariCP) — High-performance JDBC connection pooling
- [Lettuce Redis Client](https://redis.uio.no/lettuce/) — Scalable Redis client
- [Vite](https://vitejs.dev/) & [React](https://react.dev/) — Frontend build tooling and UI framework
- [Render](https://render.com/) — Cloud infrastructure hosting

---

## License Information

*No `LICENSE` file is currently present in this repository.* All rights are reserved by the maintainer ([@rachit-890](https://github.com/rachit-890)). Standard open-source license terms (such as MIT or Apache 2.0) may be applied in future releases.
