"use client"

import type React from "react"
import { useState, useCallback, useRef, useEffect, memo } from "react"
import styled from "styled-components"

const ImageContainer = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== "aspectRatio",
})<{ aspectRatio: number }>`
  position: relative;
  width: 100%;
  aspect-ratio: ${(props) => props.aspectRatio};
  overflow: hidden;
  contain: layout style paint;
  content-visibility: auto;
`

const Image = styled.img.withConfig({
  shouldForwardProp: (prop) => !["loaded", "priority"].includes(prop),
})<{ loaded: boolean; priority: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.2s ease-out;
  opacity: ${(props) => (props.loaded ? 1 : 0)};
  transform: translateZ(0);
  will-change: opacity;
  image-rendering: ${(props) => (props.priority ? "-webkit-optimize-contrast" : "auto")};
`

const PlaceholderCanvas = styled.canvas`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  filter: blur(10px);
  transform: scale(1.1);
  transition: opacity 0.3s ease-out;
`

const LoadingIndicator = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== "color",
})<{ color: string }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, ${(props) => props.color}22, ${(props) => props.color}44);
  display: flex;
  align-items: center;
  justify-content: center;
  
  &::after {
    content: '';
    width: 20px;
    height: 20px;
    border: 2px solid transparent;
    border-top: 2px solid rgba(255, 255, 255, 0.6);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`

interface ImageSource {
  tiny?: string
  small?: string
  medium?: string
  large?: string
  original: string
}

interface UltraOptimizedImageProps {
  src: ImageSource
  alt: string
  width: number
  height: number
  placeholder?: string
  avgColor?: string
  priority?: boolean
  onLoad?: () => void
  onError?: () => void
}

// Constants for optimization
const IMAGE_LOAD_PRIORITY = {
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
} as const

const QUALITY_LEVELS = {
  THUMBNAIL: 'tiny',
  PREVIEW: 'small',
  FULL: 'large',
} as const

type QualityLevel = typeof QUALITY_LEVELS[keyof typeof QUALITY_LEVELS]

// Generate LQIP (Low Quality Image Placeholder) on canvas
function generateLQIP(
  canvas: HTMLCanvasElement,
  color: string,
  width: number,
  height: number
): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.fillStyle = color
  ctx.fillRect(0, 0, width, height)
}

export const UltraOptimizedImage: React.FC<UltraOptimizedImageProps> = memo(
  ({ src, alt, width, height, placeholder, avgColor = "#cccccc", priority = false, onLoad, onError }) => {
    const [loaded, setLoaded] = useState(false)
    const [error, setError] = useState(false)
    const [inView, setInView] = useState(priority)
    const [currentQuality, setCurrentQuality] = useState<string>(
      priority ? QUALITY_LEVELS.FULL : QUALITY_LEVELS.THUMBNAIL
    )

    const imageRef = useRef<HTMLImageElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const observerRef = useRef<IntersectionObserver | null>(null)
    const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const aspectRatio = width / height

    // Handle image load with quality progression
    const handleLoad = useCallback(() => {
      if (currentQuality === QUALITY_LEVELS.THUMBNAIL) {
        setCurrentQuality(QUALITY_LEVELS.PREVIEW)
      } else if (currentQuality === QUALITY_LEVELS.PREVIEW) {
        setCurrentQuality(QUALITY_LEVELS.FULL)
      } else {
        setLoaded(true)
        onLoad?.()
      }
    }, [currentQuality, onLoad])

    // Handle image error
    const handleError = useCallback(() => {
      setError(true)
      onError?.()
    }, [onError])

    // Setup intersection observer for lazy loading
    useEffect(() => {
      if (priority || !containerRef.current) return

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            setInView(true)
            observerRef.current?.disconnect()
          }
        },
        {
          rootMargin: "50px",
          threshold: 0.01,
        },
      )

      observerRef.current.observe(containerRef.current)

      return () => {
        observerRef.current?.disconnect()
      }
    }, [priority])

    // Generate LQIP when component mounts
    useEffect(() => {
      if (canvasRef.current && !loaded) {
        generateLQIP(canvasRef.current, avgColor, 40, Math.round(40 / aspectRatio))
      }
    }, [avgColor, aspectRatio, loaded])

    // Cleanup function
    useEffect(() => {
      return () => {
        if (loadTimeoutRef.current) {
          clearTimeout(loadTimeoutRef.current)
        }
        if (observerRef.current) {
          observerRef.current.disconnect()
        }
      }
    }, [])

    // Get the appropriate image source based on quality level
    const getImageSource = useCallback(() => {
      if (!src) return ''
      
      const qualityMap: Record<QualityLevel, string> = {
        [QUALITY_LEVELS.THUMBNAIL]: src.tiny || src.small || src.original,
        [QUALITY_LEVELS.PREVIEW]: src.small || src.medium || src.original,
        [QUALITY_LEVELS.FULL]: src.large || src.original,
      }
      
      return qualityMap[currentQuality as QualityLevel] || src.original
    }, [src, currentQuality])

    return (
      <ImageContainer ref={containerRef} aspectRatio={aspectRatio}>
        {!loaded && (
          <PlaceholderCanvas ref={canvasRef} />
        )}
        
        {inView && (
          <Image
            ref={imageRef}
            src={getImageSource()}
            alt={alt}
            loaded={loaded}
            priority={priority}
            onLoad={handleLoad}
            onError={handleError}
          />
        )}

        {!loaded && !error && (
          <LoadingIndicator color={avgColor} />
        )}
      </ImageContainer>
    )
  },
  (prevProps, nextProps) => {
    // Custom comparison for memo
    return (
      prevProps.src === nextProps.src &&
      prevProps.width === nextProps.width &&
      prevProps.height === nextProps.height &&
      prevProps.priority === nextProps.priority
    )
  }
)

UltraOptimizedImage.displayName = "UltraOptimizedImage"
