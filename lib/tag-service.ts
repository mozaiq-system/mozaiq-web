"use client"

import { loadMediaItems, saveMediaItems } from "./storage"
import type { MediaItem } from "./storage-types"

export interface TagSummary {
  name: string
  count: number
}

export interface TagPreview {
  tag: string
  total: number
  media: Pick<MediaItem, "id" | "title" | "channel" | "thumbnail">[]
}

export interface RenameTagOptions {
  currentName: string
  nextName: string
}

export interface MergeTagOptions {
  source: string
  target: string
}

export interface DeleteTagOptions {
  tag: string
  replacement?: string
}

export interface OptimisticMutationResult<T> {
  optimisticState: T
  commit: () => Promise<void>
  rollback: () => void
}

function normalizeTag(tag: string) {
  return tag.trim()
}

export async function getTagSummaries(): Promise<TagSummary[]> {
  const media = await loadMediaItems()
  const usage = new Map<string, number>()

  for (const item of media) {
    for (const tag of item.tags) {
      const normalized = normalizeTag(tag)
      usage.set(normalized, (usage.get(normalized) ?? 0) + 1)
    }
  }

  return Array.from(usage.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count
      return a.name.localeCompare(b.name)
    })
}

export async function getTagPreview(tag: string, sampleSize = 6): Promise<TagPreview> {
  const media = await loadMediaItems()
  const matched = media.filter((item) => item.tags.includes(tag))
  return {
    tag,
    total: matched.length,
    media: matched.slice(0, sampleSize).map((item) => ({
      id: item.id,
      title: item.title,
      channel: item.channel,
      thumbnail: item.thumbnail,
    })),
  }
}

function applyRename(media: MediaItem[], { currentName, nextName }: RenameTagOptions): MediaItem[] {
  return media.map((item) => {
    if (!item.tags.includes(currentName)) return item
    const updatedTags = Array.from(
      new Set(item.tags.map((tag) => (tag === currentName ? normalizeTag(nextName) : tag))),
    )
    return { ...item, tags: updatedTags }
  })
}

function applyMerge(media: MediaItem[], { source, target }: MergeTagOptions): MediaItem[] {
  return media.map((item) => {
    if (!item.tags.includes(source)) return item

    const updatedTags = item.tags
      .map((tag) => (tag === source ? target : tag))
      .filter((tag, index, array) => array.indexOf(tag) === index)

    return { ...item, tags: updatedTags }
  })
}

function applyDelete(media: MediaItem[], { tag, replacement }: DeleteTagOptions): MediaItem[] {
  return media.map((item) => {
    if (!item.tags.includes(tag)) return item

    const filtered = item.tags.filter((existing) => existing !== tag)
    if (!replacement) {
      return { ...item, tags: filtered }
    }

    if (filtered.includes(replacement)) {
      return { ...item, tags: filtered }
    }

    return { ...item, tags: [...filtered, replacement] }
  })
}

export async function renameTag(options: RenameTagOptions): Promise<void> {
  const media = await loadMediaItems()
  const updated = applyRename(media, options)
  await saveMediaItems(updated)
}

export async function mergeTags(options: MergeTagOptions): Promise<void> {
  const media = await loadMediaItems()
  const updated = applyMerge(media, options)
  await saveMediaItems(updated)
}

export async function deleteTag(options: DeleteTagOptions): Promise<void> {
  const media = await loadMediaItems()
  const updated = applyDelete(media, options)
  await saveMediaItems(updated)
}

export function planOptimisticTagMutation<T extends MediaItem[]>(
  current: T,
  mutation: (items: T) => T,
  commit: () => Promise<void>,
  revert: (previous: T) => void,
): OptimisticMutationResult<T> {
  const optimisticState = mutation(current)
  let rolledBack = false

  return {
    optimisticState,
    commit: async () => {
      if (rolledBack) return
      await commit()
    },
    rollback: () => {
      rolledBack = true
      revert(current)
    },
  }
}
