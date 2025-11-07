"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { loadMediaItems } from "@/lib/storage"

interface MediaItem {
  id: string
  url: string
  tags: string[]
  timestamp: number
}

interface SavedTagsProps {
  onTagsSelect: (tags: string[]) => void
  refreshToken?: string
}

function extractUniqueTags(items: MediaItem[]): string[] {
  const tags = new Set<string>()
  items.forEach((item) => {
    item.tags.forEach((tag) => tags.add(tag))
  })
  return Array.from(tags).sort()
}

export function SavedTags({ onTagsSelect, refreshToken }: SavedTagsProps) {
  const [tags, setTags] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    loadMediaItems().then((items) => {
      const uniqueTags = extractUniqueTags(items as any)
      setTags(uniqueTags)
    })
  }, [refreshToken])

  if (!mounted || tags.length === 0) return null

  const handleTagClick = (tag: string) => {
    const newSelectedTags = selectedTags.includes(tag) ? selectedTags.filter((t) => t !== tag) : [...selectedTags, tag]
    setSelectedTags(newSelectedTags)
    onTagsSelect(newSelectedTags)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag, index) => (
        <motion.button
          key={tag}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05, duration: 0.2 }}
          onClick={() => handleTagClick(tag)}
          className={`tag-chip ${selectedTags.includes(tag) ? "tag-chip-selected" : ""}`}
        >
          {tag}
        </motion.button>
      ))}
    </div>
  )
}
