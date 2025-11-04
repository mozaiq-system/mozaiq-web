"use client"

import { useState } from "react"
import { X } from "lucide-react"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  isDark: boolean
  onThemeChange: (isDark: boolean) => void
}

export function SettingsModal({ isOpen, onClose, isDark, onThemeChange }: SettingsModalProps) {
  const [language, setLanguage] = useState("english")
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)

  if (!isOpen) return null

  return (
    <>
      {/* Blurred backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm theme-transition" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-md rounded-xl border shadow-xl theme-transition animate-in fade-in zoom-in-95 duration-250"
          style={{
            backgroundColor: "var(--background)",
            borderColor: "var(--border)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between border-b px-6 py-4"
            style={{ borderColor: "var(--border)" }}
          >
            <h2 className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>
              Settings
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1 transition-colors duration-200 hover:bg-surface"
              aria-label="Close settings"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 space-y-6">
            {/* Theme section */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                Theme
              </label>
              <button
                onClick={() => onThemeChange(!isDark)}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ease-in-out"
                style={{
                  backgroundColor: isDark ? "var(--accent)" : "var(--border)",
                }}
                role="switch"
                aria-checked={isDark}
              >
                <span
                  className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ease-in-out"
                  style={{
                    transform: isDark ? "translateX(22px)" : "translateX(2px)",
                  }}
                />
              </button>
            </div>

            {/* Language section */}
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm transition-all duration-300 ease-in-out"
                style={{
                  backgroundColor: "var(--input-bg)",
                  borderColor: "var(--border)",
                  color: "var(--foreground)",
                }}
              >
                <option value="english">English</option>
                <option value="korean">한국어</option>
              </select>
            </div>

            {/* Notifications section */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                Enable playlist update alerts
              </label>
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                className="h-4 w-4 rounded cursor-pointer"
                style={{
                  accentColor: "var(--accent)",
                }}
              />
            </div>
          </div>

          {/* Footer with buttons */}
          <div className="flex justify-end gap-3 border-t px-6 py-4" style={{ borderColor: "var(--border)" }}>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              style={{
                color: "var(--foreground)",
                backgroundColor: "transparent",
                border: `1px solid var(--border)`,
              }}
            >
              Cancel
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors duration-200 hover:opacity-90"
              style={{
                backgroundColor: "var(--accent)",
              }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
