"use client"

import { useState, useEffect } from "react"
import { SavedTags } from "@/components/saved-tags"
import { MediaGrid } from "@/components/media-grid"
import { AddMediaInput } from "@/components/add-media-input"
import { EditMediaModal } from "@/components/edit-media-modal"
import { addMediaItem } from "@/lib/storage"
import { AppShell } from "@/components/app-shell"
import { RecommendedTags } from "@/components/recommended-tags"
import {
  trackMediaCreated,
  trackMediaTagsUpdated,
  trackMediaMetadataMultiFieldEdit,
  trackUiError,
} from "@/lib/analytics"

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
    if (!newMediaData) return
    const fallbackTitle = newMediaData.title
    const fallbackChannel = newMediaData.author_name

    try {
      const created = await addMediaItem({
        url: newMediaData.url,
        tags: item.tags,
        title: item.title ?? fallbackTitle,
        channel: item.channel ?? fallbackChannel,
        thumbnail: newMediaThumbnail,
      })

      const normalizedTitle = (item.title ?? "").trim()
      const normalizedChannel = (item.channel ?? "").trim()
      const titleChanged = Boolean(normalizedTitle) && normalizedTitle !== fallbackTitle.trim()
      const channelChanged = Boolean(normalizedChannel) && normalizedChannel !== fallbackChannel.trim()
      const hasMetadataChanged = titleChanged || channelChanged
      const fieldsUpdated: string[] = []
      if (titleChanged) fieldsUpdated.push("title")
      if (channelChanged) fieldsUpdated.push("channel")

      trackMediaCreated({
        mediaId: created.id,
        source: "manual",
        modalName: "edit_media_modal",
        hasTagsChanged: created.tags.length > 0,
        hasMetadataChanged,
      })

      trackMediaTagsUpdated({
        mediaId: created.id,
        previousTags: [],
        nextTags: created.tags,
        editMode: "create",
      })

      trackMediaMetadataMultiFieldEdit({
        mediaId: created.id,
        fieldsUpdated,
      })

      setShowAddModal(false)
      setNewMediaData(null)
      setNewMediaThumbnail("")
    } catch (error) {
      console.error(error)
      trackUiError({
        where: "add_media_modal",
        errorCode: "media_create_failed",
        messageShort: "Failed to create media item",
      })
    }
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
