import { useState, useCallback } from "react"
import { searchPhotos, fetchCuratedPhotos } from "@/lib/pexels-api"
import type { PexelsPhoto } from "@/types/photo"

interface UsePhotosResult {
  photos: PexelsPhoto[]
  loading: boolean
  error: Error | null
  hasMore: boolean
  loadPhotos: (query?: string) => Promise<void>
}

export function usePhotos(): UsePhotosResult {
  const [photos, setPhotos] = useState<PexelsPhoto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [currentQuery, setCurrentQuery] = useState("")

  const loadPhotos = useCallback(async (query?: string) => {
    try {
      setLoading(true)
      setError(null)

      // Reset state if query changes
      if (query !== currentQuery) {
        setPhotos([])
        setPage(1)
        setCurrentQuery(query || "")
      }

      const response = query
        ? await searchPhotos(query, page, 10)
        : await fetchCuratedPhotos(page, 10)

      if (page === 1) {
        setPhotos(response.photos)
      } else {
        setPhotos((prev) => [...prev, ...response.photos])
      }

      setHasMore(response.page * response.per_page < response.total_results)
      setPage((prev) => prev + 1)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch photos"))
    } finally {
      setLoading(false)
    }
  }, [page, currentQuery])

  return {
    photos,
    loading,
    error,
    hasMore,
    loadPhotos,
  }
} 