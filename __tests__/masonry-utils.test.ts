import { calculateMasonryLayout, getResponsiveColumnCount, getVisibleItems } from "@/lib/masonry-utils"
import type { PexelsPhoto } from "@/types/photo"

// Mock photo data
const mockPhoto: PexelsPhoto = {
  id: 1,
  width: 400,
  height: 600,
  url: "https://example.com",
  photographer: "Test Photographer",
  photographer_url: "https://example.com",
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

describe("masonry-utils", () => {
  describe("getResponsiveColumnCount", () => {
    it("should return correct column count for different screen sizes", () => {
      expect(getResponsiveColumnCount(500)).toBe(2)
      expect(getResponsiveColumnCount(800)).toBe(3)
      expect(getResponsiveColumnCount(1200)).toBe(4)
      expect(getResponsiveColumnCount(1400)).toBe(5)
    })
  })

  describe("calculateMasonryLayout", () => {
    it("should calculate layout for photos", () => {
      const photos = [mockPhoto, { ...mockPhoto, id: 2 }]
      const layout = calculateMasonryLayout(photos, 800, 2, 16)

      expect(layout).toHaveLength(2)
      expect(layout[0]).toHaveProperty("photo")
      expect(layout[0]).toHaveProperty("height")
      expect(layout[0]).toHaveProperty("column")
      expect(layout[0]).toHaveProperty("top")
    })

    it("should distribute photos across columns", () => {
      const photos = Array(4)
        .fill(null)
        .map((_, i) => ({ ...mockPhoto, id: i + 1 }))
      const layout = calculateMasonryLayout(photos, 800, 2, 16)

      const column0Items = layout.filter((item) => item.column === 0)
      const column1Items = layout.filter((item) => item.column === 1)

      expect(column0Items.length + column1Items.length).toBe(4)
    })
  })

  describe("getVisibleItems", () => {
    it("should return only visible items", () => {
      const items = [
        { photo: mockPhoto, height: 200, column: 0, top: 0 },
        { photo: { ...mockPhoto, id: 2 }, height: 200, column: 0, top: 300 },
        { photo: { ...mockPhoto, id: 3 }, height: 200, column: 0, top: 600 },
      ]

      const visibleItems = getVisibleItems(items, 0, 400, 0)

      expect(visibleItems.length).toBeLessThanOrEqual(items.length)
      expect(visibleItems[0].top).toBeLessThanOrEqual(400)
    })
  })
})
