"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { loadMediaItems, saveMediaItems } from "@/lib/storage"
import { EditMediaModal } from "./edit-media-modal"

interface MediaItem {
  id: string
  url: string
  tags: string[]
  timestamp: number
}

interface VideoMetadata {
  title: string
  author_name: string
}

interface MediaGridProps {
  selectedTags: string[]
}

function extractYouTubeId(url: string): string | null {
  try {
    const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    const match = url.match(youtubeRegex)
    return match ? match[1] : null
  } catch {
    return null
  }
}

// Get YouTube thumbnail URL
function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
}

function MediaCard({ item, index, onEdit }: { item: MediaItem; index: number; onEdit: (item: MediaItem) => void }) {
  const videoId = extractYouTubeId(item.url)
  const thumbnail = videoId ? getYouTubeThumbnail(videoId) : "/placeholder.svg"
  const displayTitle = item.title || "Untitled Video"
  const displayChannel = item.channel || "Unknown Channel"

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ delay: index * 0.05, duration: 0.25, ease: "easeInOut" }}
    >
      <div className="relative group">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex gap-4 p-4 rounded-xl border border-border hover:border-accent transition-colors duration-300 ease-in-out"
        >
          <div className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden">
            <img
              src={thumbnail || "/placeholder.svg"}
              alt="YouTube thumbnail"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>

          <div className="flex-1 flex flex-col justify-between">
            <div>
              <h3 className="font-semibold text-base line-clamp-2">{displayTitle}</h3>
              <p className="text-sm text-text-secondary mt-1 line-clamp-1">{displayChannel}</p>
            </div>

            <div className="flex flex-wrap gap-1">
              {item.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-xs px-2 py-0.5 rounded-full tag-chip-active">
                  {tag}
                </span>
              ))}
              {item.tags.length > 3 && (
                <span className="text-xs px-2 py-0.5 rounded-full tag-chip-active">+{item.tags.length - 3}</span>
              )}
            </div>
          </div>
        </a>

        <button
          onClick={(e) => {
            e.stopPropagation()
            onEdit(item)
          }}
          className="absolute top-2 right-2 p-1.5 rounded-lg hover:bg-surface transition-all duration-200 opacity-100 md:opacity-0 md:group-hover:opacity-100 z-20 pointer-events-auto hover:opacity-80"
          aria-label="Edit media"
        >
          <svg className="w-5 h-5 text-text-secondary" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="5" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="12" cy="19" r="2" />
          </svg>
        </button>
      </div>
    </motion.div>
  )
}

function buildYouTubePlaylistUrl(items: MediaItem[]): string | null {
  const videoIds: string[] = []

  for (const item of items) {
    const videoId = extractYouTubeId(item.url)
    if (videoId) {
      videoIds.push(videoId)
      // Cap at 50 IDs to avoid excessive URL length
      if (videoIds.length >= 50) {
        break
      }
    }
  }

  if (videoIds.length === 0) return null

  return `https://www.youtube.com/watch_videos?video_ids=${videoIds.join(",")}`
}

function CreatePlaylistButton({ filteredItems }: { filteredItems: MediaItem[] }) {
  const [isLoading, setIsLoading] = useState(false)

  const handleCreatePlaylist = async () => {
    const playlistUrl = buildYouTubePlaylistUrl(filteredItems)

    if (!playlistUrl) {
      return
    }

    setIsLoading(true)
    // Open the playlist in a new tab
    window.open(playlistUrl, "_blank", "noopener,noreferrer")
    setIsLoading(false)
  }

  const hasValidVideos = filteredItems.some((item) => extractYouTubeId(item.url))

  return (
    <button
      onClick={handleCreatePlaylist}
      disabled={!hasValidVideos || isLoading}
      className="create-playlist-btn"
      aria-label="Create YouTube Playlist from current results"
      title="Opens an anonymous YouTube playlist in a new tab"
    >
      {isLoading ? (
        <>
          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.25" />
            <path
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Creating...</span>
        </>
      ) : (
        <>
          <span>Create YouTube Playlist</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </>
      )}
    </button>
  )
}

export function MediaGrid({ selectedTags }: MediaGridProps) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [mounted, setMounted] = useState(false)
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null)
  const [editingMetadata, setEditingMetadata] = useState<VideoMetadata | null>(null)

  useEffect(() => {
    setMounted(true)
    loadMediaItems().then((mediaItems) => {
      setItems(mediaItems as any)
    })
  }, [])

  const handleEditItem = (item: MediaItem) => {
    setEditingItem(item)
    setEditingMetadata({
      title: item.title || "Untitled Video",
      author_name: item.channel || "Unknown Channel",
    })
  }

  const handleSaveEditedItem = (updatedItem: MediaItem) => {
    const updatedItems = items.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    saveMediaItems(updatedItems as any).then(() => {
      setItems(updatedItems)
      setEditingItem(null)
    })
  }

  const handleDeleteItem = (itemId: string) => {
    const updatedItems = items.filter((item) => item.id !== itemId)
    saveMediaItems(updatedItems as any).then(() => {
      setItems(updatedItems)
    })
  }

  if (!mounted) return null

  const filteredItems =
    selectedTags.length > 0 ? items.filter((item) => selectedTags.every((tag) => item.tags.includes(tag))) : items

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-24 h-24 rounded-full bg-surface flex items-center justify-center mb-4">
          <svg className="w-12 h-12 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
            />
          </svg>
        </div>
        <p className="text-text-secondary text-center max-w-md">No tracks saved yet.</p>
      </div>
    )
  }

  if (filteredItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-text-secondary text-center">
          No tracks found with {selectedTags.length === 1 ? "this tag" : "all selected tags"}.
        </p>
      </div>
    )
  }

  const editingVideoId = editingItem ? extractYouTubeId(editingItem.url) : null
  const editingThumbnail = editingVideoId ? getYouTubeThumbnail(editingVideoId) : "/placeholder.svg"

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Matched Tracks</h2>
            <p className="text-sm text-text-secondary">
              {filteredItems.length} track{filteredItems.length !== 1 ? "s" : ""}
            </p>
          </div>
          <CreatePlaylistButton filteredItems={filteredItems} />
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, index) => (
              <MediaCard key={item.id} item={item} index={index} onEdit={handleEditItem} />
            ))}
          </AnimatePresence>
        </div>
      </div>

      <EditMediaModal
        isOpen={editingItem !== null}
        item={editingItem}
        metadata={editingMetadata}
        thumbnail={editingThumbnail}
        onClose={() => setEditingItem(null)}
        onSave={handleSaveEditedItem}
        onDelete={handleDeleteItem}
      />
    </>
  )
}
