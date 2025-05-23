import type { PexelsResponse, PexelsPhoto } from "@/types/photo"

const PEXELS_API_KEY = process.env.NEXT_PUBLIC_PEXELS_API_KEY
const BASE_URL = "https://api.pexels.com/v1"

if (!PEXELS_API_KEY) {
  throw new Error("NEXT_PUBLIC_PEXELS_API_KEY is not defined")
}

const headers = {
  Authorization: PEXELS_API_KEY,
  "Content-Type": "application/json",
}

export async function fetchCuratedPhotos(page = 1, perPage = 40, signal?: AbortSignal): Promise<PexelsResponse> {
  try {
    const response = await fetch(`${BASE_URL}/curated?page=${page}&per_page=${perPage}`, {
      headers,
      signal,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching curated photos:", error)
    throw error
  }
}

export async function searchPhotos(
  query: string,
  page = 1,
  perPage = 40,
  signal?: AbortSignal,
): Promise<PexelsResponse> {
  try {
    const encodedQuery = encodeURIComponent(query)
    const response = await fetch(`${BASE_URL}/search?query=${encodedQuery}&page=${page}&per_page=${perPage}`, {
      headers,
      signal,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error searching photos:", error)
    throw error
  }
}

export async function getPhotoById(id: number, signal?: AbortSignal): Promise<PexelsPhoto> {
  try {
    const response = await fetch(`${BASE_URL}/photos/${id}`, {
      headers,
      signal,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching photo by ID:", error)
    throw error
  }
}
