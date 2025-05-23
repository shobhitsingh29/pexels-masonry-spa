export interface PexelsPhoto {
  id: number
  width: number
  height: number
  url: string
  photographer: string
  photographer_url: string
  photographer_id: number
  avg_color: string
  src: {
    original: string
    large2x: string
    large: string
    medium: string
    small: string
    portrait: string
    landscape: string
    tiny: string
  }
  liked: boolean
  alt: string
}

export interface PexelsResponse {
  page: number
  per_page: number
  photos: PexelsPhoto[]
  total_results: number
  next_page?: string
  prev_page?: string
}

export interface GridItem {
  photo: PexelsPhoto
  height: number
  column: number
  top: number
  columnSpan: number
}

export interface VirtualizedGridProps {
  photos: PexelsPhoto[]
  onPhotoClick: (photo: PexelsPhoto) => void
  loading?: boolean
  onLoadMore?: () => void
  hasMore?: boolean
}

export interface SearchState {
  query: string
  isSearching: boolean
  results: PexelsPhoto[]
  hasMore: boolean
  page: number
}
