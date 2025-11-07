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

  return (
    <section className="px-2 py-8 sm:px-3 lg:px-4">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold uppercase tracking-wide text-text-tertiary">Recommend Tag</span>
          <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">오늘의 태그 큐레이션</h2>
          <p className="text-sm text-text-secondary">마음에 드는 태그를 라이브러리에 추가하고 바로 감상해 보세요.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {RECOMMENDED_TAGS.map((recommendation) => {
            const isSaving = savingTag === recommendation.tag
            const isCompleted = completedTags.includes(recommendation.tag)

            return (
              <div
                key={recommendation.tag}
                className="group relative flex aspect-square flex-col justify-between rounded-2xl border border-border bg-background/80 p-4 shadow-sm transition-colors hover:border-accent hover:bg-background"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold text-foreground">{recommendation.tag}</h3>
                  <button
                    type="button"
                    onClick={() => handleAddRecommended(recommendation.tag)}
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
                <ul className="space-y-2 text-xs text-text-secondary">
                  {recommendation.videos.map((videoUrl, index) => (
                    <li key={videoUrl} className="flex items-center gap-2 rounded-lg bg-surface/60 p-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[11px] font-semibold text-accent">
                        {index + 1}
                      </span>
                      <a
                        className="truncate transition-colors hover:text-accent"
                        href={videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {videoUrl.replace("https://", "").split("?")[0]}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
