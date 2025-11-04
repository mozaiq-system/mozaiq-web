export interface MediaItem {
  id: string
  url: string
  tags: string[]
  createdAt: number
  title?: string
  channel?: string
  thumbnail?: string
}

export interface MediaItemInput {
  url: string
  tags: string[]
  title?: string
  channel?: string
  thumbnail?: string
}

export interface AppSettings {
  theme: "light" | "dark"
  language: "en" | "ko"
  notifications: boolean
}

export const STORAGE_KEYS = {
  MEDIA: "mediaItems",
  SETTINGS: "appSettings",
  VIDEO_METADATA_PREFIX: "videoMetadata_",
  YT_METADATA_PREFIX: "yt-metadata-",
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "light",
  language: "en",
  notifications: true,
}
