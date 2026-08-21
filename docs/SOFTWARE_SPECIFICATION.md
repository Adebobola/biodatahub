# BioDataHub — Software Requirements & Technical Specification

**Project:** BioDataHub
**Document:** Software Requirements & Technical Specification
**Version:** MVP v0.1
**Status:** In Development
**Last Updated:** 2026-08-21

---

## 1. Introduction

### 1.1 Purpose

This document defines the functional, non-functional, architectural, and technical requirements for BioDataHub.

BioDataHub is a biological data discovery and retrieval platform that provides a unified REST API for accessing biological information from external scientific databases.

The current MVP focuses on gene search using the National Center for Biotechnology Information (NCBI) Gene database.

This specification describes both the current implementation and the technical requirements for future development.

---

## 2. System Scope

### 2.1 Current Scope

The current MVP provides:

- REST API access
- Health monitoring
- Gene search
- NCBI integration
- NCBI ESearch integration
- NCBI ESummary integration
- Result normalization
- Relevance scoring
- Result ranking
- Structured JSON responses

### 2.2 Future Scope

Future versions are expected to support:

- Gene detail retrieval
- Organism search
- Protein search
- Disease search
- Pathway search
- Multiple biological data providers
- Response caching
- Authentication
- Rate limiting
- Persistent storage
- Web interface
- Production deployment

---

## 3. Technology Stack

### 3.1 Programming Language

Python 3.11+

Python is used for the backend because of its strong ecosystem for:

- Bioinformatics
- Data processing
- Scientific computing
- API development
- Machine learning

### 3.2 Web Framework

FastAPI

FastAPI is responsible for:

- HTTP routing
- Request validation
- API definition
- Response serialization
- OpenAPI documentation

### 3.3 Data Validation

Pydantic

Pydantic is used to define and validate BioDataHub's response models.

### 3.4 HTTP Client

httpx

`httpx` is used for asynchronous communication with external biological data providers.

### 3.5 Application Server

Uvicorn

Uvicorn is used to run the FastAPI application locally and will later be used as part of the production deployment architecture.

### 3.6 External Data Provider

National Center for Biotechnology Information (NCBI)

BioDataHub currently uses the NCBI E-Utilities API.

The MVP uses:

- ESearch
- ESummary

---

## 4. System Architecture

BioDataHub currently follows a layered architecture.

```text
Client
   |
   v
FastAPI API Layer
   |
   v
Service Layer
   |
   v
Integration Layer
   |
   v
NCBI E-Utilities
```

---

## 5. Project Structure

Current project structure:

```text
BioDataHub/
│
├── app/
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

## 6. Component Specifications

### 6.1 API Layer

**File:** `app/main.py`

**Responsibilities:**

- Initialize FastAPI
- Define HTTP endpoints
- Validate query parameters
- Route requests to services
- Return API responses

**Current endpoints:**

- `GET /health`
- `GET /search`

---

## 7. Health Endpoint

**Endpoint**

```http
GET /health
```

**Purpose**

Provides a lightweight mechanism for determining whether the application is running.

**Response**

```json
{
  "status": "ok"
}
```

**HTTP Status**

`200 OK`

---

## 8. Gene Search Endpoint

**Endpoint**

```http
GET /search
```

**Parameters**

`q`
- Required.
- Type: `string`
- Description: Search query representing a gene name or gene symbol.
- Example: `BRCA1`

`type`
- Optional.
- Default: `gene`
- Currently supported value: `gene`

**Example Request**

```http
GET /search?q=BRCA1&type=gene
```

**Example Response**

```json
{
  "query": "BRCA1",
  "count": 1,
  "results": [
    {
      "id": "672",
      "name": "BRCA1",
      "organism": "Homo sapiens",
      "description": "BRCA1 DNA repair associated",
      "type": "gene",
      "source": "ncbi"
    }
  ]
}
```

---

## 9. API Response Models

BioDataHub uses Pydantic models to define the standardized API response.

### 9.1 Gene

Current model:

```python
class Gene(BaseModel):
    id: str
    name: str
    organism: str
    description: str | None = None
    type: str = "gene"
    source: str = "ncbi"
```

**Fields**

| Field | Type | Required | Description |
|---|---|---|---|
| id | string | Yes | NCBI Gene identifier |
| name | string | Yes | Gene name |
| organism | string | Yes | Scientific organism name |
| description | string/null | No | Gene description |
| type | string | No | Biological entity type |
| source | string | No | Original data provider |

### 9.2 SearchResponse

```python
class SearchResponse(BaseModel):
    query: str
    count: int
    results: List[Gene]
```

**Fields**

| Field | Type | Description |
|---|---|---|
| query | string | Original search query |
| count | integer | Number of returned results |
| results | array | Normalized gene records |

---

## 10. NCBI Integration

### 10.1 Integration Module

**File:** `app/integrations/ncbi_client.py`

The integration layer is responsible for communicating directly with NCBI.

**Base URL:** `https://eutils.ncbi.nlm.nih.gov/entrez/eutils`

---

## 11. NCBI ESearch

**Function:**

```python
async def esearch(query: str)
```

**Purpose:**

Retrieve NCBI Gene identifiers matching the search query.

The current query is constructed as:

```
{query}[Gene]
```

For example:

```
BRCA1[Gene]
```

The request uses:

- `db=gene`
- `retmode=json`

---

## 12. NCBI ESummary

**Function:**

```python
async def esummary(gene_ids: list[str])
```

**Purpose:**

Retrieve summary information for the Gene identifiers returned by ESearch.

Multiple identifiers are submitted in a comma-separated list.

Example:

```
672,497672,403437
```

The response is then processed by the service layer.

---

## 13. Service Layer

**File:** `app/services/ncbi_service.py`

**Primary function:**

```python
async def search_genes(query: str)
```

**Responsibilities:**

- Submit search request.
- Extract NCBI identifiers.
- Limit the number of identifiers retrieved.
- Request summaries.
- Calculate relevance scores.
- Sort results.
- Normalize the response.
- Return a SearchResponse.

---

## 14. Result Limit

The current implementation limits processing to the first ten NCBI identifiers.

```python
id_list = id_list[:10]
```

This is intended to:

- Limit external API requests.
- Reduce response size.
- Improve initial response performance.
- Provide a manageable result set for the MVP.

Future versions may introduce pagination.

---

## 15. Relevance Scoring

BioDataHub currently uses deterministic rule-based scoring.

**Function:**

```python
def score_gene(query: str, gene: dict) -> int
```

### 15.1 Exact Name Match

If the gene name exactly matches the query: `+10`

Example:

```
Query: BRCA1
Gene: BRCA1
```

### 15.2 Partial Name Match

If the query appears within the gene name: `+5`

### 15.3 Description Relevance

If the query appears in the gene description: `+3`

### 15.4 Human Organism Priority

If the organism is `Homo sapiens`, the result receives: `+2`

### 15.5 Ranking

After calculating scores, results are sorted in descending order:

```python
results_with_score.sort(
    key=lambda x: x[0],
    reverse=True
)
```

The highest-scoring result is therefore returned first.

---

## 16. Current Search Flow

For a request such as:

```http
GET /search?q=BRCA1&type=gene
```

the system performs:

```text
1. Receive HTTP request
        ↓
2. Validate query
        ↓
3. Call search_genes()
        ↓
4. Call NCBI ESearch
        ↓
5. Retrieve Gene IDs
        ↓
6. Limit to first 10 IDs
        ↓
7. Call NCBI ESummary
        ↓
8. Calculate relevance scores
        ↓
9. Sort results
        ↓
10. Normalize NCBI data
        ↓
11. Validate with Pydantic
        ↓
12. Return JSON response
```

---

## 17. Functional Requirements

**FR-001 — Health Monitoring**
The system shall provide a health endpoint.
Status: Implemented

**FR-002 — Gene Search**
The system shall accept gene search queries through the REST API.
Status: Implemented

**FR-003 — NCBI Search**
The system shall retrieve matching Gene identifiers from NCBI.
Status: Implemented

**FR-004 — Gene Metadata Retrieval**
The system shall retrieve gene metadata using NCBI ESummary.
Status: Implemented

**FR-005 — Data Normalization**
The system shall convert external NCBI responses into BioDataHub's standard Gene schema.
Status: Implemented

**FR-006 — Relevance Ranking**
The system shall calculate relevance scores and order search results accordingly.
Status: Implemented

**FR-007 — Structured API Responses**
The system shall return structured JSON responses.
Status: Implemented

**FR-008 — Confidence Classification**
The system shall eventually assign confidence classifications to search results.
Status: Planned

**FR-009 — Multiple Data Sources**
The system shall eventually support multiple biological data providers.
Status: Planned

---

## 18. Non-Functional Requirements

**NFR-001 — Performance**
The system should target an API response time of less than 2–3 seconds under normal conditions. Actual performance will depend partly on external NCBI response latency.

**NFR-002 — Scalability**
The backend should remain stateless where possible so that multiple application instances can be deployed horizontally.

**NFR-003 — Reliability**
External API failures should be handled gracefully. Future versions should implement:

- Timeouts
- Retry policies
- Provider failure handling
- Fallback behavior

**NFR-004 — Maintainability**
The application shall maintain separation between:

- API routes
- Business logic
- External integrations
- Data models

**NFR-005 — Extensibility**
Additional biological data providers should be addable without significantly modifying the API layer.

**NFR-006 — Security**
Future production versions should implement:

- Input validation
- Rate limiting
- API authentication
- API keys
- Request quotas

---

## 19. Error Handling Requirements

Current external requests use a ten-second timeout:

```python
httpx.AsyncClient(timeout=10)
```

HTTP failures currently use:

```python
res.raise_for_status()
```

Future error handling should provide standardized BioDataHub errors for:

- Invalid queries
- Empty queries
- NCBI timeouts
- NCBI service failures
- Malformed external responses
- Unsupported search types

---

## 20. Testing Requirements

The project should eventually include automated testing.

**Unit Tests**

Tests should cover:

- `score_gene()`
- Response normalization
- Empty search results
- Ranking behavior
- Schema validation

**Integration Tests**

Tests should cover:

- FastAPI `/health`
- `/search`
- NCBI integration

External NCBI calls should be mocked where appropriate.

**API Tests**

Example:

```
GET /health → 200
GET /search?q=BRCA1&type=gene → 200
GET /search?q= → validation error
```

---

## 21. Security Requirements

The MVP does not currently implement authentication.

Before production deployment, the API should implement:

- Request validation
- Rate limiting
- API authentication
- API key management
- Usage quotas
- Secure configuration
- Secret management
- HTTPS

Sensitive configuration should not be committed to source control.

---

## 22. Performance and Scalability Roadmap

Future performance improvements include:

**Caching**

Redis can cache frequently requested search results.

```text
Client
 ↓
FastAPI
 ↓
Redis
 ↓
NCBI
```

**Pagination**

Allow clients to request different result pages instead of processing a fixed ten-result set.

**Connection Optimization**

HTTP connection reuse can reduce repeated external connection overhead.

**Asynchronous Processing**

The current use of `httpx.AsyncClient` provides an asynchronous foundation.

---

## 23. Planned Multi-Provider Architecture

The current architecture:

```text
BioDataHub
    ↓
NCBI
```

will eventually become:

```text
                    ┌── NCBI
                    │
BioDataHub ──────────┼── EBI
                    │
                    ├── Ensembl
                    │
                    └── UniProt
```

Each provider should have its own integration module.

The service layer will be responsible for combining and normalizing provider responses.

---

## 24. Current Implementation Status

| Component | Status |
|---|---|
| Python environment | Complete |
| FastAPI | Complete |
| Uvicorn | Complete |
| Pydantic schemas | Complete |
| NCBI client | Complete |
| ESearch | Complete |
| ESummary | Complete |
| Gene search | Complete |
| Result normalization | Complete |
| Relevance scoring | Complete |
| Result ranking | Complete |
| Confidence scoring | Planned |
| Error handling improvements | Planned |
| Automated tests | Planned |
| Redis caching | Planned |
| Gene detail endpoint | Planned |
| Web UI | Planned |
| EBI integration | Planned |
| Docker | Planned |
| CI/CD | Planned |
| Production deployment | Planned |

---

## 25. Engineering Principles

BioDataHub development should follow these principles:

- Keep provider-specific logic inside integration modules.
- Keep business logic inside service modules.
- Keep API routes thin.
- Use explicit data schemas.
- Preserve biological data provenance.
- Prefer asynchronous I/O for external APIs.
- Keep the system provider-agnostic at the API layer.
- Test business logic independently of external providers.
- Avoid premature infrastructure complexity.
- Build the MVP as a foundation for multi-source biological data integration.

---

## 26. Current Development Stage

BioDataHub is currently at:

**MVP Backend — NCBI Gene Search**

The system has successfully demonstrated the core data retrieval pipeline:

```text
Query
  ↓
NCBI
  ↓
Retrieve
  ↓
Score
  ↓
Rank
  ↓
Normalize
  ↓
JSON API
```

The next immediate development priorities are:

- Complete project documentation.
- Initialize Git repository.
- Push project to GitHub.
- Create project README.
- Build responsive frontend.
- Connect frontend to the local API.
- Return to backend refinement.