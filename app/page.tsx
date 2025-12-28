"use client"

import { useState, useEffect } from "react"
import { SavedTags } from "@/components/saved-tags"
import { MediaGrid } from "@/components/media-grid"
import { AddMediaInput } from "@/components/add-media-input"
import { EditMediaModal } from "@/components/edit-media-modal"
import { addMediaItem } from "@/lib/storage"
import { AppShell } from "@/components/app-shell"
import { RecommendedTags } from "@/components/recommended-tags"

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
  const [savedTagsVersion, setSavedTagsVersion] = useState(0)

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

  const handleRecommendedUpdate = () => {
    setSavedTagsVersion((prev) => prev + 1)
  }

  const handleSaveNewMedia = async (item: any) => {
    const fallbackTitle = newMediaData!.title
    const fallbackChannel = newMediaData!.author_name
    await addMediaItem({
      url: newMediaData!.url,
      tags: item.tags,
      title: item.title ?? fallbackTitle,
      channel: item.channel ?? fallbackChannel,
      thumbnail: newMediaThumbnail,
    })
    setShowAddModal(false)
    setNewMediaData(null)
    setNewMediaThumbnail("")
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-6 sm:gap-8">
        <RecommendedTags onLibraryUpdate={handleRecommendedUpdate} />

        <section className="px-2 sm:px-3 lg:px-4">
          <div className="mx-auto w-full max-w-3xl">
            <AddMediaInput onModalOpen={handleAddMediaOpen} />
          </div>
        </section>

        <div className="px-2 sm:px-3 lg:px-4">
          <div className="max-w-7xl mx-auto w-full">
            <div className="flex flex-wrap gap-2 justify-start items-center">
              <SavedTags onTagsSelect={handleSavedTagsSelect} refreshToken={savedTagsVersion.toString()} />
            </div>
          </div>
        </div>

        <div className="flex-1 px-2 sm:px-3 lg:px-4 pb-8">
          <div className="max-w-7xl mx-auto w-full">
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
