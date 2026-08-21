# BioDataHub — System Architecture

**Project:** BioDataHub
**Architecture Version:** MVP v0.1
**Status:** In Development
**Last Updated:** 2026-08-21

---

## 1. Architecture Overview

BioDataHub is a backend-driven biological data discovery platform.

The system provides a unified API through which clients can search for biological records without needing to interact directly with external biological databases.

The current MVP integrates with the National Center for Biotechnology Information (NCBI) Gene database.

The architecture is intentionally layered so that additional biological data providers can be integrated in the future without significantly changing the API layer.

---

## 2. Current Architecture

The current MVP follows a layered architecture:

```text
┌──────────────────────────┐
│         Client           │
│                          │
│ Browser / Swagger / API  │
└────────────┬─────────────┘
             │
             │ HTTP
             ▼
┌──────────────────────────┐
│       FastAPI API        │
│                          │
│ app/main.py              │
│                          │
│ /health                  │
│ /search                  │
└────────────┬─────────────┘
             │
             │ Function call
             ▼
┌──────────────────────────┐
│      Service Layer       │
│                          │
│ ncbi_service.py          │
│                          │
│ Search                   │
│ Scoring                  │
│ Ranking                  │
│ Normalization            │
└────────────┬─────────────┘
             │
             │ Function call
             ▼
┌──────────────────────────┐
│    Integration Layer     │
│                          │
│ ncbi_client.py           │
│                          │
│ ESearch                  │
│ ESummary                 │
└────────────┬─────────────┘
             │
             │ HTTPS
             ▼
┌──────────────────────────┐
│          NCBI            │
│                          │
│     E-Utilities API      │
└──────────────────────────┘
```

---

## 3. Architectural Layers

BioDataHub currently consists of four primary application layers:

- API Layer
- Service Layer
- Integration Layer
- Data Model Layer

Each layer has a specific responsibility.

---

## 4. API Layer

**Location:** `app/main.py`

**Responsibility**

The API layer is responsible for communication with clients.

It handles:

- HTTP routing
- Request parameters
- Basic request validation
- Calling application services
- Returning structured responses

**Current endpoints:**

- `GET /health`
- `GET /search`

The API layer should remain relatively thin. Business logic should not be placed directly inside route handlers when that logic can be handled by the service layer.

---

## 5. Service Layer

**Location:** `app/services/`

**Current service:** `app/services/ncbi_service.py`

**Responsibility**

The service layer contains BioDataHub's application and business logic.

It is responsible for:

- Calling the appropriate integration functions
- Processing external API responses
- Limiting result sets
- Calculating relevance scores
- Ranking results
- Normalizing external data
- Creating validated application responses

The main function currently implemented is:

```python
search_genes(query: str)
```

---

## 6. Relevance Scoring

The service layer currently contains the search ranking algorithm.

```text
Search result
      │
      ▼
Calculate score
      │
      ├── Exact name match     +10
      ├── Partial name match    +5
      ├── Description match     +3
      └── Human organism        +2
      │
      ▼
Sort descending
      │
      ▼
Return ranked results
```

This approach allows BioDataHub to improve the quality of search results without changing the external NCBI integration.

The scoring system is intentionally simple for the MVP. Future versions may introduce more sophisticated ranking mechanisms.

---

## 7. Integration Layer

**Location:** `app/integrations/`

**Current integration:** `app/integrations/ncbi_client.py`

**Responsibility**

The integration layer communicates directly with external biological data providers.

The integration layer should contain:

- Provider-specific URLs
- Provider-specific parameters
- HTTP requests
- Provider-specific response handling

The rest of the application should not need to know how NCBI's API works internally.

---

## 8. NCBI Integration

BioDataHub currently communicates with NCBI through the E-Utilities API.

**Base URL:** `https://eutils.ncbi.nlm.nih.gov/entrez/eutils`

The MVP uses two NCBI operations:

- ESearch
- ESummary

---

## 9. NCBI ESearch Flow

When a user searches for a gene, BioDataHub first sends a search request to NCBI.

Example:

```
BRCA1[Gene]
```

The response contains NCBI Gene identifiers.

Example:

```
672
497672
403437
373983
...
```

These identifiers are then passed to ESummary.

---

## 10. NCBI ESummary Flow

The retrieved Gene identifiers are submitted to ESummary.

Example:

```
672,497672,403437
```

NCBI returns metadata associated with those records.

BioDataHub extracts information such as:

- Gene identifier
- Gene name
- Organism
- Description

The resulting information is then passed to the service layer.

---

## 11. Data Model Layer

**Location:** `app/models/`

**Current schema:** `app/models/schemas.py`

Pydantic models define the standardized data returned by BioDataHub.

Current model: `Gene`

The search response is represented by: `SearchResponse`

---

## 12. Data Normalization

External providers may return different data structures.

BioDataHub therefore uses an internal standardized representation.

Current normalized Gene object:

```json
{
  "id": "672",
  "name": "BRCA1",
  "organism": "Homo sapiens",
  "description": "BRCA1 DNA repair associated",
  "type": "gene",
  "source": "ncbi"
}
```

This abstraction allows clients to consume BioDataHub's API without needing to understand the structure of NCBI's response.

---

## 13. Request Lifecycle

A typical search request follows this process:

```text
1. Client
   │
   │ GET /search?q=BRCA1&type=gene
   ▼
2. FastAPI
   │
   │ Validate query
   ▼
3. search_genes()
   │
   │ Call ESearch
   ▼
4. NCBI ESearch
   │
   │ Return Gene IDs
   ▼
5. search_genes()
   │
   │ Limit IDs
   │
   │ Call ESummary
   ▼
6. NCBI ESummary
   │
   │ Return Gene metadata
   ▼
7. Service Layer
   │
   │ Score results
   │ Rank results
   │ Normalize data
   ▼
8. Pydantic Models
   │
   │ Validate response
   ▼
9. FastAPI
   │
   │ JSON response
   ▼
10. Client
```

---

## 14. Separation of Responsibilities

The architecture intentionally separates responsibilities.

**API Layer** — Responsible for:
- HTTP
- Routing
- Request handling

**Service Layer** — Responsible for:
- Business logic
- Search processing
- Ranking
- Normalization

**Integration Layer** — Responsible for:
- External APIs
- HTTP communication
- Provider-specific logic

**Model Layer** — Responsible for:
- Data structures
- Validation
- Response schemas

This separation makes the application easier to test, maintain, and extend.

---

## 15. Project Structure

Current architecture:

```text
BioDataHub/
│
├── app/
│   │
│   ├── main.py
│   │
│   ├── integrations/
│   │   └── ncbi_client.py
│   │
│   ├── models/
│   │   └── schemas.py
│   │
│   └── services/
│       └── ncbi_service.py
│
├── docs/
│   ├── PRODUCT.md
│   ├── SOFTWARE_SPECIFICATION.md
│   └── ARCHITECTURE.md
│
└── venv/
```

---

## 16. Current Data Flow

The current data flow is:

```text
User Query
    │
    ▼
FastAPI
    │
    ▼
NCBI Service
    │
    ├──────────────► NCBI ESearch
    │                     │
    │                     ▼
    │                 Gene IDs
    │                     │
    │                     ▼
    └──────────────► NCBI ESummary
                          │
                          ▼
                     Gene Metadata
                          │
                          ▼
                    Score + Rank
                          │
                          ▼
                      Normalize
                          │
                          ▼
                   Pydantic Schema
                          │
                          ▼
                     JSON Response
```

---

## 17. External Provider Abstraction

One of the primary architectural goals of BioDataHub is to avoid coupling the public API directly to a single provider.

Currently:

```text
BioDataHub API
      │
      ▼
NCBI Service
      │
      ▼
NCBI
```

The future architecture should introduce provider-independent services.

For example:

```text
                    ┌── NCBI
                    │
                    ├── EBI
                    │
BioDataHub Service ─┼── Ensembl
                    │
                    └── UniProt
```

Each provider would have its own integration module.

---

## 18. Future Multi-Provider Architecture

The planned architecture is:

```text
                         Client
                           │
                           ▼
                    ┌─────────────┐
                    │   FastAPI   │
                    │  API Layer  │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Service   │
                    │    Layer    │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
          NCBI Service   EBI Service  Other Services
              │            │            │
              ▼            ▼            ▼
            NCBI          EBI       Other APIs
              │            │            │
              └────────────┼────────────┘
                           ▼
                     Normalization
                           │
                           ▼
                    Unified Response
```

This architecture allows additional data sources to be added independently.

---

## 19. Caching Architecture

Caching is not currently implemented.

Redis is planned as a future caching layer.

The planned flow is:

```text
Client
   │
   ▼
FastAPI
   │
   ▼
Check Redis
   │
   ├──── Cache Hit ────► Return Result
   │
   └──── Cache Miss
            │
            ▼
          NCBI
            │
            ▼
       Normalize Data
            │
            ▼
       Store in Redis
            │
            ▼
       Return Result
```

Caching will help:

- Reduce external API requests
- Improve response times
- Reduce dependency on external providers
- Handle repeated queries efficiently

---

## 20. Future Persistence Layer

The MVP does not require a persistent database.

The initial system retrieves data directly from external providers.

Future versions may introduce persistent storage for:

- Cached records
- Search history
- User-created collections
- Dataset metadata
- API usage statistics
- Provider synchronization

Potential future architecture:

```text
FastAPI
   │
   ├── Redis
   │
   └── PostgreSQL
```

The choice of persistent storage will be evaluated when the product requirements justify it.

---

## 21. Frontend Architecture

The frontend is not yet implemented.

The planned frontend will be a responsive web application.

Potential architecture:

```text
┌─────────────────────────────┐
│          Browser            │
│                             │
│      React Frontend         │
└──────────────┬──────────────┘
               │
               │ REST API
               ▼
┌─────────────────────────────┐
│          FastAPI            │
│          Backend            │
└──────────────┬──────────────┘
               │
               ▼
        Biological APIs
```

The frontend will consume BioDataHub's REST API rather than communicating directly with NCBI.

This keeps provider-specific implementation on the backend.

---

## 22. Deployment Architecture

The application is currently being developed and tested locally.

Development environment:

```text
Windows
   │
   ▼
Python Virtual Environment
   │
   ▼
FastAPI
   │
   ▼
Uvicorn
   │
   ▼
NCBI
```

The planned production architecture is:

```text
                     Internet
                        │
                        ▼
                  Domain / HTTPS
                        │
                        ▼
                  Reverse Proxy
                     Nginx
                        │
                        ▼
                  FastAPI App
                   Container
                        │
             ┌──────────┴──────────┐
             ▼                     ▼
          Redis                   NCBI
             │
             ▼
       Future Services
```

---

## 23. Containerization

Docker is planned for production deployment.

The application should eventually run as a Docker container.

Expected structure:

```text
Docker
   │
   ▼
BioDataHub Container
   │
   ├── FastAPI
   └── Uvicorn
```

Redis and future infrastructure components can be deployed as separate containers.

Docker Compose may be used for local multi-service development.

---

## 24. Scalability

The backend is intended to remain stateless.

This allows multiple application instances to run simultaneously.

Example:

```text
                    Load Balancer
                         │
             ┌───────────┼───────────┐
             ▼           ▼           ▼
          API #1       API #2      API #3
             │           │           │
             └───────────┼───────────┘
                         │
                       Redis
                         │
                         ▼
                        NCBI
```

Stateless application instances can therefore be scaled horizontally.

---

## 25. Reliability Architecture

External APIs introduce an important reliability dependency.

Future versions should include:

```text
Request
   │
   ▼
Provider
   │
   ├── Success ──────► Response
   │
   └── Failure
          │
          ▼
       Retry
          │
          ├── Success ──► Response
          │
          └── Failure
                 │
                 ▼
           Standard Error
```

Potential reliability mechanisms:

- Connection timeouts
- Retry policies
- Exponential backoff
- Circuit breakers
- Provider health monitoring
- Cached responses

---

## 26. Security Architecture

The current MVP does not require authentication.

Before production deployment, the architecture should include:

```text
Client
   │
   ▼
HTTPS
   │
   ▼
Reverse Proxy
   │
   ▼
Rate Limiting
   │
   ▼
Authentication
   │
   ▼
FastAPI
```

Security controls should include:

- HTTPS
- Input validation
- Rate limiting
- Authentication
- API key management
- Secret management
- Dependency security
- Logging and monitoring

---

## 27. Observability

Observability is planned for later development.

The production system should eventually provide:

**Logging**

Track:

- API requests
- Response status
- External API failures
- Exceptions
- Performance

**Metrics**

Track:

- Request count
- Response latency
- Error rate
- NCBI request rate
- Cache hit rate
- Search volume

**Health Checks**

The existing `GET /health` endpoint provides the foundation for service health monitoring.

---

## 28. Architectural Decisions

**Decision 1 — FastAPI**

FastAPI was selected because it provides:

- Native asynchronous support
- Automatic OpenAPI documentation
- Pydantic integration
- Strong Python ecosystem
- Good performance

**Decision 2 — Layered Architecture**

A layered architecture was selected to separate:

- API concerns
- Business logic
- External integrations
- Data models

This makes future provider integrations easier.

**Decision 3 — Direct NCBI Integration for MVP**

NCBI was selected as the first provider to keep the MVP focused.

Rather than implementing multiple providers simultaneously, the project first establishes a reliable end-to-end pipeline with one provider.

**Decision 4 — No Database for Initial MVP**

The initial application does not require persistent storage.

This reduces unnecessary infrastructure while the core product is being validated.

Persistent storage can be introduced when the product requires it.

**Decision 5 — Rule-Based Ranking**

A deterministic scoring algorithm was selected for the MVP because it is:

- Easy to understand
- Easy to test
- Explainable
- Lightweight
- Independent of machine learning infrastructure

---

## 29. Current Architecture Status

| Component | Status |
|---|---|
| FastAPI API layer | Implemented |
| Service layer | Implemented |
| NCBI integration | Implemented |
| ESearch | Implemented |
| ESummary | Implemented |
| Pydantic models | Implemented |
| Search normalization | Implemented |
| Rule-based ranking | Implemented |
| Redis | Planned |
| PostgreSQL | Planned |
| Frontend | Planned |
| EBI integration | Planned |
| Additional providers | Planned |
| Docker | Planned |
| CI/CD | Planned |
| Production infrastructure | Planned |
| Monitoring | Planned |

---

## 30. Architecture Evolution

BioDataHub is being developed incrementally.

**Phase 1 — Current MVP**

```text
FastAPI
   ↓
NCBI
```

**Phase 2 — Frontend**

```text
React
   ↓
FastAPI
   ↓
NCBI
```

**Phase 3 — Performance**

```text
React
   ↓
FastAPI
   ↓
Redis
   ↓
NCBI
```

**Phase 4 — Multi-Provider**

```text
                    ┌── NCBI
                    │
FastAPI → Services ─┼── EBI
                    │
                    └── Other Providers
```

**Phase 5 — Production Platform**

```text
                   Internet
                      │
                      ▼
                HTTPS / Nginx
                      │
                      ▼
                 Load Balancer
                      │
            ┌─────────┼─────────┐
            ▼         ▼         ▼
          API #1    API #2    API #3
            │         │         │
            └─────────┼─────────┘
                      │
               ┌──────┴──────┐
               ▼             ▼
             Redis       PostgreSQL
               │
               ▼
        External Providers
```

---

## 31. Architectural Goal

The long-term architectural goal of BioDataHub is to provide a provider-independent biological data access layer.

Instead of requiring applications to understand the individual APIs and data structures of:

- NCBI
- EBI
- Ensembl
- UniProt
- ...

they should be able to communicate with BioDataHub through a consistent API.

```text
             External Biological Databases


       NCBI     EBI     Ensembl     UniProt
         │        │         │          │
         └────────┴─────────┴──────────┘
                       │
                       ▼
                 ┌───────────┐
                 │ BioDataHub│
                 │    API    │
                 └─────┬─────┘
                       │
                       ▼
              Standardized Data
```

This provider abstraction is the central architectural principle of the project.