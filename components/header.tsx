"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { useRouter } from "next/navigation"
import { ProfileAvatar } from "./profile-avatar"

export function Header() {
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
      <header className="border-b border-border/30 bg-background/80 backdrop-blur-md sticky top-0 z-50 theme-transition">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex-1" />
        </div>
      </header>
    )
  }

  return (
    <header className="border-b border-border/30 bg-background/80 backdrop-blur-md sticky top-0 z-50 theme-transition">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => router.push("/")}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-light flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">MOZAIQ</h1>
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
