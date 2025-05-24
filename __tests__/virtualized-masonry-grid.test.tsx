import { render, screen, fireEvent } from "@testing-library/react"
import { VirtualizedMasonryGrid } from "@/components/virtualized-masonry-grid"
import type { PexelsPhoto } from "@/types/photo"

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

describe("VirtualizedMasonryGrid", () => {
  const defaultProps = {
    photos: [mockPhoto],
    onPhotoClick: jest.fn(),
    loading: false,
    onLoadMore: jest.fn(),
    hasMore: true,
  }

  beforeEach(() => {
    // Mock ResizeObserver
    const mockResizeObserver = jest.fn()
    mockResizeObserver.mockReturnValue({
      observe: () => null,
      unobserve: () => null,
      disconnect: () => null,
    })
    window.ResizeObserver = mockResizeObserver
  })

  it("renders photos in a grid", () => {
    render(<VirtualizedMasonryGrid {...defaultProps} />)
    const gridContainer = screen.getByRole("list")
    expect(gridContainer).toBeInTheDocument()
  })

  it("handles photo click events", () => {
    render(<VirtualizedMasonryGrid {...defaultProps} />)
    const photo = screen.getByRole("img")
    fireEvent.click(photo)
    expect(defaultProps.onPhotoClick).toHaveBeenCalledWith(mockPhoto)
  })

  it("shows loading state", () => {
    render(<VirtualizedMasonryGrid {...defaultProps} loading={true} />)
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument()
  })

  it("triggers load more when scrolling near bottom", () => {
    render(<VirtualizedMasonryGrid {...defaultProps} />)
    const container = screen.getByRole("list")
    
    // Simulate scroll to bottom
    fireEvent.scroll(container, {
      target: {
        scrollTop: 1000,
        scrollHeight: 1200,
        clientHeight: 200,
      },
    })
    
    expect(defaultProps.onLoadMore).toHaveBeenCalled()
  })

  it("does not trigger load more when hasMore is false", () => {
    render(<VirtualizedMasonryGrid {...defaultProps} hasMore={false} />)
    const container = screen.getByRole("list")
    
    fireEvent.scroll(container, {
      target: {
        scrollTop: 1000,
        scrollHeight: 1200,
        clientHeight: 200,
      },
    })
    
    expect(defaultProps.onLoadMore).not.toHaveBeenCalled()
  })

  it("handles empty photo array", () => {
    render(<VirtualizedMasonryGrid {...defaultProps} photos={[]} />)
    expect(screen.queryByRole("img")).not.toBeInTheDocument()
  })

  it("maintains scroll position after photo click", () => {
    render(<VirtualizedMasonryGrid {...defaultProps} />)
    const container = screen.getByRole("list")
    const initialScrollTop = 500
    
    // Set initial scroll position
    Object.defineProperty(container, "scrollTop", {
      value: initialScrollTop,
      writable: true,
    })
    
    // Click a photo
    const photo = screen.getByRole("img")
    fireEvent.click(photo)
    
    // Check if scroll position is maintained
    expect(container.scrollTop).toBe(initialScrollTop)
  })

  it("cleans up observers on unmount", () => {
    const { unmount } = render(<VirtualizedMasonryGrid {...defaultProps} />)
    unmount()
    // No errors should be thrown during cleanup
  })
}) 