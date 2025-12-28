"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Header } from "@/components/header"
import { cn } from "@/lib/utils"

interface AppShellProps {
  children: React.ReactNode
}

interface NavItem {
  label: string
  href: string
  match: (pathname: string) => boolean
}

const navItems: NavItem[] = [
  {
    label: "Home",
    href: "/",
    match: (pathname) => pathname === "/",
  },
  {
    label: "Tags",
    href: "/tags",
    match: (pathname) => pathname === "/tags" || pathname.startsWith("/tags/"),
  },
]

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)
  const navLinks = navItems.map((item) => ({
    label: item.label,
    href: item.href,
    isActive: item.match(pathname ?? "/"),
  }))

  useEffect(() => {
    if (!drawerOpen) return

    const drawer = drawerRef.current
    if (!drawer) return

    const focusable = Array.from(
      drawer.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      ),
    )

    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    first?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        setDrawerOpen(false)
      }

      if (event.key === "Tab" && focusable.length > 0) {
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [drawerOpen])

  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname])

  const renderNavLinks = (onNavigate?: () => void) =>
    navLinks.map((item) => (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        className={cn(
          "group flex items-center rounded-lg py-2 pr-3 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:ring-[color:var(--accent-color,#6C4AFF)]",
          item.isActive
            ? "border-l-4 border-l-[color:var(--accent-color,#6C4AFF)] bg-[rgba(108,74,255,0.12)] pl-2 text-[color:var(--accent-color,#6C4AFF)]"
            : "border-l-4 border-l-transparent pl-3 text-text-secondary hover:bg-surface hover:text-foreground",
        )}
        aria-current={item.isActive ? "page" : undefined}
      >
        {item.label}
      </Link>
    ))

  return (
    <div className="min-h-screen page-gradient bg-gradient-to-b from-background to-surface text-foreground theme-transition">
      <div className="mx-auto min-h-screen w-full max-w-screen-2xl px-0">
        <div className="flex min-h-screen flex-col">
          <Header onMenuToggle={() => setDrawerOpen(true)} navItems={navLinks} />
          <main className="flex-1 overflow-x-hidden">{children}</main>
        </div>
      </div>

      {drawerOpen && (
        <div className="md:hidden">
          <div className="fixed inset-0 z-40 bg-black/60" aria-hidden="true" onClick={() => setDrawerOpen(false)} />
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col gap-2 border-r border-border bg-background p-4 shadow-2xl focus:outline-none"
          >
            <div className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">Navigate</div>
            <nav aria-label="Primary" className="flex flex-col gap-1">
              {renderNavLinks(() => setDrawerOpen(false))}
            </nav>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="mt-auto inline-flex items-center justify-center rounded-lg border border-border px-3 py-2 text-xs font-semibold uppercase tracking-wide text-text-secondary transition-colors hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
