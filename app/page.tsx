"use client"

import { useState, useEffect, useCallback, useMemo, useRef, startTransition, Suspense } from "react"
import dynamic from "next/dynamic"
import styled from "styled-components"
import { useRouter } from "next/navigation"
import type { PexelsPhoto } from "@/types/photo"
import { fetchCuratedPhotos } from "@/lib/pexels-api"
import { useUltraFastSearch } from "@/hooks/use-ultra-fast-search"
import { ErrorBoundary } from "@/components/error-boundary"
import { LoadingSpinner } from "@/components/loading-spinner"

// Dynamic imports for better performance
const VirtualizedMasonryGrid = dynamic(
  () => import("@/components/virtualized-masonry-grid").then((mod) => ({ default: mod.VirtualizedMasonryGrid })),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  },
)

const SearchBar = dynamic(() => import("@/components/search-bar").then((mod) => ({ default: mod.SearchBar })), {
  loading: () => <div style={{ height: "60px", background: "#f3f4f6", borderRadius: "8px" }} />,
  ssr: false,
})

const Container = styled.div`
  min-height: 100vh;
  background-color: #f9fafb;
  overscroll-behavior: none;
  contain: layout style paint;
`

const Header = styled.header`
  background-color: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 24px;
  position: sticky;
  top: 0;
  z-index: 5;
  will-change: transform;
  contain: layout style paint;
  backdrop-filter: blur(10px);
  background-color: rgba(255, 255, 255, 0.95);
`

const Title = styled.h1`
  font-size: clamp(24px, 4vw, 32px);
  font-weight: 700;
  text-align: center;
  color: #1f2937;
  margin-bottom: 24px;
  letter-spacing: -0.025em;
`

const GridContainer = styled.main`
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  contain: layout style;
`

const ErrorMessage = styled.div`
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
  text-align: center;
  animation: slideIn 0.3s ease-out;
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`

const EmptyState = styled.div`
  text-align: center;
  padding: 64px 24px;
  color: #6b7280;
  
  h3 {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 8px;
    color: #374151;
  }
  
  p {
    font-size: 14px;
    line-height: 1.5;
  }
`

const SearchStats = styled.div`
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 16px;
  font-size: 12px;
  color: #6b7280;
  
  span {
    padding: 4px 8px;
    background: #f3f4f6;
    border-radius: 4px;
    
    &.cached {
      background: #dcfce7;
      color: #16a34a;
    }
  }
`

// Performance monitoring
function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState({ lcp: 0, fid: 0, cls: 0 })

  useEffect(() => {
    if (typeof window === "undefined") return

    // LCP Observer
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1] as any
      setMetrics((prev) => ({ ...prev, lcp: lastEntry.startTime }))
    })

    try {
      lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] })
    } catch (e) {
      console.warn("LCP observer not supported")
    }

    return () => lcpObserver.disconnect()
  }, [])

  return metrics
}

// Cache for API responses with advanced strategies
const createAdvancedCache = () => {
  const cache = new Map()
  const maxSize = 100
  const ttl = 5 * 60 * 1000 // 5 minutes

  return {
    get: (key: string) => {
      const item = cache.get(key)
      if (!item) return null

      if (Date.now() - item.timestamp > ttl) {
        cache.delete(key)
        return null
      }

      return item.data
    },

    set: (key: string, data: any) => {
      // LRU eviction
      if (cache.size >= maxSize) {
        const firstKey = cache.keys().next().value
        cache.delete(firstKey)
      }

      cache.set(key, {
        data,
        timestamp: Date.now(),
      })
    },

    clear: () => cache.clear(),
  }
}

const apiCache = createAdvancedCache()

export default function HomePage() {
  const router = useRouter()
  const [photos, setPhotos] = useState<PexelsPhoto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const abortControllerRef = useRef<AbortController | null>(null)
  const performanceMetrics = usePerformanceMetrics()

  // Ultra-fast search hook
  const {
    searchQuery,
    searchResults,
    isSearching,
    searchStats,
    updateSearchQuery,
    clearSearch,
    hasResults,
    isSearchActive,
  } = useUltraFastSearch(photos)

  // Preload critical resources
  useEffect(() => {
    // Preload next page of images
    const preloadNextPage = () => {
      if (!loading && hasMore) {
        const nextPage = page + 1
        const cacheKey = `curated_${nextPage}`

        if (!apiCache.get(cacheKey)) {
          fetchCuratedPhotos(nextPage, 20)
            .then((response) => {
              apiCache.set(cacheKey, response)
            })
            .catch(() => {
              // Silently fail for preloading
            })
        }
      }
    }

    // Preload after initial load
    const timer = setTimeout(preloadNextPage, 2000)
    return () => clearTimeout(timer)
  }, [loading, hasMore, page])

  // Load curated photos with aggressive caching
  const loadCuratedPhotos = useCallback(async (pageNum = 1, append = false) => {
    try {
      // Abort previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      abortControllerRef.current = new AbortController()
      setLoading(true)
      setError(null)

      const cacheKey = `curated_${pageNum}`
      let response = apiCache.get(cacheKey)

      if (!response) {
        response = await fetchCuratedPhotos(pageNum, 40, abortControllerRef.current.signal)
        apiCache.set(cacheKey, response)
      }

      // Use startTransition for better performance
      startTransition(() => {
        if (append) {
          setPhotos((prev) => [...prev, ...response.photos])
        } else {
          setPhotos(response.photos)
        }

        setHasMore(response.photos.length === 40)
        setPage(pageNum)
      })
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError(err.message || "Failed to load photos")
      }
    } finally {
      setLoading(false)
      abortControllerRef.current = null
    }
  }, [])

  // Load more photos
  const loadMore = useCallback(async () => {
    if (loading || !hasMore || isSearchActive) return

    const nextPage = page + 1
    try {
      setLoading(true)

      const cacheKey = `curated_${nextPage}`
      let response = apiCache.get(cacheKey)

      if (!response) {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
        }
        abortControllerRef.current = new AbortController()

        response = await fetchCuratedPhotos(nextPage, 40, abortControllerRef.current.signal)
        apiCache.set(cacheKey, response)
      }

      startTransition(() => {
        setPhotos((prev) => [...prev, ...response.photos])
        setHasMore(response.photos.length === 40)
        setPage(nextPage)
      })
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError(err.message || "Failed to load more photos")
      }
    } finally {
      setLoading(false)
      abortControllerRef.current = null
    }
  }, [loading, hasMore, page, isSearchActive])

  // Handle photo click with prefetching
  const handlePhotoClick = useCallback(
    (photo: PexelsPhoto) => {
      // Prefetch adjacent photos for faster navigation
      const currentIndex = photos.findIndex((p) => p.id === photo.id)
      const adjacentPhotos = photos.slice(Math.max(0, currentIndex - 2), currentIndex + 3)

      adjacentPhotos.forEach((adjacentPhoto) => {
        if (adjacentPhoto.id !== photo.id) {
          const img = new Image()
          img.src = adjacentPhoto.src.large
        }
      })

      router.push(`/photo/${photo.id}`)
    },
    [photos, router],
  )

  // Load initial photos
  useEffect(() => {
    loadCuratedPhotos()

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [loadCuratedPhotos])

  // Display photos (search results or regular photos)
  const displayedPhotos = useMemo(() => {
    return isSearchActive ? searchResults : photos
  }, [isSearchActive, searchResults, photos])

  return (
    <ErrorBoundary>
      <Container>
        <Header>
          <Title>⚡ Ultra-Fast Pexels Gallery</Title>
          <Suspense fallback={<div style={{ height: "60px" }} />}>
            <SearchBar
              value={searchQuery}
              onChange={updateSearchQuery}
              onSearch={() => {}} // Handled by the hook
              placeholder="Lightning-fast search... ⚡"
            />
          </Suspense>

          {/* Search Stats */}
          {(isSearching || hasResults) && (
            <SearchStats>
              <span className={searchStats.cached ? "cached" : ""}>{searchStats.time.toFixed(1)}ms</span>
              <span>{searchStats.resultCount} results</span>
              {searchStats.cached && <span className="cached">cached</span>}
            </SearchStats>
          )}

          {/* Performance metrics in development */}
          {process.env.NODE_ENV === "development" && (
            <SearchStats>
              <span>LCP: {performanceMetrics.lcp.toFixed(0)}ms</span>
              <span>Photos: {photos.length}</span>
            </SearchStats>
          )}
        </Header>

        <GridContainer>
          {error && <ErrorMessage>{error}</ErrorMessage>}

          {displayedPhotos.length === 0 && !loading && (
            <EmptyState>
              <h3>{isSearchActive ? `No photos found for "${searchQuery}"` : "No photos available"}</h3>
              <p>
                {isSearchActive
                  ? "Try adjusting your search terms or browse our curated collection."
                  : "Please check your connection and try again."}
              </p>
            </EmptyState>
          )}

          {displayedPhotos.length > 0 && (
            <Suspense fallback={<LoadingSpinner />}>
              <VirtualizedMasonryGrid
                photos={displayedPhotos}
                onPhotoClick={handlePhotoClick}
                loading={loading}
                onLoadMore={loadMore}
                hasMore={hasMore && !isSearchActive}
              />
            </Suspense>
          )}
        </GridContainer>
      </Container>
    </ErrorBoundary>
  )
}
