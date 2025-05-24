import { render, screen, fireEvent, act } from "@testing-library/react"
import { UltraOptimizedImage } from "@/components/ultra-optimized-image"
import { describe, expect, it, beforeEach, jest } from "@jest/globals"

const mockImageSource = {
  tiny: "https://example.com/tiny.jpg",
  small: "https://example.com/small.jpg",
  medium: "https://example.com/medium.jpg",
  large: "https://example.com/large.jpg",
  original: "https://example.com/original.jpg",
}

describe("UltraOptimizedImage", () => {
  const defaultProps = {
    src: mockImageSource,
    alt: "Test image",
    width: 400,
    height: 300,
    avgColor: "#cccccc",
  }

  beforeEach(() => {
    // Mock IntersectionObserver
    const mockIntersectionObserver = jest.fn()
    mockIntersectionObserver.mockReturnValue({
      observe: () => null,
      unobserve: () => null,
      disconnect: () => null,
    })
    window.IntersectionObserver = mockIntersectionObserver
  })

  it("renders with placeholder initially", () => {
    render(<UltraOptimizedImage {...defaultProps} />)
    expect(screen.getByRole("img")).toHaveStyle({ opacity: 0 })
  })

  it("loads high quality image when priority is true", () => {
    render(<UltraOptimizedImage {...defaultProps} priority={true} />)
    const img = screen.getByRole("img")
    expect(img).toHaveAttribute("src", mockImageSource.large)
  })

  it("handles image load events", async () => {
    const onLoad = jest.fn()
    render(<UltraOptimizedImage {...defaultProps} onLoad={onLoad} />)
    
    const img = screen.getByRole("img")
    await act(async () => {
      fireEvent.load(img)
    })
    
    expect(onLoad).toHaveBeenCalled()
    expect(img).toHaveStyle({ opacity: 1 })
  })

  it("handles image error events", async () => {
    const onError = jest.fn()
    render(<UltraOptimizedImage {...defaultProps} onError={onError} />)
    
    const img = screen.getByRole("img")
    await act(async () => {
      fireEvent.error(img)
    })
    
    expect(onError).toHaveBeenCalled()
  })

  it("progressively loads images in correct order", async () => {
    render(<UltraOptimizedImage {...defaultProps} />)
    const img = screen.getByRole("img")
    
    // Initial load should use tiny image
    expect(img).toHaveAttribute("src", mockImageSource.tiny)
    
    // Simulate first load
    await act(async () => {
      fireEvent.load(img)
    })
    
    // Should progress to small image
    expect(img).toHaveAttribute("src", mockImageSource.small)
    
    // Simulate second load
    await act(async () => {
      fireEvent.load(img)
    })
    
    // Should progress to large image
    expect(img).toHaveAttribute("src", mockImageSource.large)
  })

  it("maintains aspect ratio", () => {
    render(<UltraOptimizedImage {...defaultProps} />)
    const container = screen.getByRole("img").parentElement
    expect(container).toHaveStyle({ aspectRatio: "4/3" })
  })

  it("cleans up observers on unmount", () => {
    const { unmount } = render(<UltraOptimizedImage {...defaultProps} />)
    unmount()
    // No errors should be thrown during cleanup
  })
}) 