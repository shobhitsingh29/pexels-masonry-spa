import { renderHook, act } from "@testing-library/react"
import { useDebounce } from "@/hooks/use-debounce"

describe("useDebounce", () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it("returns initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("initial", 300))
    expect(result.current).toBe("initial")
  })

  it("debounces value changes", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: "initial" } }
    )

    rerender({ value: "changed" })
    expect(result.current).toBe("initial")

    act(() => {
      jest.advanceTimersByTime(300)
    })
    expect(result.current).toBe("changed")
  })

  it("handles multiple rapid changes", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: "initial" } }
    )

    rerender({ value: "changed1" })
    rerender({ value: "changed2" })
    rerender({ value: "changed3" })

    expect(result.current).toBe("initial")

    act(() => {
      jest.advanceTimersByTime(300)
    })
    expect(result.current).toBe("changed3")
  })

  it("handles custom delay", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: "initial" } }
    )

    rerender({ value: "changed" })
    expect(result.current).toBe("initial")

    act(() => {
      jest.advanceTimersByTime(300)
    })
    expect(result.current).toBe("initial")

    act(() => {
      jest.advanceTimersByTime(200)
    })
    expect(result.current).toBe("changed")
  })

  it("handles zero delay", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 0),
      { initialProps: { value: "initial" } }
    )

    rerender({ value: "changed" })
    expect(result.current).toBe("changed")
  })

  it("handles negative delay", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, -100),
      { initialProps: { value: "initial" } }
    )

    rerender({ value: "changed" })
    expect(result.current).toBe("changed")
  })

  it("handles undefined value", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: undefined } }
    )

    rerender({ value: "changed" })
    expect(result.current).toBeUndefined()

    act(() => {
      jest.advanceTimersByTime(300)
    })
    expect(result.current).toBe("changed")
  })

  it("handles null value", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: null } }
    )

    rerender({ value: "changed" })
    expect(result.current).toBeNull()

    act(() => {
      jest.advanceTimersByTime(300)
    })
    expect(result.current).toBe("changed")
  })

  it("handles number value", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 0 } }
    )

    rerender({ value: 1 })
    expect(result.current).toBe(0)

    act(() => {
      jest.advanceTimersByTime(300)
    })
    expect(result.current).toBe(1)
  })

  it("handles boolean value", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: false } }
    )

    rerender({ value: true })
    expect(result.current).toBe(false)

    act(() => {
      jest.advanceTimersByTime(300)
    })
    expect(result.current).toBe(true)
  })

  it("handles object value", () => {
    const initialValue = { key: "value" }
    const changedValue = { key: "new value" }
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: initialValue } }
    )

    rerender({ value: changedValue })
    expect(result.current).toBe(initialValue)

    act(() => {
      jest.advanceTimersByTime(300)
    })
    expect(result.current).toBe(changedValue)
  })

  it("handles array value", () => {
    const initialValue = [1, 2, 3]
    const changedValue = [4, 5, 6]
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: initialValue } }
    )

    rerender({ value: changedValue })
    expect(result.current).toBe(initialValue)

    act(() => {
      jest.advanceTimersByTime(300)
    })
    expect(result.current).toBe(changedValue)
  })
}) 