"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { loadMediaItems } from "@/lib/storage"
import { getTagSummaries, type TagSummary } from "@/lib/tag-service"
import { AppShell } from "@/components/app-shell"

type SortOption = "frequency" | "alphabetical"

export default function TagsIndexPage() {
  const router = useRouter()
  const [tagSummaries, setTagSummaries] = useState<TagSummary[]>([])
  const [filteredTags, setFilteredTags] = useState<TagSummary[]>([])
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<SortOption>("frequency")
  const [selected, setSelected] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tagSamples, setTagSamples] = useState<Record<string, { thumbnail?: string; title?: string }>>({})

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setIsLoading(true)
        const summaries = await getTagSummaries()
        const mediaItems = await loadMediaItems()
        const samples: Record<string, { thumbnail?: string; title?: string }> = {}
        for (const item of mediaItems) {
          for (const tag of item.tags) {
            if (!samples[tag]) {
              samples[tag] = { thumbnail: item.thumbnail, title: item.title ?? item.channel ?? "Untitled track" }
            }
          }
        }
        if (!mounted) return
        setTagSummaries(summaries)
        setTagSamples(samples)
      } catch (err) {
        if (!mounted) return
        setError(err instanceof Error ? err.message : "Failed to load tags")
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    const normalized = search.trim().toLowerCase()
    const base = [...tagSummaries]
    if (sort === "alphabetical") {
      base.sort((a, b) => a.name.localeCompare(b.name))
    } else {
      base.sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count
        return a.name.localeCompare(b.name)
      })
    }

    const next = normalized
      ? base.filter((tag) => tag.name.toLowerCase().includes(normalized))
      : base
    setFilteredTags(next)
  }, [tagSummaries, search, sort])

  useEffect(() => {
    setSelected((previous) => previous.filter((name) => filteredTags.some((tag) => tag.name === name)))
  }, [filteredTags])

  const selectedCount = selected.length
  const isIndeterminate = selectedCount > 0 && selectedCount < filteredTags.length

  const allSelected = useMemo(() => {
    return filteredTags.length > 0 && selectedCount === filteredTags.length
  }, [filteredTags.length, selectedCount])

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected([])
      return
    }
    setSelected(filteredTags.map((tag) => tag.name))
  }

  const toggleTag = (name: string) => {
    setSelected((prev) => {
      if (prev.includes(name)) {
        return prev.filter((tag) => tag !== name)
      }
      return [...prev, name]
    })
  }

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-2 py-8 sm:px-3 lg:px-4">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background/80 px-3 py-4 shadow-sm backdrop-blur sm:px-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-text-tertiary">Tag Control</p>
            <h1 className="text-2xl font-semibold leading-tight">Manage Tags</h1>
          </div>
          <div className="rounded-lg border border-border px-3 py-2 text-xs text-text-secondary">
            Select tags to rename, merge, or replace in bulk
          </div>
        </header>

        <section className="rounded-xl border border-border bg-background/80 shadow-sm backdrop-blur">
          <form
            className="flex flex-col gap-4 p-3 sm:flex-row sm:items-end sm:justify-between sm:p-4 lg:p-5"
            aria-label="Tag filters"
          >
            <div className="flex w-full flex-col gap-2 sm:max-w-sm">
              <label htmlFor="tag-search" className="text-sm font-medium text-text-secondary">
                Search tags
              </label>
              <input
                id="tag-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Filter by name…"
                className="input-field"
              />
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-44">
              <label htmlFor="tag-sort" className="text-sm font-medium text-text-secondary">
                Sort by
              </label>
              <select
                id="tag-sort"
                value={sort}
                onChange={(event) => setSort(event.target.value as SortOption)}
                className="input-field bg-surface"
              >
                <option value="frequency">Most used</option>
                <option value="alphabetical">Alphabetical</option>
              </select>
            </div>

            <div
              className="flex w-full flex-col gap-2 sm:w-auto"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              <span className="text-sm font-medium text-text-secondary">Bulk actions</span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-light disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={selectedCount !== 1}
                >
                  Rename 
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={selectedCount < 2}
                >
                  Merge
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-red-400 px-3 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={selectedCount === 0}
                >
                  Replace / Delete
                </button>
              </div>
            </div>
          </form>
        </section>

        <section className="flex-1 overflow-hidden rounded-xl border border-border bg-background/80 shadow-sm backdrop-blur">
          <header className="flex items-center justify-between border-b border-border px-3 py-3 sm:px-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <input
                  id="select-all"
                  type="checkbox"
                  checked={allSelected}
                  ref={(checkbox) => {
                    if (checkbox) {
                      checkbox.indeterminate = isIndeterminate
                    }
                  }}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-border text-accent focus:ring-accent-light"
                  aria-label={allSelected ? "Clear selections" : "Select all filtered tags"}
                />
                <label htmlFor="select-all" className="text-sm font-medium">
                  {filteredTags.length} tags
                </label>
              </div>
              <p className="text-xs text-text-secondary" aria-live="polite">
                {selectedCount} selected
              </p>
            </div>
            <p className="text-xs text-text-tertiary">
              Tip: Use Shift + Arrow keys to extend selection. Press Enter to open the tag detail page.
            </p>
          </header>

          <div className="grid max-h-[60vh] grid-cols-2 gap-4 overflow-y-auto px-3 py-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {isLoading && (
              <div className="col-span-full flex items-center justify-center py-12 text-sm text-text-secondary">
                Loading tags…
              </div>
            )}

            {error && !isLoading && (
              <div className="col-span-full flex flex-col items-center justify-center gap-2 py-12 text-center text-sm text-red-500">
                <p>Unable to load tags</p>
                <p className="text-xs text-text-tertiary">{error}</p>
              </div>
            )}

            {!isLoading && !error && filteredTags.length === 0 && (
              <div className="col-span-full flex items-center justify-center py-12 text-sm text-text-secondary">
                No tags match your filters.
              </div>
            )}

            {!isLoading &&
              !error &&
              filteredTags.map((tag, index) => {
                const isChecked = selected.includes(tag.name)
                const rowId = `tag-row-${tag.name}`
                const sample = tagSamples[tag.name] ?? {}

                return (
                  <button
                    key={tag.name}
                    type="button"
                    aria-label={`Open ${tag.name} detail`}
                    onClick={() => router.push(`/tags/${encodeURIComponent(tag.name)}`)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        router.push(`/tags/${encodeURIComponent(tag.name)}`)
                      }
                    }}
                    className="group flex flex-col rounded-2xl border border-border bg-background/70 p-4 text-left shadow-sm transition-colors hover:border-accent hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <div className="relative aspect-square overflow-hidden rounded-xl bg-surface">
                      {sample.thumbnail ? (
                        <img
                          src={sample.thumbnail}
                          alt=""
                          className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-text-tertiary">
                          No cover yet
                        </div>
                      )}
                      <input
                        id={`${rowId}-checkbox`}
                        type="checkbox"
                        checked={isChecked}
                        onChange={(event) => {
                          event.stopPropagation()
                          toggleTag(tag.name)
                        }}
                        className="absolute left-3 top-3 h-4 w-4 rounded border-border bg-background/80 text-accent focus:ring-accent-light"
                        aria-labelledby={`${rowId}-label`}
                      />
                    </div>

                    <div className="mt-4 flex flex-col gap-1">
                      <span id={`${rowId}-label`} className="text-base font-semibold">
                        {tag.name}
                      </span>
                      <p className="text-sm text-text-secondary">
                        {sample.title ? sample.title : "아직 소개 문구가 없어요."}
                      </p>
                    </div>

                    <div className="mt-auto pt-3 text-xs font-semibold text-text-tertiary">
                      {tag.count} tracks tagged
                    </div>
                  </button>
                )
              })}
          </div>
        </section>
      </div>
    </AppShell>
  )
}
