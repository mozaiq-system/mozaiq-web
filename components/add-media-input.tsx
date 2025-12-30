"use client"

import type React from "react"

import { useState } from "react"
import { extractYouTubeId, fetchYouTubeMetadata } from "@/lib/youtube-utils"
import { useToast } from "@/hooks/use-toast"

interface AddMediaInputProps {
  onModalOpen: (
    metadata: {
      url: string
      title: string
      author_name: string
      videoId: string
    },
    thumbnail: string,
  ) => Promise<void> | void
}

export function AddMediaInput({ onModalOpen }: AddMediaInputProps) {
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const notify = (message: string) => {
    toast({ description: message })
  }

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return

    const url = input.trim()
    if (!url) {
      notify("Please enter a YouTube URL")
      return
    }

    const videoId = extractYouTubeId(url)
    if (!videoId) {
      notify("Please enter a valid YouTube URL")
      return
    }

    setIsLoading(true)

    try {
      const metadata = await fetchYouTubeMetadata(url)
      if (!metadata) {
        notify("Could not fetch video details. Please try again.")
        setIsLoading(false)
        return
      }

      await onModalOpen(
        {
          url,
          title: metadata.title,
          author_name: metadata.author_name,
          videoId,
        },
        metadata.thumbnail_url,
      )

      setInput("")
    } catch {
      notify("Error fetching video details")
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
