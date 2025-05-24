import { render, screen, fireEvent, act } from "@testing-library/react"
import { App } from "@/app"
import { fetchCuratedPhotos, searchPhotos } from "@/lib/pexels-api"

// Mock the API functions
jest.mock("@/lib/pexels-api", () => ({
  fetchCuratedPhotos: jest.fn(),
  searchPhotos: jest.fn(),
}))

const mockPhoto = {
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

describe("App", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(fetchCuratedPhotos as jest.Mock).mockResolvedValue({
      photos: [mockPhoto],
      page: 1,
      per_page: 1,
      total_results: 1,
    })
    ;(searchPhotos as jest.Mock).mockResolvedValue({
      photos: [mockPhoto],
      page: 1,
      per_page: 1,
      total_results: 1,
    })
  })

  it("renders initial curated photos", async () => {
    render(<App />)
    
    // Wait for photos to load
    const photo = await screen.findByRole("img")
    expect(photo).toBeInTheDocument()
    expect(fetchCuratedPhotos).toHaveBeenCalledWith(1, 20)
  })

  it("handles search", async () => {
    render(<App />)
    const searchInput = screen.getByPlaceholderText(/search photos/i)
    
    fireEvent.change(searchInput, { target: { value: "nature" } })
    fireEvent.submit(screen.getByRole("search"))
    
    // Wait for search results
    const photo = await screen.findByRole("img")
    expect(photo).toBeInTheDocument()
    expect(searchPhotos).toHaveBeenCalledWith("nature", 1, 20)
  })

  it("handles photo click", async () => {
    render(<App />)
    
    // Wait for photos to load
    const photo = await screen.findByRole("img")
    fireEvent.click(photo)
    
    // Verify modal is shown
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.getByText(mockPhoto.photographer)).toBeInTheDocument()
  })

  it("handles like action", async () => {
    render(<App />)
    
    // Wait for photos to load
    const photo = await screen.findByRole("img")
    fireEvent.click(photo)
    
    const likeButton = screen.getByRole("button", { name: /like/i })
    fireEvent.click(likeButton)
    
    // Verify like state is updated
    expect(screen.getByRole("button", { name: /unlike/i })).toBeInTheDocument()
  })

  it("handles unlike action", async () => {
    const likedPhoto = { ...mockPhoto, liked: true }
    ;(fetchCuratedPhotos as jest.Mock).mockResolvedValue({
      photos: [likedPhoto],
      page: 1,
      per_page: 1,
      total_results: 1,
    })
    
    render(<App />)
    
    // Wait for photos to load
    const photo = await screen.findByRole("img")
    fireEvent.click(photo)
    
    const unlikeButton = screen.getByRole("button", { name: /unlike/i })
    fireEvent.click(unlikeButton)
    
    // Verify unlike state is updated
    expect(screen.getByRole("button", { name: /like/i })).toBeInTheDocument()
  })

  it("handles load more", async () => {
    render(<App />)
    
    // Wait for initial photos to load
    await screen.findByRole("img")
    
    // Scroll to bottom
    act(() => {
      window.innerHeight = 100
      window.scrollY = 1000
      window.dispatchEvent(new Event("scroll"))
    })
    
    // Wait for more photos to load
    await screen.findByRole("img")
    expect(fetchCuratedPhotos).toHaveBeenCalledWith(2, 20)
  })

  it("handles search error", async () => {
    ;(searchPhotos as jest.Mock).mockRejectedValue(new Error("Search failed"))
    
    render(<App />)
    const searchInput = screen.getByPlaceholderText(/search photos/i)
    
    fireEvent.change(searchInput, { target: { value: "nature" } })
    fireEvent.submit(screen.getByRole("search"))
    
    // Verify error message is shown
    expect(await screen.findByText(/failed to load/i)).toBeInTheDocument()
  })

  it("handles initial load error", async () => {
    ;(fetchCuratedPhotos as jest.Mock).mockRejectedValue(new Error("Load failed"))
    
    render(<App />)
    
    // Verify error message is shown
    expect(await screen.findByText(/failed to load/i)).toBeInTheDocument()
  })

  it("handles empty search results", async () => {
    ;(searchPhotos as jest.Mock).mockResolvedValue({
      photos: [],
      page: 1,
      per_page: 20,
      total_results: 0,
    })
    
    render(<App />)
    const searchInput = screen.getByPlaceholderText(/search photos/i)
    
    fireEvent.change(searchInput, { target: { value: "nonexistent" } })
    fireEvent.submit(screen.getByRole("search"))
    
    // Verify no results message is shown
    expect(await screen.findByText(/no photos found/i)).toBeInTheDocument()
  })

  it("handles window resize", async () => {
    render(<App />)
    
    // Wait for initial photos to load
    await screen.findByRole("img")
    
    // Resize window
    act(() => {
      window.innerWidth = 500
      window.dispatchEvent(new Event("resize"))
    })
    
    // Wait for layout to update
    await screen.findByRole("img")
  })

  it("handles keyboard navigation", async () => {
    render(<App />)
    
    // Wait for photos to load
    const photo = await screen.findByRole("img")
    fireEvent.click(photo)
    
    // Close modal with Escape key
    fireEvent.keyDown(document, { key: "Escape" })
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })
}) 