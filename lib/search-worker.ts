// Web Worker for search operations
/// <reference lib="webworker" />

interface SearchMessage {
  type: "SEARCH" | "CACHE_CLEAR" | "PREFETCH"
  query?: string
  photos?: any[]
  cacheKey?: string
}

interface SearchResult {
  type: "SEARCH_RESULT" | "ERROR" | "CACHE_HIT"
  query?: string
  results?: any[]
  cached?: boolean
  error?: string
}

// In-memory cache for search results
const searchCache = new Map<string, { results: any[]; timestamp: number }>()
const CACHE_EXPIRY = 5 * 60 * 1000 // 5 minutes

// Advanced search algorithm with fuzzy matching
function fuzzySearch(photos: any[], query: string): any[] {
  const searchTerms = query
    .toLowerCase()
    .split(" ")
    .filter((term) => term.length > 1)

  if (searchTerms.length === 0) return photos

  return photos
    .map((photo) => {
      let score = 0
      const searchableText = `${photo.alt || ""} ${photo.photographer || ""}`.toLowerCase()

      // Exact match bonus
      if (searchableText.includes(query.toLowerCase())) {
        score += 100
      }

      // Individual term matching
      searchTerms.forEach((term) => {
        if (searchableText.includes(term)) {
          score += 50
        }

        // Fuzzy matching for typos
        const words = searchableText.split(" ")
        words.forEach((word) => {
          if (calculateLevenshteinDistance(word, term) <= 2) {
            score += 25
          }
        })
      })

      return { photo, score }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.photo)
}

// Levenshtein distance for fuzzy matching
function calculateLevenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null))

  for (let i = 0; i <= str1.length; i += 1) {
    matrix[0][i] = i
  }

  for (let j = 0; j <= str2.length; j += 1) {
    matrix[j][0] = j
  }

  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator, // substitution
      )
    }
  }

  return matrix[str2.length][str1.length]
}

self.onmessage = (event: MessageEvent<SearchMessage>) => {
  const { type, query, photos, cacheKey } = event.data

  try {
    switch (type) {
      case "SEARCH": {
        if (!query || !photos) return

        const normalizedQuery = query.trim().toLowerCase()
        const cached = searchCache.get(normalizedQuery)

        // Return cached result if available and not expired
        if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
          self.postMessage({
            type: "CACHE_HIT",
            query: normalizedQuery,
            results: cached.results,
            cached: true,
          } satisfies SearchResult)
          return
        }

        // Perform search
        const results = fuzzySearch(photos, normalizedQuery)

        // Cache the results
        searchCache.set(normalizedQuery, {
          results,
          timestamp: Date.now(),
        })

        self.postMessage({
          type: "SEARCH_RESULT",
          query: normalizedQuery,
          results,
          cached: false,
        } satisfies SearchResult)
        break
      }

      case "CACHE_CLEAR": {
        searchCache.clear()
        break
      }

      case "PREFETCH": {
        if (!cacheKey || !photos) return

        // Prefetch common search terms
        const commonTerms = ["nature", "city", "people", "abstract", "technology"]
        commonTerms.forEach((term) => {
          if (!searchCache.has(term)) {
            const results = fuzzySearch(photos, term)
            searchCache.set(term, {
              results,
              timestamp: Date.now(),
            })
          }
        })
        break
      }
    }
  } catch (error) {
    self.postMessage({
      type: "ERROR",
      error: error instanceof Error ? error.message : "Unknown error",
    } satisfies SearchResult)
  }
}

export {}
