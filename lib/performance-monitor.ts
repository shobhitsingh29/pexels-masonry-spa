interface PerformanceMetrics {
  lcp?: number
  fid?: number
  cls?: number
  fcp?: number
  ttfb?: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {}
  private observers: PerformanceObserver[] = []

  constructor() {
    this.initializeObservers()
  }

  private initializeObservers() {
    // Largest Contentful Paint
    if ("PerformanceObserver" in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1] as any
          this.metrics.lcp = lastEntry.startTime
        })
        lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] })
        this.observers.push(lcpObserver)
      } catch (e) {
        console.warn("LCP observer not supported")
      }

      // First Input Delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            this.metrics.fid = entry.processingStart - entry.startTime
          })
        })
        fidObserver.observe({ entryTypes: ["first-input"] })
        this.observers.push(fidObserver)
      } catch (e) {
        console.warn("FID observer not supported")
      }

      // Cumulative Layout Shift
      try {
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value
            }
          })
          this.metrics.cls = clsValue
        })
        clsObserver.observe({ entryTypes: ["layout-shift"] })
        this.observers.push(clsObserver)
      } catch (e) {
        console.warn("CLS observer not supported")
      }
    }

    // First Contentful Paint and TTFB
    if ("performance" in window && "getEntriesByType" in performance) {
      const paintEntries = performance.getEntriesByType("paint")
      const fcpEntry = paintEntries.find((entry) => entry.name === "first-contentful-paint")
      if (fcpEntry) {
        this.metrics.fcp = fcpEntry.startTime
      }

      const navigationEntries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[]
      if (navigationEntries.length > 0) {
        this.metrics.ttfb = navigationEntries[0].responseStart - navigationEntries[0].requestStart
      }
    }
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  logMetrics() {
    console.group("🚀 Performance Metrics")
    console.log("LCP (Largest Contentful Paint):", this.metrics.lcp?.toFixed(2), "ms")
    console.log("FID (First Input Delay):", this.metrics.fid?.toFixed(2), "ms")
    console.log("CLS (Cumulative Layout Shift):", this.metrics.cls?.toFixed(4))
    console.log("FCP (First Contentful Paint):", this.metrics.fcp?.toFixed(2), "ms")
    console.log("TTFB (Time to First Byte):", this.metrics.ttfb?.toFixed(2), "ms")
    console.groupEnd()
  }

  disconnect() {
    this.observers.forEach((observer) => observer.disconnect())
    this.observers = []
  }
}

export const performanceMonitor = new PerformanceMonitor()

// Auto-log metrics after page load
if (typeof window !== "undefined") {
  window.addEventListener("load", () => {
    setTimeout(() => {
      performanceMonitor.logMetrics()
    }, 3000) // Wait 3 seconds for metrics to stabilize
  })
}
