from fastapi import FastAPI, Query
from app.services.ncbi_service import search_genes

app = FastAPI()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/search")
async def search(q: str = Query(...), type: str = "gene"):
    if type != "gene":
        return {
            "error": "Only gene search is implemented in MVP",
            "source": "ncbi"
        }

    return await search_genes(q)