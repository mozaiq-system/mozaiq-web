"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { getAllTags, filterTagsWithPriority } from "@/lib/storage"

export function useTagAutocomplete(currentTags: string[]) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [allTags, setAllTags] = useState<string[]>([])
  const debounceTimer = useRef<NodeJS.Timeout>()
  const [isLoading, setIsLoading] = useState(false)

  // Load all available tags once on mount
  useEffect(() => {
    const loadTags = async () => {
      const tags = await getAllTags()
      setAllTags(tags)
    }
    loadTags()
  }, [])

  const filterSuggestions = useCallback(
    (query: string) => {
      if (!query.trim()) {
        // Show all tags not already selected
        const filtered = allTags.filter((tag) => !currentTags.some((t) => t.toLowerCase() === tag.toLowerCase()))
        setSuggestions(filtered.slice(0, 10))
        return
      }

      const filtered = filterTagsWithPriority(query, allTags, currentTags)
      setSuggestions(filtered)
    },
    [allTags, currentTags],
  )

  const handleInputChange = useCallback(
    (query: string) => {
      // Clear existing timer
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }

      // Set new timer with 100ms delay
      debounceTimer.current = setTimeout(() => {
        filterSuggestions(query)
        setShowSuggestions(true)
      }, 100)
    },
    [filterSuggestions],
  )

  const openSuggestions = useCallback(() => {
    const filtered = allTags.filter((tag) => !currentTags.some((t) => t.toLowerCase() === tag.toLowerCase()))
    setSuggestions(filtered.slice(0, 10))
    setShowSuggestions(true)
  }, [allTags, currentTags])

  const closeSuggestions = useCallback(() => {
    setShowSuggestions(false)
  }, [])

  return {
    suggestions,
    showSuggestions,
    handleInputChange,
    openSuggestions,
    closeSuggestions,
    allTags,
  }
}
