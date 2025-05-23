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
  photographer_url: "https://example.com",
  photographer_id: 1,
  avg_color: "#ff0000",
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
  const mockOnClick = jest.fn()

  beforeEach(() => {
    mockOnClick.mockClear()
  })

  it("renders photo card with correct image", () => {
    render(<PhotoCard photo={mockPhoto} onClick={mockOnClick} />)

    const image = screen.getByAltText("Test photo")
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute("src", mockPhoto.src.medium)
  })

  it("calls onClick when card is clicked", () => {
    render(<PhotoCard photo={mockPhoto} onClick={mockOnClick} />)

    const card = screen.getByRole("img").parentElement
    fireEvent.click(card!)

    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })

  it("displays photographer name on hover", () => {
    render(<PhotoCard photo={mockPhoto} onClick={mockOnClick} />)

    expect(screen.getByText("Photo by Test Photographer")).toBeInTheDocument()
  })
})
