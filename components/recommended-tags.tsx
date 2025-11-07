"use client"

import { useState } from "react"
import { Check, Loader2, Plus } from "lucide-react"
import { addMediaItem, loadMediaItems } from "@/lib/storage"
import { RECOMMENDED_TAGS } from "@/data/recommended-tags"

interface RecommendedTagsProps {
  onLibraryUpdate?: (tag: string) => void
}

export function RecommendedTags({ onLibraryUpdate }: RecommendedTagsProps) {
  const [savingTag, setSavingTag] = useState<string | null>(null)
  const [completedTags, setCompletedTags] = useState<string[]>([])

  const showToast = (message: string) => {
    const event = new CustomEvent("showToast", { detail: { message } })
    window.dispatchEvent(event)
  }

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
      const existingUrls = new Set(existing.map((item) => item.url))
      const urlsToAdd = recommendation.videos.filter((video) => !existingUrls.has(video))

      if (urlsToAdd.length === 0) {
        showToast("모든 추천 트랙이 이미 저장되어 있어요.")
        setCompletedTags((prev) => (prev.includes(tag) ? prev : [...prev, tag]))
        onLibraryUpdate?.(tag)
        return
      }

      await Promise.all(
        urlsToAdd.map((url, index) =>
          addMediaItem({
            url,
            tags: [tag],
            title: `${tag} 추천 트랙 ${index + 1}`,
            channel: "MOZAIQ Recommend",
          }),
        ),
      )

      showToast(`${tag} 태그와 플레이리스트를 라이브러리에 추가했어요.`)
      setCompletedTags((prev) => (prev.includes(tag) ? prev : [...prev, tag]))
      onLibraryUpdate?.(tag)
    } catch (error) {
      console.error(error)
      showToast("추천 태그를 추가하지 못했어요. 다시 시도해 주세요.")
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
          <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">오늘의 태그 큐레이션</h2>
          <p className="text-sm text-text-secondary">마음에 드는 태그를 라이브러리에 추가하고 바로 감상해 보세요.</p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {RECOMMENDED_TAGS.map((recommendation) => {
            const isSaving = savingTag === recommendation.tag
            const isCompleted = completedTags.includes(recommendation.tag)
            const coverId = getYouTubeId(recommendation.videos[0])
            const coverImage = coverId ? `https://i.ytimg.com/vi/${coverId}/hq720.jpg` : null

            return (
              <a
                key={recommendation.tag}
                href={buildPlaylistUrl(recommendation.videos)}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex min-h-[320px] flex-col rounded-2xl border border-border bg-background/80 p-4 shadow-sm transition-colors hover:border-accent hover:bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:min-h-[340px] lg:min-h-[360px]"
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
                <div className="mt-3 flex-1 space-y-3">
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

                  {/* <div className="rounded-xl bg-surface/60 px-4 py-3 text-sm">
                    <p className="font-medium text-text-secondary">추천 트랙 {recommendation.videos.length}곡</p>
                    <p className="text-xs text-text-tertiary">카드를 클릭하면 익명 재생 목록이 열립니다.</p>
                  </div> */}
                </div>
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}
