# BioDataHub

> A unified biological data discovery and retrieval platform.

BioDataHub is an open-source platform for discovering and retrieving biological data through a standardized API.

The project aims to simplify access to biological databases by providing a unified interface over multiple scientific data providers such as NCBI, EBI, Ensembl, and UniProt.

The current MVP focuses on gene search through the NCBI Gene database.

---

## Why BioDataHub?

Biological data is distributed across many specialized databases, each with its own:

- API
- Query syntax
- Response format
- Data structures
- Access patterns

For researchers, students, bioinformatics beginners, and developers, working with multiple providers can therefore require significant domain and technical knowledge.

BioDataHub aims to provide a common interface:

```text
Client
   ↓
BioDataHub API
   ↓
Biological Data Providers
   ├── NCBI
   ├── EBI
   ├── Ensembl
   └── UniProt
```

Instead of integrating with each provider independently, applications can eventually consume standardized BioDataHub responses.

---

## Current MVP

The current implementation provides a working backend for gene search using NCBI.

### Implemented

- FastAPI REST API
- NCBI E-Utilities integration
- Gene search
- NCBI ESearch
- NCBI ESummary
- Standardized gene response schema
- Relevance scoring
- Result ranking
- Health check endpoint
- Automatic API documentation through FastAPI
- Layered backend architecture

### Currently in development

- Responsive web interface
- Improved error handling
- Automated testing
- Additional API endpoints
- Backend refinement

### Planned

- EBI integration
- Additional biological data providers
- Redis caching
- Gene detail endpoints
- Organism search
- Protein search
- Persistent storage where required
- Authentication and API keys
- Rate limiting
- Docker
- CI/CD
- Production deployment

---

## Features

### Gene Search

Search for genes using a gene name or symbol.

Example:

```http
GET /search?q=BRCA1&type=gene
```

BioDataHub queries NCBI and returns normalized results.

### Relevance Ranking

Search results are ranked using a deterministic scoring system.

Current scoring rules:

| Condition | Score |
|---|---|
| Exact gene name match | +10 |
| Partial gene name match | +5 |
| Query appears in description | +3 |
| Homo sapiens organism | +2 |

This allows highly relevant records to appear first while keeping the ranking system transparent and explainable.

### Standardized Responses

BioDataHub converts provider-specific responses into a consistent internal schema.

Example:

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

---

## API

### Health Check

```http
GET /health
```

Response:

```json
{
  "status": "ok"
}
```

### Search Genes

```http
GET /search?q=BRCA1&type=gene
```

Example response:

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

### API Documentation

When running the project locally, FastAPI automatically provides interactive API documentation.

Open:

```
http://127.0.0.1:8000/docs
```

The OpenAPI specification is also available at:

```
http://127.0.0.1:8000/openapi.json
```

---

## Architecture

BioDataHub currently uses a layered architecture:

```text
┌──────────────────────────┐
│         Client           │
│                          │
│ Browser / API / Swagger  │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│       FastAPI API        │
│                          │
│ /health                  │
│ /search                  │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│      Service Layer       │
│                          │
│ Search                   │
│ Scoring                  │
│ Ranking                  │
│ Normalization            │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│    Integration Layer     │
│                          │
│ NCBI ESearch             │
│ NCBI ESummary            │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│          NCBI            │
│      E-Utilities         │
└──────────────────────────┘
```

The architecture is designed so additional biological data providers can be integrated without coupling the public API directly to provider-specific implementations.

---

## Tech Stack

### Backend

- Python 3.11+
- FastAPI
- Pydantic
- httpx
- Uvicorn

### Biological Data

- NCBI E-Utilities
- NCBI Gene database

### Planned Infrastructure

- Redis
- Docker
- Nginx
- Cloud infrastructure
- CI/CD

### Planned Frontend

- React
- TypeScript

---

## Project Structure

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
├── .gitignore
├── README.md
└── venv/
```

The `venv/` directory is local development infrastructure and is excluded from version control.

---

## Local Development

### Requirements

You will need:

- Python 3.11+
- Git

### Clone the repository

```bash
git clone https://github.com/Adebobola/biodatahub.git
cd biodatahub
```

### Create a virtual environment

**Windows**

```bash
python -m venv venv
```

Activate it:

```bash
venv\Scripts\Activate.ps1
```

### Install dependencies

```bash
pip install fastapi uvicorn httpx pydantic
```

### Run the API

```bash
uvicorn app.main:app --reload
```

The API will be available at:

```
http://127.0.0.1:8000
```

Interactive documentation:

```
http://127.0.0.1:8000/docs
```

### Testing the API

Once the server is running, open:

```
http://127.0.0.1:8000/docs
```

You can test:

```http
GET /health
```

and:

```http
GET /search?q=BRCA1&type=gene
```

---

## Documentation

Detailed project documentation is available in the `docs/` directory.

### Product Requirements

`docs/PRODUCT.md`

Defines:

- Product vision
- Problem statement
- Target users
- Product goals
- MVP features
- Success metrics
- Product roadmap

### Software Specification

`docs/SOFTWARE_SPECIFICATION.md`

Defines:

- Functional requirements
- Non-functional requirements
- API specifications
- Data models
- Integration requirements
- Testing requirements
- Security requirements

### Architecture

`docs/ARCHITECTURE.md`

Defines:

- System architecture
- Application layers
- Data flow
- NCBI integration
- Future multi-provider architecture
- Caching
- Deployment
- Scalability

---

## Roadmap

### Phase 1 — MVP Backend

- [x] FastAPI backend
- [x] Health endpoint
- [x] NCBI integration
- [x] Gene search
- [x] NCBI ESearch
- [x] NCBI ESummary
- [x] Data normalization
- [x] Result scoring
- [x] Result ranking

### Phase 2 — Developer Experience

- [ ] Project documentation
- [ ] GitHub repository
- [ ] Improve README
- [ ] Automated tests
- [ ] Improved error handling
- [ ] API validation improvements

### Phase 3 — Web Interface

- [ ] Responsive frontend
- [ ] Search interface
- [ ] Search results
- [ ] Gene detail view
- [ ] Loading states
- [ ] Error states
- [ ] Mobile optimization
- [ ] API integration

### Phase 4 — Backend Expansion

- [ ] Gene detail endpoint
- [ ] Organism search
- [ ] Protein search
- [ ] Pagination
- [ ] Better ranking
- [ ] Confidence classification
- [ ] Standardized error responses

### Phase 5 — Multi-Provider Integration

- [ ] EBI integration
- [ ] Ensembl integration
- [ ] UniProt integration
- [ ] Provider abstraction
- [ ] Cross-provider normalization

### Phase 6 — Infrastructure

- [ ] Redis caching
- [ ] Docker
- [ ] Docker Compose
- [ ] CI/CD
- [ ] Rate limiting
- [ ] Authentication
- [ ] Monitoring
- [ ] Production deployment

---

## Design Principles

BioDataHub follows several core engineering principles:

**Provider abstraction**
Provider-specific logic should remain isolated from the public API.

**Standardization**
Different external data structures should be normalized into consistent BioDataHub schemas.

**Separation of concerns**
API routing, business logic, external integrations, and data models should remain separate.

**Explainability**
Search ranking should initially favor deterministic and understandable rules.

**Incremental development**
Infrastructure complexity should be introduced only when required by the product.

**Biological provenance**
Responses should retain information about the original data source.

---

## Project Status

Current status: **MVP Backend — NCBI Gene Search**

BioDataHub currently has a functioning local API capable of searching NCBI Gene records, ranking results, and returning standardized JSON responses.

The next major milestone is the development of the responsive web interface.

---

## Contributing

BioDataHub is currently under active development.

Contributions, suggestions, and technical discussions are welcome as the project evolves.

---

## License

License information will be added before the first public release.

---

## Final Repository Layout

Your root directory should now look like:

```text
BioDataHub/
│
├── app/
├── docs/
├── .gitignore
└── README.md
```