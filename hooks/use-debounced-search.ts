"use client"

import { useState, useEffect, useCallback } from "react"

export function useDebouncedSearch(searchFunction: (query: string) => Promise<void>, delay = 300) {
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, delay)

    return () => clearTimeout(timer)
  }, [searchQuery, delay])

  useEffect(() => {
    if (debouncedQuery !== searchQuery) return

    if (debouncedQuery.trim()) {
      searchFunction(debouncedQuery)
    }
  }, [debouncedQuery, searchFunction, searchQuery])

  const updateSearchQuery = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  return {
    searchQuery,
    updateSearchQuery,
    debouncedQuery,
  }
}
