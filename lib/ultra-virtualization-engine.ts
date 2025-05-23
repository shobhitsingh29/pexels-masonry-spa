import type { PexelsPhoto, GridItem } from "@/types/photo"

interface VirtualizationConfig {
  containerWidth: number
  containerHeight: number
  columnCount: number
  gap: number
  overscan: number
  scrollTop: number
  scrollVelocity: number
}

interface VirtualizedResult {
  visibleItems: GridItem[]
  totalHeight: number
  startIndex: number
  endIndex: number
  visibleRange: [number, number]
}

class UltraVirtualizationEngine {
  private itemCache = new Map<string, GridItem[]>()
  private heightCache = new Map<string, number>()
  private worker: Worker | null = null

  constructor() {
    this.initializeWorker()
  }

  private initializeWorker() {
    // Create a worker for heavy calculations
    const workerBlob = new Blob(
      [
        `
      function calculateMasonryLayout(photos, containerWidth, columnCount, gap = 16) {
        if (!photos.length || !containerWidth || !columnCount) return [];

        const columnWidth = (containerWidth - gap * (columnCount - 1)) / columnCount;
        const columnHeights = new Array(columnCount).fill(0);
        const items = [];

        // Pre-calculate aspect ratios
        const photoData = photos.map((photo) => ({
          photo,
          aspectRatio: photo.width / photo.height,
        }));

        // Sort by aspect ratio for better distribution
        photoData.sort((a, b) => b.aspectRatio - a.aspectRatio);

        photoData.forEach(({ photo, aspectRatio }) => {
          // Find shortest column
          const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));
          const itemHeight = columnWidth / aspectRatio;

          const item = {
            photo,
            height: itemHeight,
            column: shortestColumnIndex,
            top: columnHeights[shortestColumnIndex],
          };

          items.push(item);
          columnHeights[shortestColumnIndex] += itemHeight + gap;
        });

        return items;
      }

      function getVisibleItems(items, scrollTop, containerHeight, scrollVelocity = 0, overscan = 5) {
        if (!items.length) return [];

        const buffer = Math.min(200 + Math.abs(scrollVelocity) * 10, 1000);
        const viewportTop = scrollTop - buffer;
        const viewportBottom = scrollTop + containerHeight + buffer;

        // Binary search for efficiency
        let start = 0;
        let end = items.length - 1;
        let firstVisible = 0;

        while (start <= end) {
          const mid = Math.floor((start + end) / 2);
          if (items[mid].top + items[mid].height >= viewportTop) {
            firstVisible = mid;
            end = mid - 1;
          } else {
            start = mid + 1;
          }
        }

        // Collect visible items with overscan
        const visibleItems = [];
        const startIndex = Math.max(0, firstVisible - overscan);
        
        for (let i = startIndex; i < items.length; i++) {
          const item = items[i];
          if (item.top > viewportBottom + buffer) break;
          visibleItems.push(item);
        }

        return {
          visibleItems,
          startIndex,
          endIndex: Math.min(items.length - 1, startIndex + visibleItems.length - 1)
        };
      }

      self.onmessage = function(event) {
        const { type, data } = event.data;

        switch (type) {
          case 'CALCULATE_LAYOUT': {
            const { photos, containerWidth, columnCount, gap } = data;
            const items = calculateMasonryLayout(photos, containerWidth, columnCount, gap);
            
            const totalHeight = items.length > 0 
              ? Math.max(...items.map(item => item.top + item.height)) + gap
              : 0;

            self.postMessage({
              type: 'LAYOUT_RESULT',
              data: { items, totalHeight }
            });
            break;
          }

          case 'GET_VISIBLE_ITEMS': {
            const { items, scrollTop, containerHeight, scrollVelocity, overscan } = data;
            const result = getVisibleItems(items, scrollTop, containerHeight, scrollVelocity, overscan);
            
            self.postMessage({
              type: 'VISIBLE_ITEMS_RESULT',
              data: result
            });
            break;
          }
        }
      };
    `,
      ],
      { type: "application/javascript" },
    )

    const workerUrl = URL.createObjectURL(workerBlob)
    this.worker = new Worker(workerUrl)
  }

  async calculateLayout(photos: PexelsPhoto[], config: VirtualizationConfig): Promise<GridItem[]> {
    const cacheKey = `${photos.length}-${config.containerWidth}-${config.columnCount}`

    // Check cache first
    if (this.itemCache.has(cacheKey)) {
      return this.itemCache.get(cacheKey)!
    }

    return new Promise((resolve) => {
      if (!this.worker) {
        resolve([])
        return
      }

      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === "LAYOUT_RESULT") {
          const { items, totalHeight } = event.data.data

          // Cache the results
          this.itemCache.set(cacheKey, items)
          this.heightCache.set(cacheKey, totalHeight)

          this.worker!.removeEventListener("message", handleMessage)
          resolve(items)
        }
      }

      this.worker.addEventListener("message", handleMessage)
      this.worker.postMessage({
        type: "CALCULATE_LAYOUT",
        data: {
          photos,
          containerWidth: config.containerWidth,
          columnCount: config.columnCount,
          gap: config.gap,
        },
      })
    })
  }

  async getVisibleItems(items: GridItem[], config: VirtualizationConfig): Promise<VirtualizedResult> {
    return new Promise((resolve) => {
      if (!this.worker) {
        resolve({
          visibleItems: [],
          totalHeight: 0,
          startIndex: 0,
          endIndex: 0,
          visibleRange: [0, 0],
        })
        return
      }

      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === "VISIBLE_ITEMS_RESULT") {
          const { visibleItems, startIndex, endIndex } = event.data.data

          const totalHeight =
            items.length > 0 ? Math.max(...items.map((item) => item.top + item.height)) + config.gap : 0

          this.worker!.removeEventListener("message", handleMessage)
          resolve({
            visibleItems,
            totalHeight,
            startIndex,
            endIndex,
            visibleRange: [startIndex, endIndex],
          })
        }
      }

      this.worker.addEventListener("message", handleMessage)
      this.worker.postMessage({
        type: "GET_VISIBLE_ITEMS",
        data: {
          items,
          scrollTop: config.scrollTop,
          containerHeight: config.containerHeight,
          scrollVelocity: config.scrollVelocity,
          overscan: config.overscan,
        },
      })
    })
  }

  clearCache() {
    this.itemCache.clear()
    this.heightCache.clear()
  }

  destroy() {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
    this.clearCache()
  }
}

export const virtualizationEngine = new UltraVirtualizationEngine()
