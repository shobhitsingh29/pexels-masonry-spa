import { render, screen, fireEvent, act } from "@testing-library/react"
import { PhotoGrid } from "@/components/photo-grid"
import type { PexelsPhoto } from "@/types/photo"

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

describe("PhotoGrid", () => {
  const defaultProps = {
    photos: [mockPhoto],
    onPhotoClick: jest.fn(),
    onLike: jest.fn(),
    onUnlike: jest.fn(),
    loading: false,
    error: null,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders photos in a grid", () => {
    render(<PhotoGrid {...defaultProps} />)
    const photoCards = screen.getAllByRole("img")
    expect(photoCards).toHaveLength(1)
  })

  it("handles empty photos array", () => {
    render(<PhotoGrid {...defaultProps} photos={[]} />)
    const photoCards = screen.queryAllByRole("img")
    expect(photoCards).toHaveLength(0)
  })

  it("shows loading state", () => {
    render(<PhotoGrid {...defaultProps} loading={true} />)
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument()
  })

  it("shows error state", () => {
    const error = new Error("Failed to load photos")
    render(<PhotoGrid {...defaultProps} error={error} />)
    expect(screen.getByText(/failed to load/i)).toBeInTheDocument()
  })

  it("handles photo click", () => {
    render(<PhotoGrid {...defaultProps} />)
    const photoCard = screen.getByRole("button")
    fireEvent.click(photoCard)
    expect(defaultProps.onPhotoClick).toHaveBeenCalledWith(mockPhoto)
  })

  it("handles like action", () => {
    render(<PhotoGrid {...defaultProps} />)
    const likeButton = screen.getByRole("button", { name: /like/i })
    fireEvent.click(likeButton)
    expect(defaultProps.onLike).toHaveBeenCalledWith(mockPhoto.id)
  })

  it("handles unlike action", () => {
    const likedPhoto = { ...mockPhoto, liked: true }
    render(<PhotoGrid {...defaultProps} photos={[likedPhoto]} />)
    const unlikeButton = screen.getByRole("button", { name: /unlike/i })
    fireEvent.click(unlikeButton)
    expect(defaultProps.onUnlike).toHaveBeenCalledWith(mockPhoto.id)
  })

  it("handles window resize", () => {
    render(<PhotoGrid {...defaultProps} />)
    
    act(() => {
      window.innerWidth = 500
      window.dispatchEvent(new Event("resize"))
    })

    // Wait for resize debounce
    act(() => {
      jest.advanceTimersByTime(150)
    })

    // Verify grid layout was recalculated
    const photoCards = screen.getAllByRole("img")
    expect(photoCards).toHaveLength(1)
  })

  it("handles scroll events", () => {
    render(<PhotoGrid {...defaultProps} />)
    
    act(() => {
      window.scrollY = 100
      window.dispatchEvent(new Event("scroll"))
    })

    // Wait for scroll debounce
    act(() => {
      jest.advanceTimersByTime(150)
    })

    // Verify visible items were updated
    const photoCards = screen.getAllByRole("img")
    expect(photoCards).toHaveLength(1)
  })

  it("applies custom className", () => {
    const className = "custom-grid"
    render(<PhotoGrid {...defaultProps} className={className} />)
    const grid = screen.getByRole("list")
    expect(grid).toHaveClass(className)
  })

  it("applies custom style", () => {
    const style = { margin: "20px" }
    render(<PhotoGrid {...defaultProps} style={style} />)
    const grid = screen.getByRole("list")
    expect(grid).toHaveStyle(style)
  })

  it("handles multiple photos with different aspect ratios", () => {
    const photos = [
      mockPhoto,
      { ...mockPhoto, id: 2, width: 400, height: 400 },
      { ...mockPhoto, id: 3, width: 400, height: 800 },
    ]
    render(<PhotoGrid {...defaultProps} photos={photos} />)
    const photoCards = screen.getAllByRole("img")
    expect(photoCards).toHaveLength(3)
  })

  it("handles keyboard navigation", () => {
    render(<PhotoGrid {...defaultProps} />)
    const photoCard = screen.getByRole("button")
    
    fireEvent.keyDown(photoCard, { key: "Enter" })
    expect(defaultProps.onPhotoClick).toHaveBeenCalledWith(mockPhoto)
    
    fireEvent.keyDown(photoCard, { key: " " })
    expect(defaultProps.onPhotoClick).toHaveBeenCalledWith(mockPhoto)
  })
}) 