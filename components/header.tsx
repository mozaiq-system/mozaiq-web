"use client"

import { useEffect, useState } from "react"
import { Menu, Moon, Sun } from "lucide-react"
import { useRouter } from "next/navigation"
import { ProfileAvatar } from "./profile-avatar"

interface HeaderProps {
  onMenuToggle?: () => void
}

export function Header({ onMenuToggle }: HeaderProps) {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    const darkMode = document.documentElement.classList.contains("dark")
    setIsDark(darkMode)
  }, [])

  const toggleDarkMode = () => {
    const html = document.documentElement
    if (isDark) {
      html.classList.remove("dark")
      localStorage.setItem("theme", "light")
      setIsDark(false)
    } else {
      html.classList.add("dark")
      localStorage.setItem("theme", "dark")
      setIsDark(true)
    }
  }

  if (!mounted) {
    return (
      <header className="bg-background/80 backdrop-blur-md sticky top-0 z-40 theme-transition">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-2 py-4 sm:px-3 lg:px-4">
          <div className="flex items-center gap-3">
            {onMenuToggle && (
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border md:hidden" />
            )}
            <div className="w-8 h-8 rounded-lg bg-border/60" />
            <div className="h-5 w-24 rounded bg-border/40" />
          </div>
          <div className="flex items-center gap-2">
            <span className="h-10 w-10 rounded-lg bg-border/40" />
            <span className="h-10 w-10 rounded-full bg-border/40" />
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="bg-background/80 backdrop-blur-md sticky top-0 z-40 theme-transition">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-2 py-4 sm:px-3 lg:px-4">
        <div className="flex items-center gap-3">
          {onMenuToggle && (
            <button
              type="button"
              onClick={onMenuToggle}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:bg-surface hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background md:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          <div
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => router.push("/")}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-light flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight">MOZAIQ</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-surface transition-colors duration-200"
            aria-label="Toggle dark mode"
          >
            {isDark ? <Sun className="w-5 h-5 text-accent" /> : <Moon className="w-5 h-5 text-text-secondary" />}
          </button>
          <ProfileAvatar isDark={isDark} onThemeChange={toggleDarkMode} />
        </div>
      </div>
    </header>
  )
}
