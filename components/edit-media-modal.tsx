"use client"

import type React from "react"

import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTagAutocomplete } from "@/hooks/use-tag-autocomplete"
import { cn } from "@/lib/utils"

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

interface EditMediaModalProps {
  isOpen: boolean
  item: MediaItem | null
  metadata: VideoMetadata | null
  thumbnail: string
  onClose: () => void
  onSave: (updatedItem: MediaItem) => void
  onDelete: (itemId: string) => void
  isAddMode?: boolean
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

function showToast(message: string) {
  const event = new CustomEvent("showToast", { detail: { message } })
  window.dispatchEvent(event)
}

export function EditMediaModal({
  isOpen,
  item,
  metadata,
  thumbnail,
  onClose,
  onSave,
  onDelete,
  isAddMode,
}: EditMediaModalProps) {
  const [editedTags, setEditedTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isComposing, setIsComposing] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const inputContainerRef = useRef<HTMLDivElement>(null)
  const modalContentRef = useRef<HTMLDivElement>(null)
  const { suggestions, showSuggestions, handleInputChange, openSuggestions, closeSuggestions } =
    useTagAutocomplete(editedTags)

  useEffect(() => {
    if (item) {
      setEditedTags(item.tags)
      setTagInput("")
    }
  }, [item, isOpen])

  useEffect(() => {
    handleInputChange(tagInput)
  }, [tagInput, handleInputChange])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputContainerRef.current && !inputContainerRef.current.contains(event.target as Node)) {
        closeSuggestions()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [closeSuggestions])

  useEffect(() => {
    if (!showSuggestions || suggestions.length === 0) {
      setHighlightedIndex(-1)
      return
    }
    setHighlightedIndex(0)
  }, [showSuggestions, suggestions])

  useEffect(() => {
    if (!isOpen) return

    const handleModalClickOutside = (event: MouseEvent) => {
      if (showDeleteConfirm) return
      if (modalContentRef.current && !modalContentRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (showDeleteConfirm) return
      if (event.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleModalClickOutside)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handleModalClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, onClose, showDeleteConfirm])

  if (!isOpen || !item) return null

  const handleAddTag = (tag: string) => {
    const trimmedTag = tag.trim()

    if (!trimmedTag) return

    // Truncate to 24 chars and add ellipsis if needed
    const finalTag = trimmedTag.length > 24 ? trimmedTag.substring(0, 24) + "…" : trimmedTag

    let duplicate = false
    setEditedTags((previous) => {
      const isDuplicate = previous.some((t) => t.toLowerCase() === finalTag.toLowerCase())
      if (isDuplicate) {
        showToast("Tag already exists")
        duplicate = true
        return previous
      }
      return [...previous, finalTag]
    })

    if (duplicate) {
      return
    }

    setTagInput("")
    setHighlightedIndex(-1)
    closeSuggestions()
  }

  const handleRemoveTag = (tag: string) => {
    setEditedTags(editedTags.filter((t) => t !== tag))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isComposing) return

    if (e.key === "ArrowDown") {
      if (!showSuggestions) {
        openSuggestions()
      }
      e.preventDefault()
      if (suggestions.length > 0) {
        setHighlightedIndex((prev) => {
          if (prev === -1) return 0
          const next = prev + 1
          return next >= suggestions.length ? 0 : next
        })
      }
      return
    }

    if (e.key === "ArrowUp" && showSuggestions && suggestions.length > 0) {
      e.preventDefault()
      setHighlightedIndex((prev) => {
        if (prev <= 0) return suggestions.length - 1
        return prev - 1
      })
      return
    }

    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      if (showSuggestions && highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        handleAddTag(suggestions[highlightedIndex])
      } else {
        handleAddTag(tagInput)
      }
    }

    if (e.key === "Backspace" && tagInput === "") {
      return
    }
  }

  const handleBlur = () => {
    if (tagInput.trim()) {
      handleAddTag(tagInput)
    }
    closeSuggestions()
  }

  const handleSave = () => {
    const updatedItem = { ...item, tags: editedTags }
    onSave(updatedItem)
    onClose()
    showToast(isAddMode ? "Track saved locally!" : "Changes saved locally!")
  }

  const handleDeleteConfirm = () => {
    onDelete(item.id)
    setShowDeleteConfirm(false)
    onClose()
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-40"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
      >
        <div
          ref={modalContentRef}
          className="bg-background rounded-xl border border-border shadow-xl w-full max-w-lg sm:max-w-xl lg:max-w-[600px] max-h-[96vh] sm:max-h-[94vh] lg:max-h-[92vh] overflow-y-auto p-4 sm:p-6"
        >
          <div className="mb-6">
            <div className="w-full aspect-video rounded-lg overflow-hidden mb-4">
              <img src={thumbnail || "/placeholder.svg"} alt="Video thumbnail" className="w-full h-full object-cover" />
            </div>
            {metadata && (
              <div>
                <h3 className="font-semibold text-lg line-clamp-2">{metadata.title}</h3>
                <p className="text-sm text-text-secondary mt-1">{metadata.author_name}</p>
              </div>
            )}
          </div>

          <div className="mb-6">
            <h4 className="font-semibold text-base mb-3">Tags</h4>

            <div className="flex flex-wrap gap-1.5 mb-4">
              <AnimatePresence mode="popLayout">
                {editedTags.map((tag) => (
                  <motion.div
                    key={tag}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15, ease: "easeInOut" }}
                    className="modal-tag-chip"
                  >
                    <span className="text-sm font-medium">{tag}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveTag(tag)
                      }}
                      className="modal-tag-chip-remove"
                      aria-label={`Remove tag ${tag}`}
                    >
                      ×
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div ref={inputContainerRef} className="relative">
              <input
                ref={inputRef}
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                onFocus={openSuggestions}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
                placeholder="Add a tag…"
                className="input-field w-full mb-2"
              />

              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto tag-suggestions-list">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={suggestion}
                      onMouseDown={(event) => event.preventDefault()}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      onClick={() => handleAddTag(suggestion)}
                      className={cn(
                        "tag-suggestion-item",
                        highlightedIndex === index && "bg-accent/10 text-foreground",
                      )}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              {showSuggestions && tagInput.trim() && suggestions.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-10 p-3">
                  <button
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleAddTag(tagInput)}
                    className="w-full text-left text-sm text-text-secondary hover:text-foreground transition-colors"
                  >
                    Create "{tagInput.trim()}"
                  </button>
                </div>
              )}
            </div>

          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-surface transition-colors duration-200"
            >
              Cancel
            </button>
            {!isAddMode && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors duration-200"
              >
                Delete Video
              </button>
            )}
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg bg-accent text-white hover:bg-accent-light transition-colors duration-200"
            >
              {isAddMode ? "Save to Library" : "Save Changes"}
            </button>
          </div>
        </div>
      </motion.div>

      {showDeleteConfirm && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDeleteConfirm(false)}
            className="fixed inset-0 bg-black/50 z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
          >
            <div className="bg-background rounded-xl border border-border shadow-xl max-w-sm w-full p-6">
              <h3 className="font-semibold text-lg mb-2">Delete Video?</h3>
              <p className="text-text-secondary text-sm mb-6">
                Are you sure you want to delete this video? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-surface transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors duration-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </>
  )
}
