"use client"
import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom"
import { PhotoCard } from "@/components/photo-card"
import type { PexelsPhoto } from "@/types/photo"
import jest from "jest" // Import jest to fix the undeclared variable error

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

describe("PhotoCard", () => {
  const defaultProps = {
    photo: mockPhoto,
    onClick: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders photo with correct attributes", () => {
    render(<PhotoCard {...defaultProps} />)
    const img = screen.getByRole("img")
    
    expect(img).toHaveAttribute("src", mockPhoto.src.large)
    expect(img).toHaveAttribute("alt", mockPhoto.alt)
  })

  it("displays photographer information", () => {
    render(<PhotoCard {...defaultProps} />)
    expect(screen.getByText(mockPhoto.photographer)).toBeInTheDocument()
  })

  it("handles click events", () => {
    render(<PhotoCard {...defaultProps} />)
    const card = screen.getByRole("button")
    
    fireEvent.click(card)
    expect(defaultProps.onClick).toHaveBeenCalledWith(mockPhoto)
  })

  it("applies custom className", () => {
    const className = "custom-card"
    render(<PhotoCard {...defaultProps} className={className} />)
    const card = screen.getByRole("button")
    expect(card).toHaveClass(className)
  })

  it("applies custom style", () => {
    const style = { margin: "20px" }
    render(<PhotoCard {...defaultProps} style={style} />)
    const card = screen.getByRole("button")
    expect(card).toHaveStyle(style)
  })

  it("handles loading state", () => {
    render(<PhotoCard {...defaultProps} loading={true} />)
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument()
  })

  it("handles error state", () => {
    render(<PhotoCard {...defaultProps} error={true} />)
    expect(screen.getByText(/failed to load/i)).toBeInTheDocument()
  })

  it("shows like button when liked", () => {
    const likedPhoto = { ...mockPhoto, liked: true }
    render(<PhotoCard {...defaultProps} photo={likedPhoto} />)
    expect(screen.getByRole("button", { name: /unlike/i })).toBeInTheDocument()
  })

  it("shows unlike button when not liked", () => {
    render(<PhotoCard {...defaultProps} />)
    expect(screen.getByRole("button", { name: /like/i })).toBeInTheDocument()
  })

  it("handles like button click", () => {
    const onLike = jest.fn()
    render(<PhotoCard {...defaultProps} onLike={onLike} />)
    
    const likeButton = screen.getByRole("button", { name: /like/i })
    fireEvent.click(likeButton)
    
    expect(onLike).toHaveBeenCalledWith(mockPhoto.id)
  })

  it("handles unlike button click", () => {
    const onUnlike = jest.fn()
    const likedPhoto = { ...mockPhoto, liked: true }
    render(<PhotoCard {...defaultProps} photo={likedPhoto} onUnlike={onUnlike} />)
    
    const unlikeButton = screen.getByRole("button", { name: /unlike/i })
    fireEvent.click(unlikeButton)
    
    expect(onUnlike).toHaveBeenCalledWith(mockPhoto.id)
  })

  it("combines multiple custom props", () => {
    const props = {
      ...defaultProps,
      loading: true,
      error: false,
      className: "test-card",
      style: { margin: "10px" },
    }
    
    render(<PhotoCard {...props} />)
    const card = screen.getByRole("button")
    
    expect(card).toHaveClass(props.className)
    expect(card).toHaveStyle(props.style)
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument()
  })
})
