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
import { TagFilterSelection, createEmptyTagFilterSelection } from "@/lib/tag-filters"

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

function useMediaWorkspace() {
  const [tagFilters, setTagFilters] = useState<TagFilterSelection>(() => createEmptyTagFilterSelection())
  const [mediaModalState, setMediaModalState] = useState<MediaModalState | null>(null)
  const [savedTagsVersion, setSavedTagsVersion] = useState(0)
  const [mediaLibraryVersion, setMediaLibraryVersion] = useState(0)

  const handleSavedTagsSelect = (selection: TagFilterSelection) => {
    setTagFilters(selection)
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

        const mediaId = extractYouTubeId(created.url) ?? created.id

        trackMediaCreated({
          mediaId,
          source: "manual",
          modalName: "edit_media_modal",
          hasTagsChanged: created.tags.length > 0,
          hasMetadataChanged,
        })

        trackMediaTagsUpdated({
          mediaId,
          previousTags: [],
          nextTags: created.tags,
          editMode: "create",
        })

        trackMediaMetadataMultiFieldEdit({
          mediaId,
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

      const mediaId = extractYouTubeId(originalItem.url) ?? originalItem.id

      trackMediaUpdated({
        mediaId,
        source: "manual",
        modalName: "edit_media_modal",
        hasTagsChanged: tagsChanged,
        hasMetadataChanged: titleChanged || channelChanged,
      })

      if (tagsChanged) {
        trackMediaTagsUpdated({
          mediaId,
          previousTags: originalItem.tags,
          nextTags: item.tags,
          editMode: "update",
        })
      }

      trackMediaMetadataMultiFieldEdit({
        mediaId,
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

  return {
    tagFilters,
    savedTagsRefreshKey: savedTagsVersion.toString(),
    mediaLibraryVersion,
    mediaModalState,
    handleAddMediaOpen,
    handleSavedTagsSelect,
    handleRecommendedUpdate,
    closeModal,
    handleSaveMedia,
    handleDeleteMedia,
  }
}

interface MediaWorkspaceProps {
  tagFilters: TagFilterSelection
  savedTagsRefreshKey: string
  mediaLibraryVersion: number
  onSavedTagsSelect: (selection: TagFilterSelection) => void
  onAddMedia: (metadata: NewMediaData, thumbnail: string) => Promise<void> | void
  modalState: MediaModalState | null
  onCloseModal: () => void
  onSaveMedia: (item: any) => Promise<void> | void
  onDeleteMedia: (itemId: string) => Promise<void> | void
}

function MediaWorkspace({
  tagFilters,
  savedTagsRefreshKey,
  mediaLibraryVersion,
  onSavedTagsSelect,
  onAddMedia,
  modalState,
  onCloseModal,
  onSaveMedia,
  onDeleteMedia,
}: MediaWorkspaceProps) {
  const isEditMode = modalState?.mode === "edit"
  const handleModalSave = (updatedItem: any) => {
    void onSaveMedia(updatedItem)
  }
  const handleModalDelete = (itemId: string) => {
    void onDeleteMedia(itemId)
  }

  return (
    <>
      <section className="px-2 sm:px-3 lg:px-4">
        <div className="mx-auto w-full max-w-7xl flex flex-col gap-2">
          <span className="text-sm font-semibold uppercase tracking-wide text-text-tertiary">Mozaiq</span>
          <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">Media</h2>
          <p className="text-sm text-text-secondary">add/edit media you own</p>
        </div>
      </section>

      <section className="px-2 sm:px-3 lg:px-4">
        <div className="mx-auto w-full max-w-7xl">
          <AddMediaInput onModalOpen={onAddMedia} />
        </div>
      </section>

      <div className="px-2 sm:px-3 lg:px-4">
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex flex-wrap gap-2 justify-start items-center">
            <SavedTags onTagsSelect={onSavedTagsSelect} refreshToken={savedTagsRefreshKey} />
          </div>
        </div>
      </div>

      <div className="flex-1 px-2 sm:px-3 lg:px-4 pb-8">
        <div className="max-w-7xl mx-auto w-full">
          <MediaGrid key={mediaLibraryVersion} tagFilters={tagFilters} />
        </div>
      </div>

      {modalState && (
        <EditMediaModal
          isOpen={true}
          item={modalState.item}
          metadata={modalState.metadata}
          thumbnail={modalState.thumbnail}
          onClose={onCloseModal}
          onSave={handleModalSave}
          onDelete={isEditMode ? handleModalDelete : () => {}}
          isAddMode={modalState.mode === "add"}
        />
      )}
    </>
  )
}

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const {
    tagFilters,
    savedTagsRefreshKey,
    mediaLibraryVersion,
    mediaModalState,
    handleAddMediaOpen,
    handleSavedTagsSelect,
    handleRecommendedUpdate,
    closeModal,
    handleSaveMedia,
    handleDeleteMedia,
  } = useMediaWorkspace()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-6 sm:gap-8">
        <RecommendedTags onLibraryUpdate={handleRecommendedUpdate} />

        <MediaWorkspace
          tagFilters={tagFilters}
          savedTagsRefreshKey={savedTagsRefreshKey}
          mediaLibraryVersion={mediaLibraryVersion}
          onSavedTagsSelect={handleSavedTagsSelect}
          onAddMedia={handleAddMediaOpen}
          modalState={mediaModalState}
          onCloseModal={closeModal}
          onSaveMedia={handleSaveMedia}
          onDeleteMedia={handleDeleteMedia}
        />
      </div>
    </AppShell>
  )
}
