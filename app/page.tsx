"use client"

import { useState, useEffect } from "react"
import { SavedTags } from "@/components/saved-tags"
import { MediaGrid } from "@/components/media-grid"
import { AddMediaInput } from "@/components/add-media-input"
import { EditMediaModal } from "@/components/edit-media-modal"
import { addMediaItem, loadMediaItems, updateMediaItem, deleteMediaItem } from "@/lib/storage"
import { AppShell } from "@/components/app-shell"
import { RecommendedTags } from "@/components/recommended-tags"
import {
  trackMediaCreated,
  trackMediaUpdated,
  trackMediaTagsUpdated,
  trackMediaMetadataMultiFieldEdit,
  trackUiError,
} from "@/lib/analytics"
import { extractYouTubeId } from "@/lib/youtube-utils"

interface NewMediaData {
  url: string
  title: string
  author_name: string
  videoId: string
}

type MediaModalMode = "add" | "edit"

interface MediaModalState {
  mode: MediaModalMode
  item: any
  metadata: {
    title: string
    author_name: string
  }
  thumbnail: string
  originalItem?: any
}

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [mediaModalState, setMediaModalState] = useState<MediaModalState | null>(null)
  const [savedTagsVersion, setSavedTagsVersion] = useState(0)
  const [mediaLibraryVersion, setMediaLibraryVersion] = useState(0)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const handleSavedTagsSelect = (tags: string[]) => {
    setSelectedTags(tags)
  }

  const handleAddMediaOpen = async (metadata: NewMediaData, thumbnail: string) => {
    const normalizedThumbnail = thumbnail ?? ""
    const openCreateModal = () => {
      setMediaModalState({
        mode: "add",
        item: {
          id: "",
          url: metadata.url,
          tags: [],
          timestamp: Date.now(),
        },
        metadata: {
          title: metadata.title,
          author_name: metadata.author_name,
        },
        thumbnail: normalizedThumbnail,
      })
    }

    try {
      const items = await loadMediaItems()
      const existing = items.find((item) => extractYouTubeId(item.url) === metadata.videoId)
      if (existing) {
        setMediaModalState({
          mode: "edit",
          item: {
            ...existing,
            timestamp: existing.timestamp ?? existing.createdAt ?? Date.now(),
          },
          originalItem: existing,
          metadata: {
            title: existing.title ?? metadata.title,
            author_name: existing.channel ?? metadata.author_name,
          },
          thumbnail: existing.thumbnail ?? normalizedThumbnail,
        })
        return
      }
    } catch (error) {
      console.error(error)
      trackUiError({
        where: "add_media_modal",
        errorCode: "media_lookup_failed",
        messageShort: "Failed to check for existing media",
      })
    }

    openCreateModal()
  }

  const handleRecommendedUpdate = () => {
    setSavedTagsVersion((prev) => prev + 1)
    setMediaLibraryVersion((prev) => prev + 1)
  }

  const closeModal = () => {
    setMediaModalState(null)
  }

  const handleSaveMedia = async (item: any) => {
    if (!mediaModalState) return

    if (mediaModalState.mode === "add") {
      const fallbackTitle = mediaModalState.metadata.title
      const fallbackChannel = mediaModalState.metadata.author_name

      try {
        const created = await addMediaItem({
          url: mediaModalState.item.url,
          tags: item.tags,
          title: item.title ?? fallbackTitle,
          channel: item.channel ?? fallbackChannel,
          thumbnail: mediaModalState.thumbnail,
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

        setMediaModalState(null)
        setSavedTagsVersion((prev) => prev + 1)
        setMediaLibraryVersion((prev) => prev + 1)
      } catch (error) {
        console.error(error)
        trackUiError({
          where: "add_media_modal",
          errorCode: "media_create_failed",
          messageShort: "Failed to create media item",
        })
      }
      return
    }

    const originalItem = mediaModalState.originalItem
    if (!originalItem) return

    const tagsChanged = JSON.stringify(originalItem.tags) !== JSON.stringify(item.tags)
    const titleChanged = (originalItem.title ?? "") !== (item.title ?? "")
    const channelChanged = (originalItem.channel ?? "") !== (item.channel ?? "")
    const fieldsUpdated: string[] = []
    if (titleChanged) fieldsUpdated.push("title")
    if (channelChanged) fieldsUpdated.push("channel")

    try {
      await updateMediaItem(item.id, {
        tags: item.tags,
        title: item.title,
        channel: item.channel,
      })

      trackMediaUpdated({
        mediaId: item.id,
        source: "manual",
        modalName: "edit_media_modal",
        hasTagsChanged: tagsChanged,
        hasMetadataChanged: titleChanged || channelChanged,
      })

      if (tagsChanged) {
        trackMediaTagsUpdated({
          mediaId: item.id,
          previousTags: originalItem.tags,
          nextTags: item.tags,
          editMode: "update",
        })
      }

      trackMediaMetadataMultiFieldEdit({
        mediaId: item.id,
        fieldsUpdated,
      })

      setMediaModalState(null)
      if (tagsChanged) {
        setSavedTagsVersion((prev) => prev + 1)
      }
      setMediaLibraryVersion((prev) => prev + 1)
    } catch (error) {
      console.error(error)
      trackUiError({
        where: "add_media_modal",
        errorCode: "media_update_failed",
        messageShort: "Failed to update media item",
      })
    }
  }

  const handleDeleteMedia = async (itemId: string) => {
    if (!mediaModalState) return
    try {
      await deleteMediaItem(itemId)
      setMediaModalState(null)
      setSavedTagsVersion((prev) => prev + 1)
      setMediaLibraryVersion((prev) => prev + 1)
    } catch (error) {
      console.error(error)
      trackUiError({
        where: "add_media_modal",
        errorCode: "media_delete_failed",
        messageShort: "Failed to delete media item",
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
            <MediaGrid key={mediaLibraryVersion} selectedTags={selectedTags} />
          </div>
        </div>
      </div>

      {mediaModalState && (
        <EditMediaModal
          isOpen={true}
          item={mediaModalState.item}
          metadata={mediaModalState.metadata}
          thumbnail={mediaModalState.thumbnail}
          onClose={closeModal}
          onSave={handleSaveMedia}
          onDelete={mediaModalState.mode === "edit" ? handleDeleteMedia : () => {}}
          isAddMode={mediaModalState.mode === "add"}
        />
      )}
    </AppShell>
  )
}
