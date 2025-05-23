"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import type { PexelsPhoto } from "@/types/photo"
import { getPhotoById } from "@/lib/pexels-api"
import { PhotoDetail } from "@/components/photo-detail"
import { LoadingSpinner } from "@/components/loading-spinner"
import { ErrorBoundary } from "@/components/error-boundary"
import styled from "styled-components"

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #000;
`

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #000;
  color: white;
  text-align: center;
  padding: 24px;
`

export default function PhotoDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [photo, setPhoto] = useState<PexelsPhoto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const photoId = params?.id as string

  const loadPhoto = useCallback(async () => {
    if (!photoId) return

    try {
      setLoading(true)
      setError(null)
      const photoData = await getPhotoById(Number.parseInt(photoId))
      setPhoto(photoData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load photo")
    } finally {
      setLoading(false)
    }
  }, [photoId])

  const handleBack = useCallback(() => {
    router.push("/")
  }, [router])

  useEffect(() => {
    loadPhoto()
  }, [loadPhoto])

  if (loading) {
    return (
      <LoadingContainer>
        <LoadingSpinner />
      </LoadingContainer>
    )
  }

  if (error || !photo) {
    return (
      <ErrorContainer>
        <h2>Failed to load photo</h2>
        <p>{error || "Photo not found"}</p>
        <button
          onClick={handleBack}
          style={{
            marginTop: "24px",
            padding: "12px 24px",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Back to Gallery
        </button>
      </ErrorContainer>
    )
  }

  return (
    <ErrorBoundary>
      <PhotoDetail photo={photo} onBack={handleBack} />
    </ErrorBoundary>
  )
}
