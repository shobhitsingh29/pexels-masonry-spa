import { render, screen } from "@testing-library/react"
import { ErrorBoundary } from "@/components/error-boundary"

const ThrowError = () => {
  throw new Error("Test error")
}

describe("ErrorBoundary", () => {
  beforeEach(() => {
    // Suppress console.error for expected errors
    jest.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("renders children when there is no error", () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    )
    
    expect(screen.getByText("Test content")).toBeInTheDocument()
  })

  it("renders error message when child component throws", () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )
    
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
  })

  it("provides error details in development", () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = "development"
    
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )
    
    expect(screen.getByText(/test error/i)).toBeInTheDocument()
    
    process.env.NODE_ENV = originalEnv
  })

  it("hides error details in production", () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = "production"
    
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )
    
    expect(screen.queryByText(/test error/i)).not.toBeInTheDocument()
    
    process.env.NODE_ENV = originalEnv
  })

  it("provides a retry button", () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )
    
    const retryButton = screen.getByRole("button", { name: /retry/i })
    expect(retryButton).toBeInTheDocument()
  })

  it("resets error state when retry button is clicked", () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )
    
    const retryButton = screen.getByRole("button", { name: /retry/i })
    retryButton.click()
    
    // Re-render with non-error content
    rerender(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    )
    
    expect(screen.getByText("Test content")).toBeInTheDocument()
  })

  it("handles multiple errors", () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )
    
    // First error
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    
    // Retry
    screen.getByRole("button", { name: /retry/i }).click()
    
    // Second error
    rerender(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )
    
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
  })
}) 