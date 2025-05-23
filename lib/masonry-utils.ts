import type { PexelsPhoto, GridItem } from "@/types/photo"

// Constants for optimization
const BATCH_SIZE = 50
const RESIZE_DEBOUNCE_MS = 100
const SCROLL_THROTTLE_MS = 16 // ~60fps
const MIN_COLUMN_SPAN = 1
const MAX_COLUMN_SPAN = 3
const ASPECT_RATIO_THRESHOLD = 1.0 // Lower threshold to allow more images to span multiple columns
const WIDE_IMAGE_THRESHOLD = 1.5 // Threshold for very wide images

// Cache for layout calculations
const layoutCache = new Map<string, GridItem[]>()

// More efficient masonry layout calculation with variable width support
export function calculateMasonryLayout(
  photos: PexelsPhoto[],
  containerWidth: number,
  columnCount: number,
  gap = 16,
): GridItem[] {
  if (!photos.length || !containerWidth || !columnCount) return []

  const cacheKey = `${photos.length}-${containerWidth}-${columnCount}`
  if (layoutCache.has(cacheKey)) {
    return layoutCache.get(cacheKey)!
  }

  const columnWidth = (containerWidth - gap * (columnCount - 1)) / columnCount
  const columnHeights = new Array(columnCount).fill(0)
  const items: GridItem[] = []

  // Process photos in batches
  for (let i = 0; i < photos.length; i += BATCH_SIZE) {
    const batch = photos.slice(i, i + BATCH_SIZE)
    
    // Pre-calculate aspect ratios and determine column spans
    const photoData = batch.map((photo) => {
      const aspectRatio = photo.width / photo.height
      // Calculate optimal column span based on aspect ratio
      let columnSpan = MIN_COLUMN_SPAN
      
      // More aggressive column span calculation
      if (aspectRatio > WIDE_IMAGE_THRESHOLD) {
        columnSpan = MAX_COLUMN_SPAN
      } else if (aspectRatio > ASPECT_RATIO_THRESHOLD) {
        // Calculate span based on how much wider than threshold
        const ratio = aspectRatio / ASPECT_RATIO_THRESHOLD
        columnSpan = Math.min(
          Math.max(
            Math.ceil(ratio),
            MIN_COLUMN_SPAN
          ),
          MAX_COLUMN_SPAN
        )
      }

      // Ensure we don't exceed available columns
      columnSpan = Math.min(columnSpan, columnCount)

      return {
        photo,
        aspectRatio,
        columnSpan,
      }
    })

    // Sort batch by height for better column balancing
    photoData.sort((a, b) => b.aspectRatio - a.aspectRatio)

    // Place photos in columns using a greedy algorithm
    photoData.forEach(({ photo, aspectRatio, columnSpan }) => {
      // Find the shortest column that can accommodate the span
      let shortestColumnIndex = 0
      let minHeight = Infinity
      
      // Check all possible starting positions for this span
      for (let j = 0; j <= columnCount - columnSpan; j++) {
        const maxHeight = Math.max(...columnHeights.slice(j, j + columnSpan))
        if (maxHeight < minHeight) {
          minHeight = maxHeight
          shortestColumnIndex = j
        }
      }

      // Calculate height based on aspect ratio and column span
      const itemWidth = columnWidth * columnSpan + gap * (columnSpan - 1)
      const itemHeight = itemWidth / aspectRatio

      // Create grid item
      const item: GridItem = {
        photo,
        height: itemHeight,
        column: shortestColumnIndex,
        top: minHeight,
        columnSpan,
      }

      items.push(item)

      // Update heights for all columns spanned by this item
      for (let j = 0; j < columnSpan; j++) {
        columnHeights[shortestColumnIndex + j] = minHeight + itemHeight + gap
      }
    })
  }

  // Cache the results
  layoutCache.set(cacheKey, items)
  
  // Clear old cache entries if cache gets too large
  if (layoutCache.size > 100) {
    const keys = Array.from(layoutCache.keys())
    for (let i = 0; i < keys.length - 50; i++) {
      layoutCache.delete(keys[i])
    }
  }

  return items
}

// Dynamic column count based on screen size and device performance
export function getResponsiveColumnCount(width: number): number {
  // More granular breakpoints for better responsiveness
  if (width < 480) return 1
  if (width < 640) return 2
  if (width < 1024) return 3
  if (width < 1280) return 4
  if (width < 1536) return 5
  return 6
}

// Optimized visible items calculation with improved binary search
export function getVisibleItems(
  items: GridItem[],
  scrollTop: number,
  containerHeight: number,
  scrollVelocity = 0,
  defaultBuffer = 200,
): GridItem[] {
  if (!items.length) return []

  // Adjust buffer based on scroll velocity with a maximum limit
  const buffer = Math.min(defaultBuffer + Math.abs(scrollVelocity) * 10, 1000)
  const viewportTop = scrollTop - buffer
  const viewportBottom = scrollTop + containerHeight + buffer

  // Use binary search to find first visible item
  let start = 0
  let end = items.length - 1
  let firstVisibleIndex = 0

  // Optimize binary search for common cases
  if (items[0].top + items[0].height >= viewportTop) {
    firstVisibleIndex = 0
  } else if (items[end].top <= viewportTop) {
    firstVisibleIndex = end
  } else {
    while (start <= end) {
      const mid = Math.floor((start + end) / 2)
      const itemTop = items[mid].top
      const itemBottom = itemTop + items[mid].height

      if (itemBottom >= viewportTop) {
        firstVisibleIndex = mid
        end = mid - 1
      } else {
        start = mid + 1
      }
    }
  }

  // Collect visible items with early exit
  const visibleItems: GridItem[] = []
  for (let i = firstVisibleIndex; i < items.length; i++) {
    const item = items[i]
    if (item.top > viewportBottom) break
    visibleItems.push(item)
  }

  return visibleItems
}

// Calculate total height of the grid
export function calculateTotalHeight(items: GridItem[]): number {
  if (!items.length) return 0

  // Group items by column
  const columnItems: Record<number, GridItem[]> = {}
  items.forEach((item) => {
    if (!columnItems[item.column]) {
      columnItems[item.column] = []
    }
    columnItems[item.column].push(item)
  })

  // Find the tallest column
  let maxHeight = 0
  Object.values(columnItems).forEach((columnItems) => {
    if (!columnItems.length) return
    const lastItem = columnItems.reduce((tallest, item) => (item.top > tallest.top ? item : tallest), columnItems[0])
    const columnHeight = lastItem.top + lastItem.height
    maxHeight = Math.max(maxHeight, columnHeight)
  })

  return maxHeight
}
