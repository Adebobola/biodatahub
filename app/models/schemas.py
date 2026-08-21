from pydantic import BaseModel
from typing import List


class Gene(BaseModel):
    id: str
    name: str
    organism: str
    description: str | None = None
    type: str = "gene"
    source: str = "ncbi"


class SearchResponse(BaseModel):
    query: str
    count: int
    results: List[Gene]