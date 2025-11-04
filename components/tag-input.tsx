"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { X } from "lucide-react"
import { useTagAutocomplete } from "@/hooks/use-tag-autocomplete"

interface TagInputProps {
  tags: string[]
  onTagsChange: (tags: string[]) => void
  onGeneratePlaylist: () => void
  hideGenerateButton?: boolean
}

export function TagInput({ tags, onTagsChange, onGeneratePlaylist, hideGenerateButton }: TagInputProps) {
  const [input, setInput] = useState("")
  const { suggestions, showSuggestions, handleInputChange, openSuggestions, closeSuggestions } =
    useTagAutocomplete(tags)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    handleInputChange(input)
  }, [input, handleInputChange])

  const addTag = (tag: string) => {
    if (!tags.includes(tag)) {
      onTagsChange([...tags, tag])
      setInput("")
      closeSuggestions()
    }
  }

  const removeTag = (tag: string) => {
    onTagsChange(tags.filter((t) => t !== tag))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && input.trim()) {
      e.preventDefault()
      addTag(input.trim())
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  return (
    <div className="w-full space-y-4">
      <div className="surface-card rounded-xl p-3">
        <div className="flex flex-wrap gap-2 mb-3">
          {tags.map((tag) => (
            <div key={tag} className="tag-chip tag-chip-active">
              <span className="text-sm font-medium">{tag}</span>
              <button
                onClick={() => removeTag(tag)}
                className="hover:opacity-70 transition-opacity"
                aria-label={`Remove ${tag}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={openSuggestions}
            placeholder={tags.length === 0 ? "Add tags to create a playlist..." : "Add another tag..."}
            className="input-field"
          />

          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute top-full left-0 right-0 mt-2 rounded-lg border border-border bg-background shadow-lg z-10"
            >
              <div className="p-2 space-y-1 max-h-48 overflow-y-auto tag-suggestions-list">
                {suggestions.map((suggestion) => (
                  <button key={suggestion} onClick={() => addTag(suggestion)} className="tag-suggestion-item">
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showSuggestions && input.trim() && suggestions.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 rounded-lg border border-border bg-background shadow-lg z-10 p-3">
              <div className="text-sm text-text-secondary text-center">Create "{input.trim()}"</div>
            </div>
          )}
        </div>
      </div>

      {tags.length > 0 && !hideGenerateButton && (
        <button
          onClick={onGeneratePlaylist}
          className="w-full py-2.5 rounded-lg font-semibold transition-all duration-200 text-white"
          style={{
            backgroundColor: "var(--accent)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--accent-light)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--accent)"
          }}
        >
          Generate Playlist
        </button>
      )}
    </div>
  )
}
