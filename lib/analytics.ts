"use client"

import posthog from "posthog-js"

export type MediaEventSource = "manual" | "prepared" | "share"
export type MediaEditMode = "create" | "update"

const capture = (eventName: string, payload: Record<string, unknown>) => {
  if (typeof window === "undefined") return
  if (typeof posthog.capture !== "function") return
  posthog.capture(eventName, payload)
}

export const normalizeTag = (tag: string) => tag.trim().toLowerCase()

export const normalizeTags = (tags: string[]) => {
  return Array.from(new Set(tags.map(normalizeTag))).filter(Boolean)
}

export const trackAppOpened = () => {
  capture("app_opened", {})
}

interface MediaLifecyclePayload {
  mediaId: string
  source: MediaEventSource
  modalName: string
  hasTagsChanged: boolean
  hasMetadataChanged: boolean
}

export const trackMediaCreated = ({
  mediaId,
  source,
  modalName,
  hasTagsChanged,
  hasMetadataChanged,
}: MediaLifecyclePayload) => {
  capture("media_created", {
    media_id: mediaId,
    source,
    modal_name: modalName,
    has_tags_changed: hasTagsChanged,
    has_metadata_changed: hasMetadataChanged,
  })
}

export const trackMediaUpdated = ({
  mediaId,
  source,
  modalName,
  hasTagsChanged,
  hasMetadataChanged,
}: MediaLifecyclePayload) => {
  capture("media_updated", {
    media_id: mediaId,
    source,
    modal_name: modalName,
    has_tags_changed: hasTagsChanged,
    has_metadata_changed: hasMetadataChanged,
  })
}

export const trackMediaTagsUpdated = ({
  mediaId,
  previousTags,
  nextTags,
  editMode,
}: {
  mediaId: string
  previousTags: string[]
  nextTags: string[]
  editMode: MediaEditMode
}) => {
  const prev = normalizeTags(previousTags)
  const next = normalizeTags(nextTags)
  const diffAdded = next.filter((tag) => !prev.includes(tag))
  const diffRemoved = prev.filter((tag) => !next.includes(tag))

  if (diffAdded.length === 0 && diffRemoved.length === 0) {
    return
  }

  capture("media_tags_updated", {
    media_id: mediaId,
    diff_added_tags: diffAdded,
    diff_removed_tags: diffRemoved,
    final_tags: next,
    final_tag_count: next.length,
    edit_mode: editMode,
  })
}

export const trackMediaMetadataMultiFieldEdit = ({
  mediaId,
  fieldsUpdated,
}: {
  mediaId: string
  fieldsUpdated: string[]
}) => {
  if (fieldsUpdated.length === 0) return

  capture("media_metadata_multi_field_edit", {
    media_id: mediaId,
    fields_updated: fieldsUpdated,
    field_count: fieldsUpdated.length,
  })
}

export const trackPlaylistGenerated = ({
  selectedTags,
  resultMediaCount,
  isOrdered,
  success,
  reason,
  playlistId,
}: {
  selectedTags: string[]
  resultMediaCount: number
  isOrdered: boolean
  success: boolean
  reason?: string
  playlistId?: string
}) => {
  capture("playlist_generated", {
    selected_tags: normalizeTags(selectedTags),
    selected_tag_count: selectedTags.length,
    result_media_count: resultMediaCount,
    is_ordered: isOrdered,
    success,
    reason: reason ?? null,
    playlist_id: playlistId ?? null,
  })
}

export const trackUiError = ({
  where,
  errorCode,
  messageShort,
}: {
  where: string
  errorCode: string
  messageShort: string
}) => {
  capture("ui_error", {
    where,
    error_code: errorCode,
    message_short: messageShort,
  })
}
