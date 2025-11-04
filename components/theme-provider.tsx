"use client"

import { useEffect, type ReactNode } from "react"

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme")
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const isDark = savedTheme === "dark" || (savedTheme === null && prefersDark)

    if (isDark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [])

  return <>{children}</>
}
