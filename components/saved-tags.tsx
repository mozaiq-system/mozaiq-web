"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { loadMediaItems } from "@/lib/storage"
import { cn } from "@/lib/utils"
import { TagFilterSelection } from "@/lib/tag-filters"

interface MediaItem {
  id: string
  url: string
  tags: string[]
  timestamp: number
}

interface SavedTagsProps {
  onTagsSelect: (selection: TagFilterSelection) => void
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
  const [tagStates, setTagStates] = useState<Record<string, "include" | "exclude">>({})
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
    const nextState = tagStates[tag] === "include" ? "exclude" : tagStates[tag] === "exclude" ? undefined : "include"
    const updatedStates = { ...tagStates }

    if (!nextState) {
      delete updatedStates[tag]
    } else {
      updatedStates[tag] = nextState
    }

    setTagStates(updatedStates)

    const include = Object.entries(updatedStates)
      .filter(([, state]) => state === "include")
      .map(([tagName]) => tagName)
    const exclude = Object.entries(updatedStates)
      .filter(([, state]) => state === "exclude")
      .map(([tagName]) => tagName)

    onTagsSelect({ include, exclude })
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
          className={cn("tag-chip", {
            "tag-chip-selected": tagStates[tag] === "include",
            "tag-chip-excluded": tagStates[tag] === "exclude",
          })}
        >
          {tag}
        </motion.button>
      ))}
    </div>
  )
}
