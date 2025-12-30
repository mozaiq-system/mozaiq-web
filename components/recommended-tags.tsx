"use client"

import { useState } from "react"
import { Check, Loader2, Plus } from "lucide-react"
import { addMediaItem, loadMediaItems, updateMediaItem } from "@/lib/storage"
import { RECOMMENDED_TAGS } from "@/data/recommended-tags"
import { fetchYouTubeMetadata } from "@/lib/youtube-utils"
import { trackMediaCreated, trackMediaTagsUpdated, trackUiError } from "@/lib/analytics"
import { useToast } from "@/hooks/use-toast"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

interface RecommendedTagsProps {
  onLibraryUpdate?: (tag: string) => void
}

export function RecommendedTags({ onLibraryUpdate }: RecommendedTagsProps) {
  const [savingTag, setSavingTag] = useState<string | null>(null)
  const [completedTags, setCompletedTags] = useState<string[]>([])
  const { toast } = useToast()
  const notify = (message: string) => toast({ description: message })

  const buildPlaylistUrl = (videos: string[]) => {
    const ids = videos
      .map((video) => getYouTubeId(video))
      .filter((id): id is string => Boolean(id))
      .join(",")
    if (!ids) return videos[0]
    return `https://www.youtube.com/watch_videos?video_ids=${ids}`
  }

  const handleAddRecommended = async (tag: string) => {
    const recommendation = RECOMMENDED_TAGS.find((entry) => entry.tag === tag)
    if (!recommendation) return

    setSavingTag(tag)
    try {
      const existing = await loadMediaItems()
      const itemsByVideoId = new Map<string, (typeof existing)[number]>()
      existing.forEach((item) => {
        const id = getYouTubeId(item.url)
        if (id) {
          itemsByVideoId.set(id, item)
        }
      })

      const urlsToAdd: string[] = []
      const itemsToUpdate: { id: string; previousTags: string[]; nextTags: string[] }[] = []

      recommendation.videos.forEach((video) => {
        const videoId = getYouTubeId(video)
        if (!videoId) return
        const existingItem = itemsByVideoId.get(videoId)
        if (!existingItem) {
          urlsToAdd.push(video)
          return
        }

        const hasTag = existingItem.tags.includes(tag)
        if (!hasTag) {
          itemsToUpdate.push({
            id: existingItem.id,
            previousTags: [...existingItem.tags],
            nextTags: [...existingItem.tags, tag],
          })
        }
      })

      if (itemsToUpdate.length > 0) {
        await Promise.all(itemsToUpdate.map((entry) => updateMediaItem(entry.id, { tags: entry.nextTags })))
        itemsToUpdate.forEach((entry) => {
          trackMediaTagsUpdated({
            mediaId: entry.id,
            previousTags: entry.previousTags,
            nextTags: entry.nextTags,
            editMode: "update",
          })
        })
      }

      if (urlsToAdd.length === 0) {
        notify(itemsToUpdate.length > 0 ? "기존 트랙에 태그를 추가했어요." : "모든 추천 트랙이 이미 저장되어 있어요.")
        setCompletedTags((prev) => (prev.includes(tag) ? prev : [...prev, tag]))
        onLibraryUpdate?.(tag)
        return
      }

      const metadataByUrl = new Map<string, Awaited<ReturnType<typeof fetchYouTubeMetadata>>>()
      await Promise.all(
        urlsToAdd.map(async (url) => {
          const metadata = await fetchYouTubeMetadata(url)
          metadataByUrl.set(url, metadata)
        }),
      )

      const createdItems = await Promise.all(
        urlsToAdd.map((url, index) => {
          const metadata = metadataByUrl.get(url)
          return addMediaItem({
            url,
            tags: [tag],
            title: metadata?.title ?? `${tag} 추천 트랙 ${index + 1}`,
            channel: metadata?.author_name ?? "MOZAIQ Recommend",
            thumbnail: metadata?.thumbnail_url,
          })
        }),
      )

      notify(`${tag} 태그와 플레이리스트를 라이브러리에 추가했어요.`)
      setCompletedTags((prev) => (prev.includes(tag) ? prev : [...prev, tag]))
      onLibraryUpdate?.(tag)

      createdItems.forEach((created) => {
        trackMediaCreated({
          mediaId: created.id,
          source: "prepared",
          modalName: "recommended_tags_card",
          hasTagsChanged: created.tags.length > 0,
          hasMetadataChanged: false,
        })

        trackMediaTagsUpdated({
          mediaId: created.id,
          previousTags: [],
          nextTags: created.tags,
          editMode: "create",
        })
      })
    } catch (error) {
      console.error(error)
      trackUiError({
        where: "recommended_tags",
        errorCode: "prepared_media_failed",
        messageShort: "Failed to add recommended tag bundle",
      })
      notify("추천 태그를 추가하지 못했어요. 다시 시도해 주세요.")
    } finally {
      setSavingTag(null)
    }
  }

  const getYouTubeId = (url: string) => {
    try {
      const patterns = [
        /youtu\.be\/([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      ]
      for (const pattern of patterns) {
        const match = url.match(pattern)
        if (match) return match[1]
      }
      return null
    } catch {
      return null
    }
  }

  return (
    <section className="px-2 py-8 sm:px-3 lg:px-4">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold uppercase tracking-wide text-text-tertiary">Recommend Tag</span>
          <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">Tag Preset</h2>
          <p className="text-sm text-text-secondary">add tag set or click and listen immediately</p>
        </div>
        <Carousel opts={{ align: "start", loop: true }} className="w-full">
          <CarouselContent>
            {RECOMMENDED_TAGS.map((recommendation) => {
              const isSaving = savingTag === recommendation.tag
              const isCompleted = completedTags.includes(recommendation.tag)
              const coverId = getYouTubeId(recommendation.videos[0])
              const coverImage = coverId ? `https://i.ytimg.com/vi/${coverId}/hq720.jpg` : null

              return (
                <CarouselItem key={recommendation.tag} className="basis-auto pl-4">
                  <div className="flex justify-center">
                    <a
                      href={buildPlaylistUrl(recommendation.videos)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative flex w-full max-w-[220px] flex-col rounded-2xl border border-border bg-background/80 p-3 shadow-sm transition-colors hover:border-accent hover:bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:max-w-[240px] sm:min-h-[210px] lg:min-h-[240px]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-lg font-semibold text-foreground">{recommendation.tag}</h3>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            handleAddRecommended(recommendation.tag)
                          }}
                          disabled={isSaving || isCompleted}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-secondary transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:border-border/60 disabled:text-text-tertiary"
                          aria-label={`${recommendation.tag} 태그 추천을 추가`}
                        >
                          {isSaving ? (
                            <Loader2 className="h-5 w-5 animate-spin text-accent" />
                          ) : isCompleted ? (
                            <Check className="h-5 w-5 text-accent" />
                          ) : (
                            <Plus className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                      <div className="mt-3 flex-1 space-y-2">
                        <p className="text-xs text-text-secondary leading-snug">{recommendation.description}</p>
                        <div className="relative aspect-square overflow-hidden rounded-2xl">
                          {coverImage ? (
                            <img
                              src={coverImage}
                              alt={`${recommendation.tag} 추천 썸네일`}
                              className="h-full w-full rounded-2xl object-cover object-center transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-text-tertiary">
                              Preview unavailable
                            </div>
                          )}
                        </div>
                      </div>
                    </a>
                  </div>
                </CarouselItem>
              )
            })}
          </CarouselContent>
          <CarouselPrevious className="hidden sm:flex" />
          <CarouselNext className="hidden sm:flex" />
        </Carousel>
      </div>
    </section>
  )
}
