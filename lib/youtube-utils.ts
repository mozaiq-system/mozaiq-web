import { getYouTubeMetadataCache, setYouTubeMetadataCache } from "./storage"

export function extractYouTubeId(url: string): string | null {
  try {
    const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    const match = url.match(youtubeRegex)
    return match ? match[1] : null
  } catch {
    return null
  }
}

export async function fetchYouTubeMetadata(url: string) {
  try {
    const videoId = extractYouTubeId(url)
    if (!videoId) return null

    const cached = await getYouTubeMetadataCache(videoId)
    if (cached) {
      return cached
    }

    // Fetch from oEmbed API
    const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`)

    if (!response.ok) return null

    const data = await response.json()
    const metadata = {
      title: data.title,
      author_name: data.author_name,
      thumbnail_url: data.thumbnail_url,
    }

    await setYouTubeMetadataCache(videoId, metadata)
    return metadata
  } catch {
    return null
  }
}
