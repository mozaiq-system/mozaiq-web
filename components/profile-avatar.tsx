"use client"

import { useState, useRef, useEffect } from "react"
import { LogOut, Settings } from "lucide-react"
import { SettingsModal } from "./settings-modal"

interface ProfileAvatarProps {
  isDark: boolean
  onThemeChange: (isDark: boolean) => void
  userInitial?: string
  onLogout?: () => void
}

export function ProfileAvatar({ isDark, onThemeChange, userInitial, onLogout }: ProfileAvatarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const displayInitial = userInitial?.trim() ? userInitial.trim().slice(0, 2).toUpperCase() : "M"

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-accent-light flex items-center justify-center border transition-all duration-200 ease-in-out cursor-pointer"
          style={{
            borderColor: "var(--border)",
          }}
          aria-label="Profile menu"
          aria-expanded={isOpen}
        >
          <span className="text-white font-semibold text-sm">{displayInitial}</span>
        </button>

        {isOpen && (
          <div
            className="absolute right-0 mt-2 w-44 rounded-lg border shadow-lg theme-transition animate-in fade-in zoom-in-95 duration-200"
            style={{
              backgroundColor: "var(--background)",
              borderColor: "var(--border)",
            }}
          >
            <div className="flex flex-col">
              {/* Settings option */}
              <button
                onClick={() => {
                  setIsOpen(false)
                  setIsSettingsOpen(true)
                }}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors duration-200 ease-in-out cursor-pointer hover:bg-accent/10 first:rounded-t-lg"
                style={{
                  color: "var(--foreground)",
                }}
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>

              {/* Divider */}
              <div
                className="h-px"
                style={{
                  backgroundColor: "var(--border)",
                }}
              />

              {/* Log out option */}
              <button
                onClick={() => {
                  setIsOpen(false)
                  onLogout?.()
                }}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors duration-200 ease-in-out cursor-pointer hover:bg-accent/10 last:rounded-b-lg"
                style={{
                  color: "var(--foreground)",
                }}
              >
                <LogOut className="w-4 h-4" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isDark={isDark}
        onThemeChange={onThemeChange}
      />
    </>
  )
}
