"use client"

import type React from "react"

import { useState } from "react"
import { extractYouTubeId, fetchYouTubeMetadata } from "@/lib/youtube-utils"

interface AddMediaInputProps {
  onModalOpen: (metadata: any, thumbnail: string) => void
}

function showToast(message: string) {
  const event = new CustomEvent("showToast", { detail: { message } })
  window.dispatchEvent(event)
}

export function AddMediaInput({ onModalOpen }: AddMediaInputProps) {
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return

    const url = input.trim()
    if (!url) {
      showToast("Please enter a YouTube URL")
      return
    }

    if (!extractYouTubeId(url)) {
      showToast("Please enter a valid YouTube URL")
      return
    }

    setIsLoading(true)

    try {
      const metadata = await fetchYouTubeMetadata(url)
      if (!metadata) {
        showToast("Could not fetch video details. Please try again.")
        setIsLoading(false)
        return
      }

      onModalOpen(
        {
          url,
          title: metadata.title,
          author_name: metadata.author_name,
        },
        metadata.thumbnail_url,
      )

      setInput("")
    } catch {
      showToast("Error fetching video details")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Paste a YouTube link to add"
        disabled={isLoading}
        className="input-field w-full"
      />
    </div>
  )
}
