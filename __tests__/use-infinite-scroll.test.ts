import { renderHook, act } from "@testing-library/react"
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll"

describe("useInfiniteScroll", () => {
  const mockCallback = jest.fn()
  const mockOptions = {
    threshold: 100,
    rootMargin: "0px",
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset window properties
    window.innerHeight = 1000
    window.scrollY = 0
  })

  it("calls callback when scrolled to threshold", () => {
    renderHook(() => useInfiniteScroll(mockCallback, mockOptions))
    
    act(() => {
      window.innerHeight = 100
      window.scrollY = 900
      window.dispatchEvent(new Event("scroll"))
    })
    
    expect(mockCallback).toHaveBeenCalled()
  })

  it("does not call callback when not scrolled to threshold", () => {
    renderHook(() => useInfiniteScroll(mockCallback, mockOptions))
    
    act(() => {
      window.innerHeight = 100
      window.scrollY = 100
      window.dispatchEvent(new Event("scroll"))
    })
    
    expect(mockCallback).not.toHaveBeenCalled()
  })

  it("handles custom threshold", () => {
    const customOptions = { ...mockOptions, threshold: 200 }
    renderHook(() => useInfiniteScroll(mockCallback, customOptions))
    
    act(() => {
      window.innerHeight = 100
      window.scrollY = 800
      window.dispatchEvent(new Event("scroll"))
    })
    
    expect(mockCallback).toHaveBeenCalled()
  })

  it("handles custom rootMargin", () => {
    const customOptions = { ...mockOptions, rootMargin: "100px" }
    renderHook(() => useInfiniteScroll(mockCallback, customOptions))
    
    act(() => {
      window.innerHeight = 100
      window.scrollY = 800
      window.dispatchEvent(new Event("scroll"))
    })
    
    expect(mockCallback).toHaveBeenCalled()
  })

  it("handles scroll velocity", () => {
    renderHook(() => useInfiniteScroll(mockCallback, mockOptions))
    
    act(() => {
      window.innerHeight = 100
      window.scrollY = 900
      window.dispatchEvent(new Event("scroll"))
    })
    
    expect(mockCallback).toHaveBeenCalled()
  })

  it("handles window resize", () => {
    renderHook(() => useInfiniteScroll(mockCallback, mockOptions))
    
    act(() => {
      window.innerHeight = 100
      window.scrollY = 900
      window.dispatchEvent(new Event("resize"))
    })
    
    expect(mockCallback).toHaveBeenCalled()
  })

  it("handles cleanup on unmount", () => {
    const { unmount } = renderHook(() => useInfiniteScroll(mockCallback, mockOptions))
    
    unmount()
    
    act(() => {
      window.innerHeight = 100
      window.scrollY = 900
      window.dispatchEvent(new Event("scroll"))
    })
    
    expect(mockCallback).not.toHaveBeenCalled()
  })

  it("handles multiple scroll events", () => {
    renderHook(() => useInfiniteScroll(mockCallback, mockOptions))
    
    act(() => {
      window.innerHeight = 100
      window.scrollY = 900
      window.dispatchEvent(new Event("scroll"))
      window.dispatchEvent(new Event("scroll"))
      window.dispatchEvent(new Event("scroll"))
    })
    
    expect(mockCallback).toHaveBeenCalledTimes(1)
  })

  it("handles scroll up and down", () => {
    renderHook(() => useInfiniteScroll(mockCallback, mockOptions))
    
    act(() => {
      window.innerHeight = 100
      window.scrollY = 900
      window.dispatchEvent(new Event("scroll"))
    })
    
    expect(mockCallback).toHaveBeenCalledTimes(1)
    
    act(() => {
      window.scrollY = 100
      window.dispatchEvent(new Event("scroll"))
    })
    
    expect(mockCallback).toHaveBeenCalledTimes(1)
    
    act(() => {
      window.scrollY = 900
      window.dispatchEvent(new Event("scroll"))
    })
    
    expect(mockCallback).toHaveBeenCalledTimes(2)
  })

  it("handles disabled state", () => {
    const { rerender } = renderHook(
      ({ enabled }) => useInfiniteScroll(mockCallback, mockOptions, enabled),
      { initialProps: { enabled: true } }
    )
    
    act(() => {
      window.innerHeight = 100
      window.scrollY = 900
      window.dispatchEvent(new Event("scroll"))
    })
    
    expect(mockCallback).toHaveBeenCalled()
    
    rerender({ enabled: false })
    
    act(() => {
      window.scrollY = 900
      window.dispatchEvent(new Event("scroll"))
    })
    
    expect(mockCallback).toHaveBeenCalledTimes(1)
  })
}) 