"use client"

import { useEffect, useState, useCallback } from "react"
import { Menu, Moon, Sun } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ProfileAvatar } from "./profile-avatar"
import { LoginModal } from "./login-modal"
import { cn } from "@/lib/utils"
import { useAuth, type AuthProvider } from "@/hooks/use-auth"

interface HeaderProps {
  onMenuToggle?: () => void
  navItems?: Array<{ label: string; href: string; isActive: boolean }>
}

export function Header({ onMenuToggle, navItems = [] }: HeaderProps) {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const { isLoggedIn, provider, login, logout } = useAuth()
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

  const handleLogin = useCallback(
    (selectedProvider: AuthProvider) => {
      login(selectedProvider)
      setIsLoginModalOpen(false)
    },
    [login],
  )

  if (!mounted) {
    return (
      <header className="bg-background/80 backdrop-blur-md sticky top-0 z-40 theme-transition">
        <div className="mx-auto relative flex w-full max-w-screen-2xl items-center justify-between px-2 py-4 sm:px-3 lg:px-4">
          <div className="flex items-center gap-3">
            {onMenuToggle && (
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border md:hidden" />
            )}
            <div className="w-8 h-8 rounded-lg bg-border/60" />
            <div className="h-5 w-24 rounded bg-border/40" />
          </div>
          {navItems.length > 0 && (
            <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center justify-center px-4">
              <span className="h-9 w-40 rounded-full border border-border bg-border/20" />
            </div>
          )}
          <div className="flex flex-1 items-center justify-end gap-2">
            <span className="h-10 w-10 rounded-lg bg-border/40" />
            <span className="h-10 w-10 rounded-full bg-border/40" />
          </div>
        </div>
      </header>
    )
  }

  const userInitial = provider === "kakao" ? "K" : provider === "google" ? "G" : "M"

  return (
    <>
      <header className="bg-background/80 backdrop-blur-md sticky top-0 z-40 theme-transition">
        <div className="mx-auto relative flex w-full max-w-screen-2xl items-center justify-between px-2 py-4 sm:px-3 lg:px-4">
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
              <h1 className="text-xl font-bold tracking-tight">MOZAIQ</h1>
            </div>
          </div>

          {navItems.length > 0 && (
            <nav className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-1 px-4">
              <div className="inline-flex items-center gap-1 rounded-full border border-border bg-background/90 px-1 py-1 shadow-sm">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                      item.isActive
                        ? "bg-[color:var(--accent-color,#6C4AFF)] text-white shadow-sm"
                        : "text-text-secondary hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </nav>
          )}

          <div className="flex flex-1 items-center justify-end gap-2">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-surface transition-colors duration-200"
              aria-label="Toggle dark mode"
            >
              {isDark ? <Sun className="w-5 h-5 text-accent" /> : <Moon className="w-5 h-5 text-text-secondary" />}
            </button>
            {isLoggedIn ? (
              <ProfileAvatar
                isDark={isDark}
                onThemeChange={toggleDarkMode}
                userInitial={userInitial}
                onLogout={logout}
              />
            ) : (
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(true)}
                className="inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>
      {!isLoggedIn && (
        <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} onLogin={handleLogin} />
      )}
    </>
  )
}
