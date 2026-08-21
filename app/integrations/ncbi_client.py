import httpx

BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"


async def esearch(query: str):
    url = f"{BASE_URL}/esearch.fcgi"

    params = {
        "db": "gene",
        "term": f"{query}[Gene]",
        "retmode": "json"
    }

    async with httpx.AsyncClient(timeout=10) as client:
        res = await client.get(url, params=params)
        res.raise_for_status()
        return res.json()


async def esummary(gene_ids: list[str]):
    url = f"{BASE_URL}/esummary.fcgi"

    params = {
        "db": "gene",
        "id": ",".join(gene_ids),
        "retmode": "json"
    }

    async with httpx.AsyncClient(timeout=10) as client:
        res = await client.get(url, params=params)
        res.raise_for_status()
        return res.json()