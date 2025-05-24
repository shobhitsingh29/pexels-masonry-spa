import { renderHook, act } from "@testing-library/react"
import { useLocalStorage } from "@/hooks/use-local-storage"

describe("useLocalStorage", () => {
  beforeEach(() => {
    window.localStorage.clear()
    jest.clearAllMocks()
  })

  it("returns initial value when no stored value exists", () => {
    const { result } = renderHook(() => useLocalStorage("test", "initial"))
    expect(result.current[0]).toBe("initial")
  })

  it("returns stored value when it exists", () => {
    window.localStorage.setItem("test", JSON.stringify("stored"))
    const { result } = renderHook(() => useLocalStorage("test", "initial"))
    expect(result.current[0]).toBe("stored")
  })

  it("updates stored value", () => {
    const { result } = renderHook(() => useLocalStorage("test", "initial"))
    
    act(() => {
      result.current[1]("updated")
    })
    
    expect(result.current[0]).toBe("updated")
    expect(JSON.parse(window.localStorage.getItem("test")!)).toBe("updated")
  })

  it("handles object values", () => {
    const initialValue = { key: "value" }
    const { result } = renderHook(() => useLocalStorage("test", initialValue))
    
    act(() => {
      result.current[1]({ key: "new value" })
    })
    
    expect(result.current[0]).toEqual({ key: "new value" })
    expect(JSON.parse(window.localStorage.getItem("test")!)).toEqual({ key: "new value" })
  })

  it("handles array values", () => {
    const initialValue = [1, 2, 3]
    const { result } = renderHook(() => useLocalStorage("test", initialValue))
    
    act(() => {
      result.current[1]([4, 5, 6])
    })
    
    expect(result.current[0]).toEqual([4, 5, 6])
    expect(JSON.parse(window.localStorage.getItem("test")!)).toEqual([4, 5, 6])
  })

  it("handles null values", () => {
    const { result } = renderHook(() => useLocalStorage("test", null))
    
    act(() => {
      result.current[1](null)
    })
    
    expect(result.current[0]).toBeNull()
    expect(JSON.parse(window.localStorage.getItem("test")!)).toBeNull()
  })

  it("handles undefined values", () => {
    const { result } = renderHook(() => useLocalStorage("test", undefined))
    
    act(() => {
      result.current[1](undefined)
    })
    
    expect(result.current[0]).toBeUndefined()
    expect(window.localStorage.getItem("test")).toBeNull()
  })

  it("handles number values", () => {
    const { result } = renderHook(() => useLocalStorage("test", 0))
    
    act(() => {
      result.current[1](42)
    })
    
    expect(result.current[0]).toBe(42)
    expect(JSON.parse(window.localStorage.getItem("test")!)).toBe(42)
  })

  it("handles boolean values", () => {
    const { result } = renderHook(() => useLocalStorage("test", false))
    
    act(() => {
      result.current[1](true)
    })
    
    expect(result.current[0]).toBe(true)
    expect(JSON.parse(window.localStorage.getItem("test")!)).toBe(true)
  })

  it("handles multiple keys", () => {
    const { result: result1 } = renderHook(() => useLocalStorage("key1", "value1"))
    const { result: result2 } = renderHook(() => useLocalStorage("key2", "value2"))
    
    act(() => {
      result1.current[1]("new value 1")
      result2.current[1]("new value 2")
    })
    
    expect(result1.current[0]).toBe("new value 1")
    expect(result2.current[0]).toBe("new value 2")
    expect(JSON.parse(window.localStorage.getItem("key1")!)).toBe("new value 1")
    expect(JSON.parse(window.localStorage.getItem("key2")!)).toBe("new value 2")
  })

  it("handles storage errors", () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {})
    const mockError = new Error("Storage error")
    jest.spyOn(window.localStorage, "setItem").mockImplementation(() => {
      throw mockError
    })
    
    const { result } = renderHook(() => useLocalStorage("test", "initial"))
    
    act(() => {
      result.current[1]("updated")
    })
    
    expect(consoleError).toHaveBeenCalledWith("Error setting localStorage key 'test':", mockError)
    expect(result.current[0]).toBe("initial")
    
    consoleError.mockRestore()
  })

  it("handles storage quota exceeded", () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {})
    const mockError = new DOMException("QuotaExceededError")
    jest.spyOn(window.localStorage, "setItem").mockImplementation(() => {
      throw mockError
    })
    
    const { result } = renderHook(() => useLocalStorage("test", "initial"))
    
    act(() => {
      result.current[1]("updated")
    })
    
    expect(consoleError).toHaveBeenCalledWith("Error setting localStorage key 'test':", mockError)
    expect(result.current[0]).toBe("initial")
    
    consoleError.mockRestore()
  })

  it("handles invalid JSON in storage", () => {
    window.localStorage.setItem("test", "invalid json")
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {})
    
    const { result } = renderHook(() => useLocalStorage("test", "initial"))
    
    expect(consoleError).toHaveBeenCalled()
    expect(result.current[0]).toBe("initial")
    
    consoleError.mockRestore()
  })
}) 