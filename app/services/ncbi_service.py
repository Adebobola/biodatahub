from app.integrations.ncbi_client import esearch, esummary
from app.models.schemas import Gene, SearchResponse


# 🔹 Scoring function (MUST be outside)
def score_gene(query: str, gene: dict) -> int:
    score = 0

    name = (gene.get("name") or "").lower()
    desc = (gene.get("description") or "").lower()
    organism = gene.get("organism", {}).get("scientificname", "").lower()

    query_lower = query.lower()

    # Exact match (highest priority)
    if name == query_lower:
        score += 10

    # Partial match
    elif query_lower in name:
        score += 5

    # Description relevance
    if query_lower in desc:
        score += 3

    # Human priority
    if "homo sapiens" in organism:
        score += 2

    return score


async def search_genes(query: str) -> SearchResponse:
    # 1. Search
    search_data = await esearch(query)

    id_list = search_data.get("esearchresult", {}).get("idlist", [])

    if not id_list:
        return SearchResponse(
            query=query,
            count=0,
            results=[]
        )

    # 2. Limit results
    id_list = id_list[:10]

    # 3. Fetch summaries
    summary_data = await esummary(id_list)

    result_dict = summary_data.get("result", {})
    uids = result_dict.get("uids", [])

    # 4. Score + collect
    results_with_score = []

    for uid in uids:
        gene = result_dict.get(uid)

        if not gene:
            continue

        score = score_gene(query, gene)

        results_with_score.append((score, uid, gene))

    # 5. Sort by score (highest first)
    results_with_score.sort(key=lambda x: x[0], reverse=True)

    # 6. Normalize output
    results = []

    for score, uid, gene in results_with_score:
        results.append(
            Gene(
                id=uid,
                name=gene.get("name"),
                organism=gene.get("organism", {}).get("scientificname", "unknown"),
                description=gene.get("description"),
            )
        )

    # 7. Return response
    return SearchResponse(
        query=query,
        count=len(results),
        results=results
    )