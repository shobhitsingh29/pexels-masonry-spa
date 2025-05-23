"use client"

import type React from "react"
import { useState, useCallback } from "react"
import styled from "styled-components"
import { ArrowLeft, Download, ExternalLink } from "lucide-react"
import type { PexelsPhoto } from "@/types/photo"

const DetailContainer = styled.div`
  min-height: 100vh;
  background-color: #000;
  color: white;
  position: relative;
`

const Header = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 6px;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
`

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 6px;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
`

const Content = styled.main`
  padding-top: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;

  @media (min-width: 1024px) {
    flex-direction: row;
    align-items: flex-start;
    padding: 80px 24px 24px;
    gap: 48px;
  }
`

const ImageContainer = styled.div`
  flex: 1;
  max-width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px;

  @media (min-width: 1024px) {
    max-width: 70%;
  }
`

const Image = styled.img`
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 8px;
`

const InfoPanel = styled.aside`
  flex: 1;
  max-width: 100%;
  padding: 24px;

  @media (min-width: 1024px) {
    max-width: 30%;
    min-width: 300px;
  }
`

const PhotoTitle = styled.h1`
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 16px;
  line-height: 1.3;
`

const InfoSection = styled.div`
  margin-bottom: 24px;
`

const InfoLabel = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
`

const InfoValue = styled.div`
  font-size: 16px;
  line-height: 1.5;
  margin-bottom: 8px;
`

const PhotographerLink = styled.a`
  color: #60a5fa;
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`

const Dimensions = styled.div`
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: #d1d5db;
`

interface PhotoDetailProps {
  photo: PexelsPhoto
  onBack: () => void
}

export const PhotoDetail: React.FC<PhotoDetailProps> = ({ photo, onBack }) => {
  const [imageLoaded, setImageLoaded] = useState(false)

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true)
  }, [])

  const handleDownload = useCallback(() => {
    const link = document.createElement("a")
    link.href = photo.src.large
    link.download = `pexels-${photo.id}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [photo])

  const handleOpenOriginal = useCallback(() => {
    window.open(photo.url, "_blank")
  }, [photo])

  return (
    <DetailContainer>
      <Header>
        <BackButton onClick={onBack}>
          <ArrowLeft size={20} />
          Back to Grid
        </BackButton>
        <ActionButtons>
          <ActionButton onClick={handleDownload}>
            <Download size={16} />
            Download
          </ActionButton>
          <ActionButton onClick={handleOpenOriginal}>
            <ExternalLink size={16} />
            View on Pexels
          </ActionButton>
        </ActionButtons>
      </Header>

      <Content>
        <ImageContainer>
          <Image
            src={photo.src.large || "/placeholder.svg"}
            alt={photo.alt || `Photo by ${photo.photographer}`}
            onLoad={handleImageLoad}
          />
        </ImageContainer>

        <InfoPanel>
          <PhotoTitle>{photo.alt || "Untitled Photo"}</PhotoTitle>

          <InfoSection>
            <InfoLabel>Photographer</InfoLabel>
            <InfoValue>
              <PhotographerLink href={photo.photographer_url} target="_blank" rel="noopener noreferrer">
                {photo.photographer}
              </PhotographerLink>
            </InfoValue>
          </InfoSection>

          <InfoSection>
            <InfoLabel>Dimensions</InfoLabel>
            <Dimensions>
              <span>
                {photo.width} × {photo.height}
              </span>
              <span>•</span>
              <span>{((photo.width * photo.height) / 1000000).toFixed(1)}MP</span>
            </Dimensions>
          </InfoSection>

          <InfoSection>
            <InfoLabel>Average Color</InfoLabel>
            <InfoValue>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    backgroundColor: photo.avg_color,
                    borderRadius: "4px",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                  }}
                />
                {photo.avg_color}
              </div>
            </InfoValue>
          </InfoSection>

          <InfoSection>
            <InfoLabel>Photo ID</InfoLabel>
            <InfoValue>{photo.id}</InfoValue>
          </InfoSection>
        </InfoPanel>
      </Content>
    </DetailContainer>
  )
}
