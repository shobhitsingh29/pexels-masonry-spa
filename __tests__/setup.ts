import '@testing-library/jest-dom'
import '@testing-library/jest-dom/extend-expect'

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveStyle(style: Record<string, any>): R
      toHaveAttribute(attr: string, value?: string): R
    }
  }
}

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = jest.fn()
  unobserve = jest.fn()
  disconnect = jest.fn()
  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {}
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
}) 