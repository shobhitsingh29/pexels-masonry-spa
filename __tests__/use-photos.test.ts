import { renderHook, act } from "@testing-library/react"
import "@testing-library/jest-dom"
import { usePhotos } from "@/hooks/use-photos"
import { searchPhotos, fetchCuratedPhotos } from "@/lib/pexels-api"
import type { PexelsPhoto } from "@/types/photo"

// Mock the Pexels API functions
jest.mock("@/lib/pexels-api", () => ({
  searchPhotos: jest.fn(),
  fetchCuratedPhotos: jest.fn(),
}))

describe("usePhotos", () => {
  const mockPhotos: PexelsPhoto[] = [
    {
      id: 1,
      width: 1000,
      height: 800,
      url: "https://example.com/photo1",
      photographer: "Photographer 1",
      photographer_url: "https://example.com/photographer1",
      photographer_id: 1,
      avg_color: "#000000",
      src: {
        original: "photo1.jpg",
        large2x: "photo1.jpg",
        large: "photo1.jpg",
        medium: "photo1.jpg",
        small: "photo1.jpg",
        portrait: "photo1.jpg",
        landscape: "photo1.jpg",
        tiny: "photo1.jpg",
      },
      liked: false,
      alt: "Photo 1",
    },
    {
      id: 2,
      width: 1000,
      height: 800,
      url: "https://example.com/photo2",
      photographer: "Photographer 2",
      photographer_url: "https://example.com/photographer2",
      photographer_id: 2,
      avg_color: "#000000",
      src: {
        original: "photo2.jpg",
        large2x: "photo2.jpg",
        large: "photo2.jpg",
        medium: "photo2.jpg",
        small: "photo2.jpg",
        portrait: "photo2.jpg",
        landscape: "photo2.jpg",
        tiny: "photo2.jpg",
      },
      liked: false,
      alt: "Photo 2",
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(fetchCuratedPhotos as jest.Mock).mockResolvedValue({
      photos: mockPhotos,
      page: 1,
      per_page: 10,
      total_results: 20,
    })
    ;(searchPhotos as jest.Mock).mockResolvedValue({
      photos: mockPhotos,
      page: 1,
      per_page: 10,
      total_results: 20,
    })
  })

  it("initializes with default values", () => {
    const { result } = renderHook(() => usePhotos())
    expect(result.current.photos).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.hasMore).toBe(true)
  })

  it("loads curated photos successfully", async () => {
    const { result } = renderHook(() => usePhotos())

    await act(async () => {
      await result.current.loadPhotos()
    })

    expect(result.current.photos).toEqual(mockPhotos)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.hasMore).toBe(true)
    expect(fetchCuratedPhotos).toHaveBeenCalledWith(1, 10)
  })

  it("handles search queries", async () => {
    const { result } = renderHook(() => usePhotos())

    await act(async () => {
      await result.current.loadPhotos("nature")
    })

    expect(searchPhotos).toHaveBeenCalledWith("nature", 1, 10)
    expect(result.current.photos).toEqual(mockPhotos)
  })

  it("handles pagination", async () => {
    const { result } = renderHook(() => usePhotos())

    // Load first page
    await act(async () => {
      await result.current.loadPhotos()
    })

    // Load second page
    await act(async () => {
      await result.current.loadPhotos()
    })

    expect(fetchCuratedPhotos).toHaveBeenCalledTimes(2)
    expect(fetchCuratedPhotos).toHaveBeenNthCalledWith(1, 1, 10)
    expect(fetchCuratedPhotos).toHaveBeenNthCalledWith(2, 2, 10)
    expect(result.current.photos).toEqual([...mockPhotos, ...mockPhotos])
  })

  it("handles loading state", async () => {
    const { result } = renderHook(() => usePhotos())

    const loadPromise = act(async () => {
      await result.current.loadPhotos()
    })

    expect(result.current.loading).toBe(true)
    await loadPromise
    expect(result.current.loading).toBe(false)
  })

  it("handles errors", async () => {
    const error = new Error("Failed to fetch photos")
    ;(fetchCuratedPhotos as jest.Mock).mockRejectedValue(error)

    const { result } = renderHook(() => usePhotos())

    await act(async () => {
      await result.current.loadPhotos()
    })

    expect(result.current.error).toBe(error)
    expect(result.current.loading).toBe(false)
    expect(result.current.photos).toEqual([])
  })

  it("handles no more results", async () => {
    ;(fetchCuratedPhotos as jest.Mock).mockResolvedValue({
      photos: mockPhotos,
      page: 2,
      per_page: 10,
      total_results: 10,
    })

    const { result } = renderHook(() => usePhotos())

    await act(async () => {
      await result.current.loadPhotos()
    })

    expect(result.current.hasMore).toBe(false)
  })

  it("resets state when search query changes", async () => {
    const { result } = renderHook(() => usePhotos())

    // Load first search
    await act(async () => {
      await result.current.loadPhotos("nature")
    })

    // Load second search
    await act(async () => {
      await result.current.loadPhotos("city")
    })

    expect(result.current.photos).toEqual(mockPhotos)
    expect(searchPhotos).toHaveBeenCalledWith("city", 1, 10)
  })

  it("handles empty search results", async () => {
    ;(searchPhotos as jest.Mock).mockResolvedValue({
      photos: [],
      page: 1,
      per_page: 10,
      total_results: 0,
    })

    const { result } = renderHook(() => usePhotos())

    await act(async () => {
      await result.current.loadPhotos("empty")
    })

    expect(result.current.photos).toEqual([])
    expect(result.current.hasMore).toBe(false)
  })

  it("handles network errors", async () => {
    const networkError = new Error("Network error")
    ;(fetchCuratedPhotos as jest.Mock).mockRejectedValue(networkError)

    const { result } = renderHook(() => usePhotos())

    await act(async () => {
      await result.current.loadPhotos()
    })

    expect(result.current.error).toBe(networkError)
    expect(result.current.photos).toEqual([])
  })

  it("handles invalid API responses", async () => {
    ;(fetchCuratedPhotos as jest.Mock).mockResolvedValue(null)

    const { result } = renderHook(() => usePhotos())

    await act(async () => {
      await result.current.loadPhotos()
    })

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.photos).toEqual([])
  })

  it("handles partial API responses", async () => {
    ;(fetchCuratedPhotos as jest.Mock).mockResolvedValue({
      photos: mockPhotos,
      // Missing other fields
    })

    const { result } = renderHook(() => usePhotos())

    await act(async () => {
      await result.current.loadPhotos()
    })

    expect(result.current.photos).toEqual(mockPhotos)
    expect(result.current.hasMore).toBe(true)
  })

  it("handles concurrent requests", async () => {
    const { result } = renderHook(() => usePhotos())

    const firstRequest = act(async () => {
      await result.current.loadPhotos("nature")
    })

    const secondRequest = act(async () => {
      await result.current.loadPhotos("city")
    })

    await Promise.all([firstRequest, secondRequest])

    expect(searchPhotos).toHaveBeenCalledTimes(2)
    expect(result.current.photos).toEqual(mockPhotos)
  })

  it("handles rapid search changes", async () => {
    const { result } = renderHook(() => usePhotos())

    await act(async () => {
      await result.current.loadPhotos("nature")
      await result.current.loadPhotos("city")
      await result.current.loadPhotos("people")
    })

    expect(searchPhotos).toHaveBeenCalledTimes(3)
    expect(result.current.photos).toEqual(mockPhotos)
  })
}) 