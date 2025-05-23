"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import type { PexelsPhoto } from "@/types/photo"

interface SearchWorkerMessage {
  type: "SEARCH" | "CACHE_CLEAR" | "PREFETCH"
  query?: string
  photos?: PexelsPhoto[]
  cacheKey?: string
}

interface SearchWorkerResult {
  type: "SEARCH_RESULT" | "ERROR" | "CACHE_HIT"
  query?: string
  results?: PexelsPhoto[]
  cached?: boolean
  error?: string
}

export function useUltraFastSearch(allPhotos: PexelsPhoto[]) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<PexelsPhoto[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchStats, setSearchStats] = useState({ time: 0, cached: false, resultCount: 0 })

  const workerRef = useRef<Worker | null>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const searchStartTimeRef = useRef<number>(0)

  // Initialize Web Worker
  useEffect(() => {
    // Create worker from blob URL for better performance
    const workerBlob = new Blob(
      [
        `
      // Inline worker code for better performance
      const searchCache = new Map();
      const CACHE_EXPIRY = 5 * 60 * 1000;

      function fuzzySearch(photos, query) {
        const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 1);
        
        if (searchTerms.length === 0) return photos;

        return photos
          .map(photo => {
            let score = 0;
            const searchableText = \`\${photo.alt || ''} \${photo.photographer || ''}\`.toLowerCase();
            
            if (searchableText.includes(query.toLowerCase())) {
              score += 100;
            }
            
            searchTerms.forEach(term => {
              if (searchableText.includes(term)) {
                score += 50;
              }
            });
            
            return { photo, score };
          })
          .filter(item => item.score > 0)
          .sort((a, b) => b.score - a.score)
          .map(item => item.photo);
      }

      self.onmessage = function(event) {
        const { type, query, photos } = event.data;

        try {
          switch (type) {
            case 'SEARCH': {
              if (!query || !photos) return;

              const normalizedQuery = query.trim().toLowerCase();
              const cached = searchCache.get(normalizedQuery);
              
              if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
                self.postMessage({
                  type: 'CACHE_HIT',
                  query: normalizedQuery,
                  results: cached.results,
                  cached: true
                });
                return;
              }

              const results = fuzzySearch(photos, normalizedQuery);
              
              searchCache.set(normalizedQuery, {
                results,
                timestamp: Date.now()
              });

              self.postMessage({
                type: 'SEARCH_RESULT',
                query: normalizedQuery,
                results,
                cached: false
              });
              break;
            }

            case 'CACHE_CLEAR': {
              searchCache.clear();
              break;
            }
          }
        } catch (error) {
          self.postMessage({
            type: 'ERROR',
            error: error.message || 'Unknown error'
          });
        }
      };
    `,
      ],
      { type: "application/javascript" },
    )

    const workerUrl = URL.createObjectURL(workerBlob)
    workerRef.current = new Worker(workerUrl)

    // Handle worker messages
    workerRef.current.onmessage = (event: MessageEvent<SearchWorkerResult>) => {
      const { type, query, results = [], cached = false, error } = event.data
      const searchTime = performance.now() - searchStartTimeRef.current

      setIsSearching(false)
      setSearchStats({
        time: searchTime,
        cached,
        resultCount: results.length,
      })

      if (type === "ERROR") {
        console.error("Search worker error:", error)
        return
      }

      if (query === searchQuery.trim().toLowerCase()) {
        setSearchResults(results)
      }
    }

    // Cleanup
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
        URL.revokeObjectURL(workerUrl)
      }
    }
  }, [searchQuery])

  // Optimized search function with debouncing
  const performSearch = useCallback(
    (query: string) => {
      if (!workerRef.current) return

      // Clear previous debounce
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }

      // Immediate search for short queries or exact matches
      const shouldSearchImmediately = query.length <= 3 || /^[a-zA-Z]+$/.test(query)
      const debounceDelay = shouldSearchImmediately ? 50 : 150

      debounceTimeoutRef.current = setTimeout(() => {
        if (query.trim()) {
          setIsSearching(true)
          searchStartTimeRef.current = performance.now()

          workerRef.current?.postMessage({
            type: "SEARCH",
            query: query.trim(),
            photos: allPhotos,
          } satisfies SearchWorkerMessage)
        } else {
          setSearchResults([])
          setSearchStats({ time: 0, cached: false, resultCount: 0 })
        }
      }, debounceDelay)
    },
    [allPhotos],
  )

  // Update search query and trigger search
  const updateSearchQuery = useCallback(
    (query: string) => {
      setSearchQuery(query)
      performSearch(query)
    },
    [performSearch],
  )

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery("")
    setSearchResults([])
    setIsSearching(false)
    setSearchStats({ time: 0, cached: false, resultCount: 0 })

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
  }, [])

  // Memoized return value
  const searchData = useMemo(
    () => ({
      searchQuery,
      searchResults,
      isSearching,
      searchStats,
      updateSearchQuery,
      clearSearch,
      hasResults: searchResults.length > 0,
      isSearchActive: searchQuery.trim().length > 0,
    }),
    [searchQuery, searchResults, isSearching, searchStats, updateSearchQuery, clearSearch],
  )

  return searchData
}
