import { fetchCuratedPhotos, searchPhotos } from "@/lib/pexels-api"
import type { PexelsPhoto } from "@/types/photo"

// Mock fetch
const mockFetch = jest.fn()
;(global as any).fetch = mockFetch

describe("pexels-api", () => {
  const mockPhoto: PexelsPhoto = {
    id: 1,
    width: 400,
    height: 600,
    url: "https://example.com",
    photographer: "Test Photographer",
    photographer_url: "https://example.com/photographer",
    photographer_id: 1,
    avg_color: "#000000",
    src: {
      original: "https://example.com/original.jpg",
      large2x: "https://example.com/large2x.jpg",
      large: "https://example.com/large.jpg",
      medium: "https://example.com/medium.jpg",
      small: "https://example.com/small.jpg",
      portrait: "https://example.com/portrait.jpg",
      landscape: "https://example.com/landscape.jpg",
      tiny: "https://example.com/tiny.jpg",
    },
    liked: false,
    alt: "Test photo",
  }

  const mockResponse = {
    photos: [mockPhoto],
    page: 1,
    per_page: 1,
    total_results: 1,
  }

  beforeEach(() => {
    mockFetch.mockClear()
  })

  describe("fetchCuratedPhotos", () => {
    it("fetches curated photos successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await fetchCuratedPhotos(1, 1)
      expect(result).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/v1/curated"),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.any(String),
          }),
        })
      )
    })

    it("handles API errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
      })

      await expect(fetchCuratedPhotos(1, 1)).rejects.toThrow("Too Many Requests")
    })

    it("handles network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"))

      await expect(fetchCuratedPhotos(1, 1)).rejects.toThrow("Network error")
    })

    it("respects page and per_page parameters", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      await fetchCuratedPhotos(2, 20)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("page=2&per_page=20"),
        expect.any(Object)
      )
    })

    it("handles abort signal", async () => {
      const controller = new AbortController()
      controller.abort()

      await expect(fetchCuratedPhotos(1, 1, controller.signal)).rejects.toThrow("AbortError")
    })
  })

  describe("searchPhotos", () => {
    it("fetches search results successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await searchPhotos("nature", 1, 1)
      expect(result).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/v1/search"),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.any(String),
          }),
        })
      )
    })

    it("handles API errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
      })

      await expect(searchPhotos("nature", 1, 1)).rejects.toThrow("Too Many Requests")
    })

    it("handles network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"))

      await expect(searchPhotos("nature", 1, 1)).rejects.toThrow("Network error")
    })

    it("respects search parameters", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      await searchPhotos("nature", 2, 20)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("query=nature&page=2&per_page=20"),
        expect.any(Object)
      )
    })

    it("handles abort signal", async () => {
      const controller = new AbortController()
      controller.abort()

      await expect(searchPhotos("nature", 1, 1, controller.signal)).rejects.toThrow("AbortError")
    })

    it("handles empty search query", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ photos: [], page: 1, per_page: 1, total_results: 0 }),
      })

      const result = await searchPhotos("", 1, 1)
      expect(result.photos).toHaveLength(0)
      expect(result.total_results).toBe(0)
    })
  })
}) 