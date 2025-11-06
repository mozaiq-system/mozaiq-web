"use client"

import { useState, useEffect } from "react"
import { SavedTags } from "@/components/saved-tags"
import { MediaGrid } from "@/components/media-grid"
import { AddMediaInput } from "@/components/add-media-input"
import { EditMediaModal } from "@/components/edit-media-modal"
import { addMediaItem } from "@/lib/storage"
import { AppShell } from "@/components/app-shell"

interface NewMediaData {
  url: string
  title: string
  author_name: string
}

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [newMediaData, setNewMediaData] = useState<NewMediaData | null>(null)
  const [newMediaThumbnail, setNewMediaThumbnail] = useState("")

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const handleSavedTagsSelect = (tags: string[]) => {
    setSelectedTags(tags)
  }

  const handleAddMediaOpen = (metadata: NewMediaData, thumbnail: string) => {
    setNewMediaData(metadata)
    setNewMediaThumbnail(thumbnail)
    setShowAddModal(true)
  }

  const handleSaveNewMedia = async (item: any) => {
    await addMediaItem({
      url: newMediaData!.url,
      tags: item.tags,
      title: newMediaData!.title,
      channel: newMediaData!.author_name,
      thumbnail: newMediaThumbnail,
    })
    setShowAddModal(false)
    setNewMediaData(null)
    setNewMediaThumbnail("")
  }

  return (
    <AppShell>
      <div className="flex flex-col">
        <section className="hero-section flex flex-col items-center justify-center px-2 sm:px-3 lg:px-4">
          <div className="text-center max-w-2xl animate-fade-in">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-balance text-foreground">Tag your vibe.</h2>
            <p className="text-text-secondary text-lg text-pretty">Build playlists that match your mood and moments.</p>
          </div>

          <div className="w-full max-w-2xl mt-8">
            <AddMediaInput onModalOpen={handleAddMediaOpen} />
          </div>
        </section>

        <div className="px-2 sm:px-3 lg:px-4 mb-4 sm:mb-4">
          <div className="max-w-6xl mx-auto w-full">
            <div className="flex flex-wrap gap-2 justify-start items-center">
              <SavedTags onTagsSelect={handleSavedTagsSelect} />
            </div>
          </div>
        </div>

        <div className="flex-1 px-2 sm:px-3 lg:px-4 pb-8">
          <div className="max-w-6xl mx-auto w-full">
            <MediaGrid selectedTags={selectedTags} />
          </div>
        </div>
      </div>

      {newMediaData && (
        <EditMediaModal
          isOpen={showAddModal}
          item={{
            id: "",
            url: newMediaData.url,
            tags: [],
            timestamp: Date.now(),
          }}
          metadata={{
            title: newMediaData.title,
            author_name: newMediaData.author_name,
          }}
          thumbnail={newMediaThumbnail}
          onClose={() => {
            setShowAddModal(false)
            setNewMediaData(null)
            setNewMediaThumbnail("")
          }}
          onSave={handleSaveNewMedia}
          onDelete={() => {}}
          isAddMode={true}
        />
      )}
    </AppShell>
  )
}
