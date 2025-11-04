"use client"

import { PlayCircle } from "lucide-react"
import { motion } from "framer-motion"

interface Playlist {
  id: string
  title: string
  description: string
  tags: string[]
  trackCount: number
  image: string
}

interface PlaylistGridProps {
  playlists: Playlist[]
  tags: string[]
}

const PLAYLIST_DATA: Playlist[] = [
  {
    id: "1",
    title: "Midnight Vibes",
    description: "Perfect for late-night sessions",
    tags: ["Lo-Fi", "Chill", "Study"],
    trackCount: 42,
    image: "/midnight-lo-fi-aesthetic.jpg",
  },
  {
    id: "2",
    title: "Summer Energy",
    description: "Feel the beat of the season",
    tags: ["Pop", "Upbeat", "Party"],
    trackCount: 38,
    image: "/summer-pop-vibrant.jpg",
  },
  {
    id: "3",
    title: "Deep Reflections",
    description: "Introspective indie tracks",
    tags: ["Indie", "Ambient", "Relaxing"],
    trackCount: 35,
    image: "/indie-atmospheric.jpg",
  },
  {
    id: "4",
    title: "Workout Beast Mode",
    description: "High-energy tracks to pump you up",
    tags: ["Rock", "Metal", "Energetic", "Workout"],
    trackCount: 50,
    image: "/workout-rock-intense.jpg",
  },
  {
    id: "5",
    title: "Soul & Groove",
    description: "Smooth R&B and soul classics",
    tags: ["R&B", "Soul", "Funk"],
    trackCount: 44,
    image: "/soul-smooth-groovy.jpg",
  },
  {
    id: "6",
    title: "Electronic Dreams",
    description: "Synthi soundscapes and beats",
    tags: ["Electronic", "Synthwave", "Ambient"],
    trackCount: 40,
    image: "/electronic-synthwave-futuristic.jpg",
  },
  {
    id: "7",
    title: "Classical Journey",
    description: "Timeless orchestral masterpieces",
    tags: ["Classical", "Relaxing", "Ambient"],
    trackCount: 52,
    image: "/classical-orchestra.jpg",
  },
  {
    id: "8",
    title: "Jazz After Hours",
    description: "Smooth jazz for sophisticated ears",
    tags: ["Jazz", "Blues", "Chill"],
    trackCount: 37,
    image: "/jazz-smooth-elegant.jpg",
  },
]

function filterPlaylistsByTags(playlists: Playlist[], tags: string[]): Playlist[] {
  if (tags.length === 0) return []

  return playlists.filter((playlist) => tags.some((tag) => playlist.tags.includes(tag)))
}

export function PlaylistGrid({ playlists = PLAYLIST_DATA, tags }: PlaylistGridProps) {
  const filteredPlaylists = filterPlaylistsByTags(playlists, tags)

  if (tags.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-24 h-24 rounded-full bg-surface flex items-center justify-center mb-4">
          <svg className="w-12 h-12 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
            />
          </svg>
        </div>
        <p className="text-text-secondary text-center max-w-md">
          Add tags above to discover playlists tailored to your mood
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {filteredPlaylists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-text-secondary text-center">
            No playlists found for these tags. Try different combinations!
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Your Playlists</h2>
              <p className="text-sm text-text-secondary">
                {filteredPlaylists.length} playlist{filteredPlaylists.length !== 1 ? "s" : ""} found
              </p>
            </div>
          </div>

          <div className="playlist-grid">
            {filteredPlaylists.map((playlist, index) => (
              <motion.div
                key={playlist.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                <div className="group cursor-pointer">
                  <div className="relative overflow-hidden rounded-xl mb-4">
                    <img
                      src={playlist.image || "/placeholder.svg"}
                      alt={playlist.title}
                      className="w-full aspect-square object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                      <PlayCircle className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </div>

                  <h3 className="font-semibold text-sm line-clamp-2">{playlist.title}</h3>
                  <p className="text-xs text-text-secondary line-clamp-1 mb-2">{playlist.description}</p>

                  <div className="flex items-center gap-2">
                    <div className="flex flex-wrap gap-1">
                      {playlist.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: "var(--tag-chip-active)", color: "var(--accent)" }}
                        >
                          {tag}
                        </span>
                      ))}
                      {playlist.tags.length > 2 && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: "var(--tag-chip-active)", color: "var(--accent)" }}
                        >
                          +{playlist.tags.length - 2}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-text-secondary mt-2">{playlist.trackCount} tracks</p>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
