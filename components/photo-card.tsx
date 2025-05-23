"use client"

import type React from "react"
import { useState, useCallback, useRef, memo, useEffect } from "react"
import styled from "styled-components"
import type { PexelsPhoto } from "@/types/photo"

const CardContainer = styled.div`
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  background-color: #f3f4f6;
  position: relative;
  will-change: transform, box-shadow;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }
`

const Image = styled.img.withConfig({
  shouldForwardProp: (prop) => prop !== "loaded",
})<{ loaded: boolean }>`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.3s ease;
  opacity: ${(props) => (props.loaded ? 1 : 0)};
  transform: translateZ(0); /* Force GPU acceleration */
`

const LoadingPlaceholder = styled.div<{ color: string }>`
  width: 100%;
  height: 100%;
  background-color: ${(props) => props.color};
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 0;
  left: 0;
  transition: opacity 0.3s ease;
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
  transition: opacity 0.2s ease;
  pointer-events: none;

  ${CardContainer}:hover & {
    opacity: 1;
  }
`

interface PhotoCardProps {
  photo: PexelsPhoto
  style?: React.CSSProperties
  onClick: () => void
}

export const PhotoCard: React.FC<PhotoCardProps> = memo(({ photo, style, onClick }) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const imageRef = useRef<HTMLImageElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Handle image load
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true)
  }, [])

  // Handle image error
  const handleImageError = useCallback(() => {
    setImageError(true)
  }, [])

  // Handle click
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      onClick()
    },
    [onClick],
  )

  // Setup intersection observer for lazy loading
  useEffect(() => {
    if (!containerRef.current || !imageRef.current) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && imageRef.current) {
          // Start loading the image when in viewport
          imageRef.current.src = photo.src.medium || "/placeholder.svg"

          // Disconnect after triggering load
          if (observerRef.current) {
            observerRef.current.disconnect()
            observerRef.current = null
          }
        }
      },
      {
        rootMargin: "200px 0px",
        threshold: 0.01,
      },
    )

    observerRef.current.observe(containerRef.current)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [photo.src.medium])

  return (
    <CardContainer ref={containerRef} style={style} onClick={handleClick}>
      {!imageLoaded && !imageError && <LoadingPlaceholder color={photo.avg_color} />}

      {!imageError && (
        <Image
          ref={imageRef}
          src="/placeholder.svg" // Will be set by intersection observer
          alt={photo.alt || `Photo by ${photo.photographer}`}
          loaded={imageLoaded}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
        />
      )}

      <PhotographerOverlay>Photo by {photo.photographer}</PhotographerOverlay>
    </CardContainer>
  )
})

PhotoCard.displayName = "PhotoCard"
