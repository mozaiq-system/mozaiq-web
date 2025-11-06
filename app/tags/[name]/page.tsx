"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  deleteTag,
  getTagPreview,
  getTagSummaries,
  mergeTags,
  renameTag,
  type TagPreview,
  type TagSummary,
} from "@/lib/tag-service"
import { loadMediaItems, saveMediaItems, invalidateCaches } from "@/lib/storage"
import { AppShell } from "@/components/app-shell"

interface RenameAction {
  type: "rename"
  payload: {
    currentName: string
    nextName: string
  }
}

interface MergeAction {
  type: "merge"
  payload: {
    source: string
    target: string
  }
}

interface DeleteAction {
  type: "delete"
  payload: {
    tag: string
    replacement?: string
  }
}

type PendingAction = RenameAction | MergeAction | DeleteAction

interface UndoState {
  message: string
  perform: () => Promise<void>
}

export default function TagDetailPage() {
  const params = useParams<{ name: string }>()
  const router = useRouter()
  const tagName = useMemo(() => decodeURIComponent(params?.name ?? ""), [params])
  const [preview, setPreview] = useState<TagPreview | null>(null)
  const [allTags, setAllTags] = useState<TagSummary[]>([])
  const [renameValue, setRenameValue] = useState(tagName)
  const [mergeTarget, setMergeTarget] = useState("")
  const [replacementTag, setReplacementTag] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [undoState, setUndoState] = useState<UndoState | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const loadData = useCallback(
    async (name: string) => {
      try {
        setIsLoading(true)
        setError(null)
        const [nextPreview, summaries] = await Promise.all([getTagPreview(name), getTagSummaries()])
        setPreview(nextPreview)
        setAllTags(summaries.filter((summary) => summary.name !== name))
        setMergeTarget((current) => {
          if (current && current !== name) return current
          return summaries.find((summary) => summary.name !== name)?.name ?? ""
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tag detail")
      } finally {
        setIsLoading(false)
      }
    },
    [setPreview, setAllTags],
  )

  useEffect(() => {
    setRenameValue(tagName)
    setReplacementTag("")
    setPendingAction(null)
    setDialogOpen(false)
    if (!tagName) {
      setPreview(null)
      return
    }
    void loadData(tagName)
  }, [tagName, loadData])

  useEffect(() => {
    if (!undoState) return
    const timer = window.setTimeout(() => setUndoState(null), 6000)
    return () => {
      window.clearTimeout(timer)
    }
  }, [undoState])

  const openDialog = (action: PendingAction) => {
    setPendingAction(action)
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setPendingAction(null)
  }

  const optimisticPreviewUpdate = (action: PendingAction) => {
    if (!preview) return
    if (action.type === "rename") {
      setPreview({ ...preview, tag: action.payload.nextName })
    }
    if (action.type === "merge") {
      setPreview({ ...preview, total: 0, media: [] })
    }
    if (action.type === "delete") {
      setPreview({ ...preview, total: 0, media: [] })
    }
    setAllTags((previous) =>
      previous.map((entry) => {
        if (action.type === "rename") {
          if (entry.name === action.payload.nextName) {
            return { ...entry, count: entry.count + (preview?.total ?? 0) }
          }
          if (entry.name === action.payload.currentName) {
            return { ...entry, count: 0 }
          }
        }
        if (action.type === "merge") {
          if (entry.name === action.payload.target) {
            return { ...entry, count: entry.count + (preview?.total ?? 0) }
          }
          if (entry.name === action.payload.source) {
            return { ...entry, count: 0 }
          }
        }
        if (action.type === "delete") {
          if (action.payload.replacement && entry.name === action.payload.replacement) {
            return { ...entry, count: entry.count + (preview?.total ?? 0) }
          }
          if (entry.name === action.payload.tag) {
            return { ...entry, count: 0 }
          }
        }
        return entry
      }),
    )
  }

  const handleConfirm = async () => {
    if (!pendingAction || !preview) return
    setIsProcessing(true)
    const snapshot = await loadMediaItems()
    const previousPreview = preview

    optimisticPreviewUpdate(pendingAction)

    const handleFailure = async () => {
      await saveMediaItems(snapshot)
      invalidateCaches()
      setPreview(previousPreview)
      await loadData(previousPreview.tag)
    }

    try {
      if (pendingAction.type === "rename") {
        await renameTag(pendingAction.payload)
        await loadData(pendingAction.payload.nextName)
        router.replace(`/tags/${encodeURIComponent(pendingAction.payload.nextName)}`)
        setUndoState({
          message: `Renamed to ${pendingAction.payload.nextName}`,
          perform: async () => {
            await saveMediaItems(snapshot)
            invalidateCaches()
            await loadData(previousPreview.tag)
            router.replace(`/tags/${encodeURIComponent(previousPreview.tag)}`)
          },
        })
      }

      if (pendingAction.type === "merge") {
        await mergeTags(pendingAction.payload)
        await loadData(pendingAction.payload.target)
        router.replace(`/tags/${encodeURIComponent(pendingAction.payload.target)}`)
        setUndoState({
          message: `Merged into ${pendingAction.payload.target}`,
          perform: async () => {
            await saveMediaItems(snapshot)
            invalidateCaches()
            await loadData(previousPreview.tag)
            router.replace(`/tags/${encodeURIComponent(previousPreview.tag)}`)
          },
        })
      }

      if (pendingAction.type === "delete") {
        await deleteTag(pendingAction.payload)
        router.replace("/tags")
        setUndoState({
          message: pendingAction.payload.replacement
            ? `Replaced ${pendingAction.payload.tag} with ${pendingAction.payload.replacement}`
            : `Deleted ${pendingAction.payload.tag}`,
          perform: async () => {
            await saveMediaItems(snapshot)
            invalidateCaches()
            await loadData(previousPreview.tag)
            router.replace(`/tags/${encodeURIComponent(previousPreview.tag)}`)
          },
        })
      }
    } catch (err) {
      await handleFailure()
    } finally {
      setIsProcessing(false)
      closeDialog()
    }
  }

  const summaryLabel = useMemo(() => {
    if (!pendingAction) return ""
    if (pendingAction.type === "rename") {
      return `Rename ${pendingAction.payload.currentName} → ${pendingAction.payload.nextName}`
    }
    if (pendingAction.type === "merge") {
      return `Merge ${pendingAction.payload.source} into ${pendingAction.payload.target}`
    }
    if (pendingAction.type === "delete") {
      if (pendingAction.payload.replacement) {
        return `Replace ${pendingAction.payload.tag} with ${pendingAction.payload.replacement}`
      }
      return `Delete ${pendingAction.payload.tag}`
    }
    return ""
  }, [pendingAction])

  const impactDescription = useMemo(() => {
    if (!pendingAction || !preview) return ""
    const count = preview.total
    if (pendingAction.type === "rename") {
      return `${count} media items will reference "${pendingAction.payload.nextName}".`
    }
    if (pendingAction.type === "merge") {
      return `${count} media items will move to "${pendingAction.payload.target}".`
    }
    if (pendingAction.type === "delete") {
      if (pendingAction.payload.replacement) {
        return `${count} media items will adopt "${pendingAction.payload.replacement}".`
      }
      return `${count} media items will lose this tag.`
    }
    return ""
  }, [pendingAction, preview])

  const handleUndo = async () => {
    if (!undoState) return
    await undoState.perform()
    setUndoState(null)
  }

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
        <header className="rounded-xl border border-border bg-background/80 px-4 py-4 shadow-sm backdrop-blur sm:px-6">
          <p className="text-sm uppercase tracking-wide text-text-tertiary">Tag detail</p>
          <h1 className="text-2xl font-semibold leading-tight text-balance">{tagName || "Unknown tag"}</h1>
        </header>

        {isLoading && (
          <div className="rounded-xl border border-border bg-background/80 p-6 shadow-sm">
            <p className="text-sm text-text-secondary">Loading tag metadata…</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="rounded-xl border border-red-400 bg-red-500/5 p-6 text-sm text-red-500">{error}</div>
        )}

        {!isLoading && !error && preview && (
          <>
            <section className="rounded-xl border border-border bg-background/80 shadow-sm">
              <div className="border-b border-border px-4 py-3 sm:px-6">
                <h2 className="text-lg font-semibold">Usage summary</h2>
                <p className="text-sm text-text-secondary">
                  {preview.total} media items currently tagged with{" "}
                  <span className="font-medium">{preview.tag}</span>.
                </p>
              </div>
              <div className="grid gap-4 px-4 py-4 sm:grid-cols-2 sm:px-6">
                {preview.media.length === 0 ? (
                  <p className="text-sm text-text-secondary">No content uses this tag yet.</p>
                ) : (
                  preview.media.map((media) => (
                    <article
                      key={media.id}
                      className="flex items-center gap-3 rounded-lg border border-border/60 bg-surface px-3 py-2"
                    >
                      <div className="h-10 w-16 overflow-hidden rounded-md bg-border/20">
                        {media.thumbnail ? (
                          <img
                            src={media.thumbnail}
                            alt=""
                            className="h-full w-full object-cover"
                            aria-hidden="true"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-text-tertiary">
                            No art
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium leading-tight">{media.title ?? "Untitled video"}</span>
                        <span className="text-xs text-text-secondary">{media.channel ?? "Unknown channel"}</span>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <form
                className="rounded-xl border border-border bg-background/80 shadow-sm"
                onSubmit={(event) => {
                  event.preventDefault()
                  if (!renameValue.trim() || renameValue === tagName) return
                  openDialog({
                    type: "rename",
                    payload: {
                      currentName: tagName,
                      nextName: renameValue.trim(),
                    },
                  })
                }}
              >
                <div className="border-b border-border px-4 py-3 sm:px-6">
                  <h2 className="text-lg font-semibold">Rename</h2>
                  <p className="text-sm text-text-secondary">
                    Update the tag label everywhere while keeping associations.
                  </p>
                </div>
                <div className="space-y-4 px-4 py-4 sm:px-6">
                  <label className="flex flex-col gap-2 text-sm">
                    <span className="font-medium text-text-secondary">New name</span>
                    <input
                      value={renameValue}
                      onChange={(event) => setRenameValue(event.target.value)}
                      className="input-field"
                      placeholder="Enter new tag name"
                      aria-describedby="rename-helper"
                    />
                  </label>
                  <p id="rename-helper" className="text-xs text-text-tertiary">
                    This will update {preview.total} references.
                  </p>
                  <div className="flex justify-end gap-2">
                    <button
                      type="submit"
                      className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-light disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={!renameValue.trim() || renameValue === tagName}
                    >
                      Review rename
                    </button>
                  </div>
                </div>
              </form>

              <form
                className="rounded-xl border border-border bg-background/80 shadow-sm"
                onSubmit={(event) => {
                  event.preventDefault()
                  if (!mergeTarget || mergeTarget === tagName) return
                  openDialog({
                    type: "merge",
                    payload: {
                      source: tagName,
                      target: mergeTarget,
                    },
                  })
                }}
              >
                <div className="border-b border-border px-4 py-3 sm:px-6">
                  <h2 className="text-lg font-semibold">Merge</h2>
                  <p className="text-sm text-text-secondary">
                    Consolidate this tag into another and keep playlists tidy.
                  </p>
                </div>
                <div className="space-y-4 px-4 py-4 sm:px-6">
                  <label className="flex flex-col gap-2 text-sm">
                    <span className="font-medium text-text-secondary">Destination tag</span>
                    <select
                      value={mergeTarget}
                      onChange={(event) => setMergeTarget(event.target.value)}
                      className="input-field bg-surface"
                      aria-describedby="merge-helper"
                    >
                      <option value="" disabled>
                        Select tag
                      </option>
                      {allTags.map((tag) => (
                        <option key={tag.name} value={tag.name}>
                          {tag.name} ({tag.count})
                        </option>
                      ))}
                    </select>
                  </label>
                  <p id="merge-helper" className="text-xs text-text-tertiary">
                    {preview.total} items will be reassigned.
                  </p>
                  <div className="flex justify-end gap-2">
                    <button
                      type="submit"
                      className="rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={!mergeTarget || mergeTarget === tagName}
                    >
                      Review merge
                    </button>
                  </div>
                </div>
              </form>

              <form
                className="rounded-xl border border-border bg-background/80 shadow-sm lg:col-span-2"
                onSubmit={(event) => {
                  event.preventDefault()
                  openDialog({
                    type: "delete",
                    payload: {
                      tag: tagName,
                      replacement: replacementTag.trim() || undefined,
                    },
                  })
                }}
              >
                <div className="border-b border-border px-4 py-3 sm:px-6">
                  <h2 className="text-lg font-semibold">Delete or replace</h2>
                  <p className="text-sm text-text-secondary">
                    Remove this tag or swap it with a replacement before deleting.
                  </p>
                </div>
                <div className="space-y-4 px-4 py-4 sm:px-6">
                  <label className="flex flex-col gap-2 text-sm">
                    <span className="font-medium text-text-secondary">Replacement (optional)</span>
                    <input
                      value={replacementTag}
                      onChange={(event) => setReplacementTag(event.target.value)}
                      className="input-field"
                      placeholder="Enter replacement tag or leave blank"
                      aria-describedby="delete-helper"
                    />
                  </label>
                  <p id="delete-helper" className="text-xs text-text-tertiary">
                    Leave blank to remove the tag from {preview.total} items.
                  </p>
                  <div className="flex justify-end gap-2">
                    <button
                      type="submit"
                      className="rounded-lg border border-red-400 px-3 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Review delete
                    </button>
                  </div>
                </div>
              </form>
            </section>
          </>
        )}
      </div>

      <ConfirmDialog
        open={dialogOpen}
        title="Confirm action"
        summary={summaryLabel}
        description={impactDescription}
        onCancel={closeDialog}
        onConfirm={handleConfirm}
        confirmLabel={pendingAction?.type === "delete" ? "Confirm delete" : "Confirm"}
        busy={isProcessing}
      />

      {undoState && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-lg border border-border bg-background/95 p-4 shadow-xl"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">{undoState.message}</p>
            <button
              onClick={handleUndo}
              className="rounded border border-border px-2 py-1 text-xs font-semibold uppercase tracking-wide hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Undo
            </button>
          </div>
        </div>
      )}
    </AppShell>
  )
}

interface ConfirmDialogProps {
  open: boolean
  title: string
  summary: string
  description: string
  confirmLabel: string
  busy: boolean
  onConfirm: () => void
  onCancel: () => void
}

function ConfirmDialog({
  open,
  title,
  summary,
  description,
  confirmLabel,
  busy,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const dialog = dialogRef.current
    if (!dialog) return

    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      ),
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    first?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        onCancel()
      }
      if (event.key === "Tab") {
        if (focusable.length === 0) return
        if (event.shiftKey) {
          if (document.activeElement === first) {
            event.preventDefault()
            last?.focus()
          }
        } else {
          if (document.activeElement === last) {
            event.preventDefault()
            first?.focus()
          }
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60" aria-hidden="true" onClick={onCancel} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className="relative z-10 w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-2xl focus:outline-none"
      >
        <h2 id="confirm-dialog-title" className="text-lg font-semibold text-foreground">
          {title}
        </h2>
        <p className="mt-2 text-sm font-medium text-text-secondary">{summary}</p>
        <p id="confirm-dialog-description" className="mt-1 text-sm text-text-tertiary">
          {description}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-light disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent focus-visible:ring-offset-background"
          >
            {busy ? "Processing…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
