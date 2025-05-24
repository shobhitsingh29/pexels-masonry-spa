import { render, screen, fireEvent } from "@testing-library/react"
import { PhotoModal } from "@/components/photo-modal"
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

describe("PhotoModal", () => {
  const defaultProps = {
    photo: mockPhoto,
    onClose: jest.fn(),
    onLike: jest.fn(),
    onUnlike: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders photo details", () => {
    render(<PhotoModal {...defaultProps} />)
    
    expect(screen.getByRole("img")).toHaveAttribute("src", mockPhoto.src.large)
    expect(screen.getByText(mockPhoto.photographer)).toBeInTheDocument()
    expect(screen.getByText(mockPhoto.alt)).toBeInTheDocument()
  })

  it("handles close button click", () => {
    render(<PhotoModal {...defaultProps} />)
    const closeButton = screen.getByRole("button", { name: /close/i })
    
    fireEvent.click(closeButton)
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it("handles like button click", () => {
    render(<PhotoModal {...defaultProps} />)
    const likeButton = screen.getByRole("button", { name: /like/i })
    
    fireEvent.click(likeButton)
    expect(defaultProps.onLike).toHaveBeenCalledWith(mockPhoto.id)
  })

  it("handles unlike button click", () => {
    const likedPhoto = { ...mockPhoto, liked: true }
    render(<PhotoModal {...defaultProps} photo={likedPhoto} />)
    const unlikeButton = screen.getByRole("button", { name: /unlike/i })
    
    fireEvent.click(unlikeButton)
    expect(defaultProps.onUnlike).toHaveBeenCalledWith(mockPhoto.id)
  })

  it("handles keyboard navigation", () => {
    render(<PhotoModal {...defaultProps} />)
    
    fireEvent.keyDown(document, { key: "Escape" })
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it("handles click outside modal", () => {
    render(<PhotoModal {...defaultProps} />)
    const overlay = screen.getByTestId("modal-overlay")
    
    fireEvent.click(overlay)
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it("handles click inside modal content", () => {
    render(<PhotoModal {...defaultProps} />)
    const content = screen.getByTestId("modal-content")
    
    fireEvent.click(content)
    expect(defaultProps.onClose).not.toHaveBeenCalled()
  })

  it("handles download button click", () => {
    render(<PhotoModal {...defaultProps} />)
    const downloadButton = screen.getByRole("button", { name: /download/i })
    
    fireEvent.click(downloadButton)
    // Verify download link was created
    const downloadLink = document.querySelector("a[download]")
    expect(downloadLink).toHaveAttribute("href", mockPhoto.src.original)
  })

  it("handles photographer link click", () => {
    render(<PhotoModal {...defaultProps} />)
    const photographerLink = screen.getByRole("link", { name: mockPhoto.photographer })
    
    expect(photographerLink).toHaveAttribute("href", mockPhoto.photographer_url)
    expect(photographerLink).toHaveAttribute("target", "_blank")
    expect(photographerLink).toHaveAttribute("rel", "noopener noreferrer")
  })

  it("handles image load error", () => {
    render(<PhotoModal {...defaultProps} />)
    const img = screen.getByRole("img")
    
    fireEvent.error(img)
    expect(screen.getByText(/failed to load/i)).toBeInTheDocument()
  })

  it("handles image loading state", () => {
    render(<PhotoModal {...defaultProps} />)
    const img = screen.getByRole("img")
    
    fireEvent.loadStart(img)
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument()
    
    fireEvent.load(img)
    expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument()
  })

  it("applies custom className", () => {
    const className = "custom-modal"
    render(<PhotoModal {...defaultProps} className={className} />)
    const modal = screen.getByRole("dialog")
    expect(modal).toHaveClass(className)
  })

  it("applies custom style", () => {
    const style = { margin: "20px" }
    render(<PhotoModal {...defaultProps} style={style} />)
    const modal = screen.getByRole("dialog")
    expect(modal).toHaveStyle(style)
  })
}) 