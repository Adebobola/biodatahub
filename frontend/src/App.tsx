import { useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

interface Gene {
  id: string
  name: string
  organism: string
  description: string | null
  type: string
  source: string
}

interface SearchResponse {
  query: string
  count: number
  results: Gene[]
}

function App() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Gene[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!query.trim()) {
      return
    }

    setLoading(true)
    setError('')
    setResults([])

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/search?q=${encodeURIComponent(query)}&type=gene`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch search results')
      }

      const data: SearchResponse = await response.json()

      setResults(data.results)
    } catch (err) {
      console.error(err)
      setError('Unable to search BioDataHub. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="app">
      <section className="hero-section">
        <div className="hero-content">
          <p className="eyebrow">BIOINFORMATICS DATA SEARCH</p>

          <h1>
            Search biological data.
            <br />
            <span>One API.</span>
          </h1>

          <p className="hero-description">
            BioDataHub provides a unified interface for discovering biological
            data from public scientific databases.
          </p>

          <form className="search-form" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search for a gene, e.g. BRCA1"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />

            <button type="submit" disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>

          <p className="search-hint">
            Try searching for <strong>BRCA1</strong>, <strong>TP53</strong>, or{' '}
            <strong>EGFR</strong>
          </p>
        </div>
      </section>

      <section className="results-section">
        <div className="results-container">
          {loading && (
            <div className="status-message">
              Searching NCBI...
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {!loading && !error && results.length > 0 && (
            <>
              <div className="results-header">
                <div>
                  <p className="results-label">SEARCH RESULTS</p>
                  <h2>
                    Results for <span>"{query}"</span>
                  </h2>
                </div>

                <p className="results-count">
                  {results.length} result{results.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="results-grid">
                {results.map((gene) => (
                  <article className="result-card" key={gene.id}>
                    <div className="result-card-header">
                      <span className="result-type">
                        {gene.type}
                      </span>

                      <span className="result-source">
                        {gene.source.toUpperCase()}
                      </span>
                    </div>

                    <h3>{gene.name}</h3>

                    <p className="organism">
                      {gene.organism}
                    </p>

                    <p className="description">
                      {gene.description || 'No description available.'}
                    </p>

                    <div className="result-id">
                      NCBI ID: {gene.id}
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}

          {!loading && !error && query && results.length === 0 && (
            <div className="status-message">
              No results found for "{query}".
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

export default App