import type { MediaItem, MediaItemInput, AppSettings } from "./storage-types"
import { STORAGE_KEYS, DEFAULT_SETTINGS } from "./storage-types"
import { getStorageAdapter } from "./storage-adapter"

// In-memory cache to avoid repeated parses
let mediaCache: MediaItem[] | null = null
let settingsCache: AppSettings | null = null

function logWarning(message: string) {
  console.warn(`[storage] ${message}`)
}

/**
 * Media Operations
 */

export async function loadMediaItems(): Promise<MediaItem[]> {
  if (mediaCache !== null) {
    return mediaCache
  }

  try {
    const adapter = getStorageAdapter()
    const stored = adapter.getItem(STORAGE_KEYS.MEDIA)
    const items = stored ? JSON.parse(stored) : []
    mediaCache = items
    return items
  } catch (error) {
    logWarning(`Failed to load media items: ${error}`)
    return []
  }
}

export async function saveMediaItems(items: MediaItem[]): Promise<void> {
  try {
    // Deduplicate and validate tags
    const sanitized = items.map((item) => ({
      ...item,
      tags: Array.from(new Set(item.tags.map((t) => t.trim()))).filter(Boolean),
    }))

    const adapter = getStorageAdapter()
    adapter.setItem(STORAGE_KEYS.MEDIA, JSON.stringify(sanitized))
    mediaCache = sanitized
  } catch (error) {
    logWarning(`Failed to save media items: ${error}`)
    throw error
  }
}

export async function addMediaItem(input: MediaItemInput): Promise<MediaItem> {
  const items = await loadMediaItems()
  const newItem: MediaItem = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...input,
    createdAt: Date.now(),
  }
  items.push(newItem)
  await saveMediaItems(items)
  return newItem
}

export async function updateMediaItem(id: string, patch: Partial<MediaItem>): Promise<MediaItem> {
  const items = await loadMediaItems()
  const index = items.findIndex((item) => item.id === id)
  if (index === -1) {
    throw new Error(`Media item with id ${id} not found`)
  }
  const updated = { ...items[index], ...patch, id: items[index].id }
  items[index] = updated
  await saveMediaItems(items)
  return updated
}

export async function deleteMediaItem(id: string): Promise<void> {
  const items = await loadMediaItems()
  const filtered = items.filter((item) => item.id !== id)
  await saveMediaItems(filtered)
}

/**
 * Settings Operations
 */

export async function loadSettings(): Promise<AppSettings> {
  if (settingsCache !== null) {
    return settingsCache
  }

  try {
    const adapter = getStorageAdapter()
    const stored = adapter.getItem(STORAGE_KEYS.SETTINGS)
    const settings = stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS
    settingsCache = settings
    return settings
  } catch (error) {
    logWarning(`Failed to load settings: ${error}`)
    return DEFAULT_SETTINGS
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    const adapter = getStorageAdapter()
    adapter.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings))
    settingsCache = settings
  } catch (error) {
    logWarning(`Failed to save settings: ${error}`)
    throw error
  }
}

/**
 * Video Metadata Caching
 */

export async function getVideoMetadataCache(videoId: string): Promise<any | null> {
  try {
    const adapter = getStorageAdapter()
    const cached = adapter.getItem(`${STORAGE_KEYS.VIDEO_METADATA_PREFIX}${videoId}`)
    return cached ? JSON.parse(cached) : null
  } catch (error) {
    return null
  }
}

export async function setVideoMetadataCache(videoId: string, metadata: any): Promise<void> {
  try {
    const adapter = getStorageAdapter()
    adapter.setItem(`${STORAGE_KEYS.VIDEO_METADATA_PREFIX}${videoId}`, JSON.stringify(metadata))
  } catch (error) {
    logWarning(`Failed to cache video metadata: ${error}`)
  }
}

export async function getYouTubeMetadataCache(videoId: string): Promise<any | null> {
  try {
    const adapter = getStorageAdapter()
    const cached = adapter.getItem(`${STORAGE_KEYS.YT_METADATA_PREFIX}${videoId}`)
    return cached ? JSON.parse(cached) : null
  } catch (error) {
    return null
  }
}

export async function setYouTubeMetadataCache(videoId: string, metadata: any): Promise<void> {
  try {
    const adapter = getStorageAdapter()
    adapter.setItem(`${STORAGE_KEYS.YT_METADATA_PREFIX}${videoId}`, JSON.stringify(metadata))
  } catch (error) {
    logWarning(`Failed to cache YouTube metadata: ${error}`)
  }
}

export function invalidateCaches() {
  mediaCache = null
  settingsCache = null
}

/**
 * Add helper to extract all unique tags from media items with frequency tracking
 */
export async function getAllTags(): Promise<string[]> {
  const items = await loadMediaItems()
  const tagFrequency = new Map<string, number>()

  // Count tag frequency
  for (const item of items) {
    for (const tag of item.tags) {
      tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1)
    }
  }

  // Sort by frequency (descending), then alphabetically
  const sorted = Array.from(tagFrequency.entries())
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1] // Higher frequency first
      return a[0].localeCompare(b[0]) // Alphabetical second
    })
    .map(([tag]) => tag)

  return sorted
}

/**
 * Add helper to filter tags with priority ranking
 */
export function filterTagsWithPriority(query: string, availableTags: string[], excludeTags: string[]): string[] {
  if (!query.trim())
    return availableTags.filter((tag) => !excludeTags.some((t) => t.toLowerCase() === tag.toLowerCase()))

  const lowerQuery = query.toLowerCase().trim()
  const excluded = new Set(excludeTags.map((t) => t.toLowerCase()))

  const startsWith: string[] = []
  const contains: string[] = []

  for (const tag of availableTags) {
    if (excluded.has(tag.toLowerCase())) continue

    const lowerTag = tag.toLowerCase()
    if (lowerTag.startsWith(lowerQuery)) {
      startsWith.push(tag)
    } else if (lowerTag.includes(lowerQuery)) {
      contains.push(tag)
    }
  }

  return [...startsWith, ...contains].slice(0, 10) // Limit to 10 suggestions
}
