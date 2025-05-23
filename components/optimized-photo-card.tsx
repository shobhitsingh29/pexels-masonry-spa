"use client"

import type React from "react"
import { useState, useCallback, useRef, memo, useEffect } from "react"
import styled from "styled-components"
import type { PexelsPhoto } from "@/types/photo"

const CardContainer = styled.div`
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  background-color: #f3f4f6;
  position: relative;
  will-change: transform, box-shadow;
  contain: layout style paint;

  &:hover {
    transform: translateY(-2px) translateZ(0);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(-1px) translateZ(0);
  }
`

const ImageContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
`

const Image = styled.img.withConfig({
  shouldForwardProp: (prop) => !["loaded", "isVisible"].includes(prop),
})<{ loaded: boolean; isVisible: boolean }>`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.2s ease-out;
  opacity: ${(props) => (props.loaded ? 1 : 0)};
  transform: translateZ(0);
  will-change: opacity;
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
`

const LoadingPlaceholder = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== "color",
})<{ color: string }>`
  width: 100%;
  height: 100%;
  background-color: ${(props) => props.color};
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s ease-out;
`

const PhotographerOverlay = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  color: white;
  padding: 16px 12px 8px;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.15s ease-out;
  pointer-events: none;
  will-change: opacity;

  ${CardContainer}:hover & {
    opacity: 1;
  }
`

const LoadingDot = styled.div`
  width: 8px;
  height: 8px;
  background-color: rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;

  @keyframes pulse {
    0%, 100% {
      opacity: 0.6;
      transform: scale(1);
    }
    50% {
      opacity: 1;
      transform: scale(1.1);
    }
  }
`

interface OptimizedPhotoCardProps {
  photo: PexelsPhoto
  style?: React.CSSProperties
  onClick: () => void
  priority?: boolean
}

export const OptimizedPhotoCard: React.FC<OptimizedPhotoCardProps> = memo(
  ({ photo, style, onClick, priority = false }) => {
    const [imageLoaded, setImageLoaded] = useState(false)
    const [imageError, setImageError] = useState(false)
    const [isVisible, setIsVisible] = useState(false)
    const imageRef = useRef<HTMLImageElement>(null)
    const observerRef = useRef<IntersectionObserver | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Handle image load with performance timing
    const handleImageLoad = useCallback(() => {
      setImageLoaded(true)

      // Clear timeout if image loads successfully
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current)
        loadTimeoutRef.current = null
      }
    }, [])

    // Handle image error with fallback
    const handleImageError = useCallback(() => {
      setImageError(true)

      // Clear timeout on error
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current)
        loadTimeoutRef.current = null
      }
    }, [])

    // Optimized click handler with event delegation
    const handleClick = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        // Add haptic feedback on supported devices
        if ("vibrate" in navigator) {
          navigator.vibrate(10)
        }

        onClick()
      },
      [onClick],
    )

    // Enhanced intersection observer with performance optimizations
    useEffect(() => {
      if (!containerRef.current) return

      const options = {
        rootMargin: priority ? "0px" : "100px 0px",
        threshold: 0.01,
      }

      observerRef.current = new IntersectionObserver((entries) => {
        const entry = entries[0]

        if (entry.isIntersecting && imageRef.current && !imageLoaded && !imageError) {
          setIsVisible(true)

          // Use requestIdleCallback for non-critical image loading
          const loadImage = () => {
            if (imageRef.current) {
              // Set timeout for slow loading images
              loadTimeoutRef.current = setTimeout(() => {
                setImageError(true)
              }, 10000) // 10 second timeout

              imageRef.current.src = photo.src.medium || "/placeholder.svg"
            }
          }

          if (priority) {
            // Load immediately for priority images
            loadImage()
          } else if ("requestIdleCallback" in window) {
            // Load during idle time for non-priority images
            requestIdleCallback(loadImage, { timeout: 1000 })
          } else {
            // Fallback for browsers without requestIdleCallback
            setTimeout(loadImage, 100)
          }

          // Disconnect after triggering load
          if (observerRef.current) {
            observerRef.current.disconnect()
            observerRef.current = null
          }
        }
      }, options)

      observerRef.current.observe(containerRef.current)

      return () => {
        if (observerRef.current) {
          observerRef.current.disconnect()
        }
        if (loadTimeoutRef.current) {
          clearTimeout(loadTimeoutRef.current)
        }
      }
    }, [photo.src.medium, priority, imageLoaded, imageError])

    return (
      <CardContainer ref={containerRef} style={style} onClick={handleClick}>
        <ImageContainer>
          {!imageLoaded && !imageError && (
            <LoadingPlaceholder color={photo.avg_color}>
              <LoadingDot />
            </LoadingPlaceholder>
          )}

          {!imageError && (
            <Image
              ref={imageRef}
              src="/placeholder.svg"
              alt={photo.alt || `Photo by ${photo.photographer}`}
              loaded={imageLoaded}
              isVisible={isVisible}
              onLoad={handleImageLoad}
              onError={handleImageError}
              loading={priority ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={priority ? "high" : "low"}
            />
          )}

          {imageError && (
            <LoadingPlaceholder color={photo.avg_color}>
              <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px" }}>Failed to load</span>
            </LoadingPlaceholder>
          )}
        </ImageContainer>

        <PhotographerOverlay>Photo by {photo.photographer}</PhotographerOverlay>
      </CardContainer>
    )
  },
  // Custom comparison function for better memoization
  (prevProps, nextProps) => {
    return (
      prevProps.photo.id === nextProps.photo.id &&
      prevProps.priority === nextProps.priority &&
      JSON.stringify(prevProps.style) === JSON.stringify(nextProps.style)
    )
  },
)

OptimizedPhotoCard.displayName = "OptimizedPhotoCard"
