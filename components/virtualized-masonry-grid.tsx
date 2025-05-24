"use client"

import type React from "react"
import { useState, useEffect, useMemo, useCallback, useRef, memo, startTransition } from "react"
import styled from "styled-components"
import type { VirtualizedGridProps, GridItem } from "@/types/photo"
import {
  calculateMasonryLayout,
  getResponsiveColumnCount,
  getVisibleItems,
  calculateTotalHeight,
} from "@/lib/masonry-utils"
import { virtualizationEngine } from "@/lib/ultra-virtualization-engine"
import { PhotoCard } from "./photo-card"
import { LoadingSpinner } from "./loading-spinner"

const GridContainer = styled.div`
  position: relative;
  width: 100%;
  overflow-y: auto;
  height: 100vh;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
  padding-bottom: 400px; /* Increased padding for better infinite scroll */
`

const GridContent = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== "height",
})<{ height: number }>`
  position: relative;
  height: ${(props) => props.height}px;
  width: 100%;
  will-change: transform;
  min-height: 100vh;
`

// Memoized PhotoCard component to prevent unnecessary re-renders
const MemoizedPhotoCard = memo(PhotoCard)

// Intersection Observer options
const observerOptions = {
  root: null,
  rootMargin: "500px 0px",
  threshold: 0.1,
}

// Throttle utility function
function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  let lastFunc: ReturnType<typeof setTimeout>
  let lastRan: number

  return function(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args)
      lastRan = Date.now()
      inThrottle = true
    } else {
      clearTimeout(lastFunc)
      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          func.apply(this, args)
          lastRan = Date.now()
        }
      }, limit - (Date.now() - lastRan))
    }
  }
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>

  return function(this: any, ...args: Parameters<T>) {
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(this, args), wait)
  }
}

const ultraEngine = virtualizationEngine

export const VirtualizedMasonryGrid: React.FC<VirtualizedGridProps & { overscan?: number }> = ({
  photos,
  onPhotoClick,
  loading = false,
  onLoadMore,
  hasMore = false,
  overscan = 5,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)
  const [scrollVelocity, setScrollVelocity] = useState(0)
  const lastScrollTop = useRef(0)
  const lastScrollTime = useRef(Date.now())
  const scrollingTimeout = useRef<NodeJS.Timeout | null>(null)
  const isScrolling = useRef(false)
  const loadMoreObserverRef = useRef<IntersectionObserver | null>(null)
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null)

  // Memoized column count based on container width
  const columnCount = useMemo(() => {
    return Math.max(1, Math.floor(containerWidth / 320))
  }, [containerWidth])

  // Memoized masonry layout calculation with dependency optimization
  const gridItems = useMemo(() => {
    if (!containerWidth || photos.length === 0 || columnCount === 0) return []
    return calculateMasonryLayout(photos, containerWidth, columnCount)
  }, [photos, containerWidth, columnCount])

  // Memoized visible items calculation with scroll velocity
  const visibleItems = useMemo(() => {
    // Increase the visible area by adding extra padding to containerHeight
    const expandedHeight = containerHeight * 2 // Double the visible area
    return getVisibleItems(
      gridItems,
      Math.max(0, scrollTop - containerHeight), // Start rendering earlier
      expandedHeight,
      scrollVelocity
    )
  }, [gridItems, scrollTop, containerHeight, scrollVelocity])

  // Calculate total grid height with additional padding
  const totalHeight = useMemo(() => {
    if (gridItems.length === 0) return window.innerHeight
    return Math.max(
      calculateTotalHeight(gridItems) + 16,
      window.innerHeight + 400 // Ensure minimum height is viewport + padding
    )
  }, [gridItems])

  // Setup Intersection Observer for infinite loading
  useEffect(() => {
    if (!loadMoreTriggerRef.current || !onLoadMore || !hasMore) return

    loadMoreObserverRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loading && hasMore) {
        onLoadMore()
      }
    }, observerOptions)

    loadMoreObserverRef.current.observe(loadMoreTriggerRef.current)

    return () => {
      if (loadMoreObserverRef.current) {
        loadMoreObserverRef.current.disconnect()
      }
    }
  }, [onLoadMore, hasMore, loading])

  // Calculate layout and visible items using the web worker
  useEffect(() => {
    let cancelled = false
    if (!containerWidth || photos.length === 0 || columnCount === 0) {
      return
    }

    const expandedHeight = containerHeight * 2 // Double the visible area
    const expandedOverscan = overscan * 2 // Double the overscan
    const adjustedScrollTop = Math.max(0, scrollTop - containerHeight) // Start rendering earlier

    ultraEngine.calculateLayout(photos, {
      containerWidth,
      containerHeight: expandedHeight,
      columnCount,
      gap: 16,
      overscan: expandedOverscan,
      scrollTop: adjustedScrollTop,
      scrollVelocity,
    }).then((items) => {
      if (cancelled) return
      // The layout is now handled by the memoized gridItems
    })
    return () => {
      cancelled = true
    }
  }, [photos, containerWidth, containerHeight, columnCount, overscan, scrollTop, scrollVelocity])

  // Optimized scroll handler with throttling
  const handleScroll = useCallback(
    throttle((e: React.UIEvent<HTMLDivElement>) => {
      const target = e.target as HTMLDivElement
      const currentScrollTop = target.scrollTop
      const now = Date.now()
      const timeDelta = now - lastScrollTime.current

      if (timeDelta > 0) {
        const rawVelocity = (currentScrollTop - lastScrollTop.current) / timeDelta
        setScrollVelocity((prev) => prev * 0.8 + rawVelocity * 0.2)
      }

      lastScrollTop.current = currentScrollTop
      lastScrollTime.current = now

      // Use startTransition for non-urgent state updates
      startTransition(() => {
        setScrollTop(currentScrollTop)
      })

      // Track active scrolling for optimizations
      if (!isScrolling.current) {
        isScrolling.current = true
      }

      // Clear previous timeout
      if (scrollingTimeout.current) {
        clearTimeout(scrollingTimeout.current)
      }

      // Set timeout to detect when scrolling stops
      scrollingTimeout.current = setTimeout(() => {
        isScrolling.current = false
        setScrollVelocity(0)
      }, 150) // Increased timeout for smoother scrolling
    }, 16), // Throttle to ~60fps
    []
  )

  // Optimized resize handler with debouncing
  const handleResize = useCallback(
    debounce(() => {
      if (!containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()

      // Only update if dimensions actually changed
      if (rect.width !== containerWidth || rect.height !== containerHeight) {
        setContainerWidth(rect.width)
        setContainerHeight(rect.height)
      }
    }, 100),
    [containerWidth, containerHeight]
  )

  // Setup resize observer with cleanup and RAF
  useEffect(() => {
    let rafId: number
    const resizeObserver = new ResizeObserver(() => {
      // Use requestAnimationFrame for smooth resize handling
      if (rafId) {
        cancelAnimationFrame(rafId)
      }
      rafId = requestAnimationFrame(handleResize)
    })

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
      handleResize() // Initial measurement
    }

    return () => {
      resizeObserver.disconnect()
      if (rafId) {
        cancelAnimationFrame(rafId)
      }
      if (scrollingTimeout.current) {
        clearTimeout(scrollingTimeout.current)
      }
    }
  }, [handleResize])

  // Optimized render function with memoization and unique keys
  const renderPhotoCards = useCallback(() => {
    const columnWidth = (containerWidth - 16 * (columnCount - 1)) / columnCount

    return visibleItems.map((item) => {
      // Calculate the actual width based on column span
      const itemWidth = columnWidth * item.columnSpan + 16 * (item.columnSpan - 1)
      const left = item.column * (columnWidth + 16)

      return (
        <MemoizedPhotoCard
          key={`${item.photo.id}-${item.column}-${item.top}`}
          photo={item.photo}
          style={{
            position: "absolute",
            left: `${left}px`,
            top: `${item.top}px`,
            width: `${itemWidth}px`,
            height: `${item.height}px`,
            willChange: "transform",
            transform: "translateZ(0)",
          }}
          onClick={() => onPhotoClick(item.photo)}
        />
      )
    })
  }, [visibleItems, containerWidth, columnCount, onPhotoClick])

  return (
    <GridContainer ref={containerRef} onScroll={handleScroll}>
      <GridContent height={totalHeight}>
        {renderPhotoCards()}
        {(loading || hasMore) && (
          <div
            ref={loadMoreTriggerRef}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: "100%",
              height: "200px",
            }}
          >
            {loading && (
              <LoadingSpinner
                style={{
                  position: "absolute",
                  bottom: "20px",
                  left: "50%",
                  transform: "translateX(-50%)",
                }}
              />
            )}
          </div>
        )}
      </GridContent>
    </GridContainer>
  )
}