import { calculateMasonryLayout, getResponsiveColumnCount, getVisibleItems, calculateTotalHeight } from "@/lib/masonry-utils"
import type { PexelsPhoto } from "@/types/photo"

describe("masonry-utils", () => {
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

  describe("getResponsiveColumnCount", () => {
    it("returns correct column count for different screen sizes", () => {
      expect(getResponsiveColumnCount(500)).toBe(2)
      expect(getResponsiveColumnCount(800)).toBe(3)
      expect(getResponsiveColumnCount(1200)).toBe(4)
      expect(getResponsiveColumnCount(1400)).toBe(5)
    })

    it("handles edge cases", () => {
      expect(getResponsiveColumnCount(0)).toBe(1)
      expect(getResponsiveColumnCount(-100)).toBe(1)
      expect(getResponsiveColumnCount(2000)).toBe(5)
    })
  })

  describe("calculateMasonryLayout", () => {
    it("calculates layout for single photo", () => {
      const photos = [mockPhoto]
      const layout = calculateMasonryLayout(photos, 800, 2, 16)

      expect(layout).toHaveLength(1)
      expect(layout[0]).toHaveProperty("photo", mockPhoto)
      expect(layout[0]).toHaveProperty("height")
      expect(layout[0]).toHaveProperty("column", 0)
      expect(layout[0]).toHaveProperty("top", 0)
    })

    it("distributes photos across columns", () => {
      const photos = Array(4)
        .fill(null)
        .map((_, i) => ({ ...mockPhoto, id: i + 1 }))
      const layout = calculateMasonryLayout(photos, 800, 2, 16)

      const column0Items = layout.filter((item) => item.column === 0)
      const column1Items = layout.filter((item) => item.column === 1)

      expect(column0Items.length + column1Items.length).toBe(4)
      expect(Math.abs(column0Items.length - column1Items.length)).toBeLessThanOrEqual(1)
    })

    it("handles different photo aspect ratios", () => {
      const photos = [
        { ...mockPhoto, width: 400, height: 600 },
        { ...mockPhoto, id: 2, width: 400, height: 400 },
        { ...mockPhoto, id: 3, width: 400, height: 800 },
      ]
      const layout = calculateMasonryLayout(photos, 800, 2, 16)

      expect(layout).toHaveLength(3)
      expect(layout[0].height).toBe(600)
      expect(layout[1].height).toBe(400)
      expect(layout[2].height).toBe(800)
    })

    it("handles empty photo array", () => {
      const layout = calculateMasonryLayout([], 800, 2, 16)
      expect(layout).toHaveLength(0)
    })
  })

  describe("getVisibleItems", () => {
    const items = [
      { photo: mockPhoto, height: 200, column: 0, top: 0, columnSpan: 1 },
      { photo: { ...mockPhoto, id: 2 }, height: 200, column: 0, top: 300, columnSpan: 1 },
      { photo: { ...mockPhoto, id: 3 }, height: 200, column: 0, top: 600, columnSpan: 1 },
    ]

    it("returns only visible items", () => {
      const visibleItems = getVisibleItems(items, 0, 400, 0)
      expect(visibleItems.length).toBeLessThanOrEqual(items.length)
      expect(visibleItems[0].top).toBeLessThanOrEqual(400)
    })

    it("handles scroll velocity", () => {
      const visibleItems = getVisibleItems(items, 0, 400, 100)
      expect(visibleItems.length).toBeGreaterThan(0)
    })

    it("handles empty items array", () => {
      const visibleItems = getVisibleItems([], 0, 400, 0)
      expect(visibleItems).toHaveLength(0)
    })

    it("handles negative scroll position", () => {
      const visibleItems = getVisibleItems(items, -100, 400, 0)
      expect(visibleItems).toHaveLength(0)
    })
  })

  describe("calculateTotalHeight", () => {
    it("calculates total height for single column", () => {
      const items = [
        { photo: mockPhoto, height: 200, column: 0, top: 0, columnSpan: 1 },
        { photo: { ...mockPhoto, id: 2 }, height: 200, column: 0, top: 300, columnSpan: 1 },
      ]
      const totalHeight = calculateTotalHeight(items)
      expect(totalHeight).toBe(500)
    })

    it("calculates total height for multiple columns", () => {
      const items = [
        { photo: mockPhoto, height: 200, column: 0, top: 0, columnSpan: 1 },
        { photo: { ...mockPhoto, id: 2 }, height: 300, column: 1, top: 0, columnSpan: 1 },
        { photo: { ...mockPhoto, id: 3 }, height: 200, column: 0, top: 300, columnSpan: 1 },
      ]
      const totalHeight = calculateTotalHeight(items)
      expect(totalHeight).toBe(500)
    })

    it("handles empty items array", () => {
      const totalHeight = calculateTotalHeight([])
      expect(totalHeight).toBe(0)
    })

    it("handles items with zero height", () => {
      const items = [
        { photo: mockPhoto, height: 0, column: 0, top: 0, columnSpan: 1 },
        { photo: { ...mockPhoto, id: 2 }, height: 0, column: 0, top: 0, columnSpan: 1 },
      ]
      const totalHeight = calculateTotalHeight(items)
      expect(totalHeight).toBe(0)
    })
  })
})
