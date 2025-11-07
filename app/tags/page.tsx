"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { getTagSummaries, type TagSummary } from "@/lib/tag-service"
import { AppShell } from "@/components/app-shell"

type SortOption = "frequency" | "alphabetical"

export default function TagsIndexPage() {
  const [tagSummaries, setTagSummaries] = useState<TagSummary[]>([])
  const [filteredTags, setFilteredTags] = useState<TagSummary[]>([])
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<SortOption>("frequency")
  const [selected, setSelected] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setIsLoading(true)
        const summaries = await getTagSummaries()
        if (!mounted) return
        setTagSummaries(summaries)
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

          <div role="grid" aria-rowcount={filteredTags.length} className="max-h-[60vh] overflow-y-auto">
            {isLoading && (
              <div className="flex items-center justify-center px-3 py-12 text-sm text-text-secondary">
                Loading tags…
              </div>
            )}

            {error && !isLoading && (
              <div className="flex flex-col items-center justify-center gap-2 px-3 py-12 text-center text-sm text-red-500">
                <p>Unable to load tags</p>
                <p className="text-xs text-text-tertiary">{error}</p>
              </div>
            )}

            {!isLoading && !error && filteredTags.length === 0 && (
              <div className="flex items-center justify-center px-3 py-12 text-sm text-text-secondary">
                No tags match your filters.
              </div>
            )}

            {!isLoading &&
              !error &&
              filteredTags.map((tag, index) => {
                const isChecked = selected.includes(tag.name)
                const rowId = `tag-row-${tag.name}`

                return (
                  <div
                    key={tag.name}
                    role="row"
                    aria-rowindex={index + 1}
                    className="flex items-center justify-between border-b border-border px-3 py-3 last:border-b-0 hover:bg-surface focus-within:bg-surface transition-colors"
                  >
                    <div className="flex flex-1 items-center gap-3" role="gridcell">
                      <input
                        id={`${rowId}-checkbox`}
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleTag(tag.name)}
                        className="h-4 w-4 rounded border-border text-accent focus:ring-accent-light"
                        aria-labelledby={`${rowId}-label`}
                      />
                      <div className="flex flex-col">
                        <span id={`${rowId}-label`} className="text-sm font-medium">
                          {tag.name}
                        </span>
                        <span className="text-xs text-text-secondary">{tag.count} items</span>
                      </div>
                    </div>
                    <div role="gridcell" className="flex items-center gap-3">
                      <Link
                        href={`/tags/${encodeURIComponent(tag.name)}`}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        Open detail
                      </Link>
                    </div>
                  </div>
                )
              })}
          </div>
        </section>
      </div>
    </AppShell>
  )
}
