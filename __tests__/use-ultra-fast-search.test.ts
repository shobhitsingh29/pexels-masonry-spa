import { renderHook, act } from "@testing-library/react"
import { useUltraFastSearch } from "@/hooks/use-ultra-fast-search"
import type { PexelsPhoto } from "@/types/photo"

const mockPhotos: PexelsPhoto[] = [
  {
    id: 1,
    width: 400,
    height: 600,
    url: "https://example.com/1",
    photographer: "Photographer 1",
    photographer_url: "https://example.com/photographer1",
    photographer_id: 1,
    avg_color: "#000000",
    src: {
      original: "https://example.com/original1.jpg",
      large2x: "https://example.com/large2x1.jpg",
      large: "https://example.com/large1.jpg",
      medium: "https://example.com/medium1.jpg",
      small: "https://example.com/small1.jpg",
      portrait: "https://example.com/portrait1.jpg",
      landscape: "https://example.com/landscape1.jpg",
      tiny: "https://example.com/tiny1.jpg",
    },
    liked: false,
    alt: "Photo 1",
  },
  {
    id: 2,
    width: 400,
    height: 600,
    url: "https://example.com/2",
    photographer: "Photographer 2",
    photographer_url: "https://example.com/photographer2",
    photographer_id: 2,
    avg_color: "#ffffff",
    src: {
      original: "https://example.com/original2.jpg",
      large2x: "https://example.com/large2x2.jpg",
      large: "https://example.com/large2.jpg",
      medium: "https://example.com/medium2.jpg",
      small: "https://example.com/small2.jpg",
      portrait: "https://example.com/portrait2.jpg",
      landscape: "https://example.com/landscape2.jpg",
      tiny: "https://example.com/tiny2.jpg",
    },
    liked: false,
    alt: "Photo 2",
  },
]

describe("useUltraFastSearch", () => {
  it("initializes with empty search state", () => {
    const { result } = renderHook(() => useUltraFastSearch(mockPhotos))
    
    expect(result.current.searchQuery).toBe("")
    expect(result.current.searchResults).toEqual([])
    expect(result.current.isSearching).toBe(false)
    expect(result.current.hasResults).toBe(false)
    expect(result.current.isSearchActive).toBe(false)
  })

  it("updates search query", () => {
    const { result } = renderHook(() => useUltraFastSearch(mockPhotos))
    
    act(() => {
      result.current.updateSearchQuery("test")
    })
    
    expect(result.current.searchQuery).toBe("test")
  })

  it("clears search", () => {
    const { result } = renderHook(() => useUltraFastSearch(mockPhotos))
    
    act(() => {
      result.current.updateSearchQuery("test")
      result.current.clearSearch()
    })
    
    expect(result.current.searchQuery).toBe("")
    expect(result.current.searchResults).toEqual([])
    expect(result.current.isSearchActive).toBe(false)
  })

  it("finds photos by photographer name", () => {
    const { result } = renderHook(() => useUltraFastSearch(mockPhotos))
    
    act(() => {
      result.current.updateSearchQuery("Photographer 1")
    })
    
    expect(result.current.searchResults).toHaveLength(1)
    expect(result.current.searchResults[0].photographer).toBe("Photographer 1")
  })

  it("finds photos by alt text", () => {
    const { result } = renderHook(() => useUltraFastSearch(mockPhotos))
    
    act(() => {
      result.current.updateSearchQuery("Photo 2")
    })
    
    expect(result.current.searchResults).toHaveLength(1)
    expect(result.current.searchResults[0].alt).toBe("Photo 2")
  })

  it("handles case-insensitive search", () => {
    const { result } = renderHook(() => useUltraFastSearch(mockPhotos))
    
    act(() => {
      result.current.updateSearchQuery("photographer")
    })
    
    expect(result.current.searchResults).toHaveLength(2)
  })

  it("updates search stats", () => {
    const { result } = renderHook(() => useUltraFastSearch(mockPhotos))
    
    act(() => {
      result.current.updateSearchQuery("photographer")
    })
    
    expect(result.current.searchStats).toHaveProperty("time")
    expect(result.current.searchStats).toHaveProperty("resultCount")
    expect(result.current.searchStats.resultCount).toBe(2)
  })

  it("handles empty search results", () => {
    const { result } = renderHook(() => useUltraFastSearch(mockPhotos))
    
    act(() => {
      result.current.updateSearchQuery("nonexistent")
    })
    
    expect(result.current.searchResults).toHaveLength(0)
    expect(result.current.hasResults).toBe(false)
  })

  it("caches search results", () => {
    const { result } = renderHook(() => useUltraFastSearch(mockPhotos))
    
    // First search
    act(() => {
      result.current.updateSearchQuery("photographer")
    })
    
    const firstSearchStats = { ...result.current.searchStats }
    
    // Clear and search again
    act(() => {
      result.current.clearSearch()
      result.current.updateSearchQuery("photographer")
    })
    
    expect(result.current.searchStats.cached).toBe(true)
    expect(result.current.searchStats.time).toBeLessThan(firstSearchStats.time)
  })
}) 