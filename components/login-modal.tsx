"use client"

import { useEffect, useRef } from "react"
import { X } from "lucide-react"
import type { AuthProvider } from "@/hooks/use-auth"

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onLogin: (provider: AuthProvider) => void
}

const providerOptions: Array<{
  id: AuthProvider
  label: string
  description: string
  bgClass: string
  textClass: string
  badgeBg: string
  badgeText: string
}> = [
  {
    id: "kakao",
    label: "카카오로 계속하기",
    description: "카카오 계정으로 빠르게 로그인해요",
    bgClass: "bg-[#FEE500]",
    textClass: "text-[#191919]",
    badgeBg: "bg-[#191919]/10",
    badgeText: "text-[#191919]",
  },
  {
    id: "google",
    label: "구글로 계속하기",
    description: "Google 계정으로 안전하게 로그인해요",
    bgClass: "bg-white",
    textClass: "text-[#1F1F1F]",
    badgeBg: "bg-[#1F1F1F]/5",
    badgeText: "text-[#1F1F1F]",
  },
]

export function LoginModal({ isOpen, onClose, onLogin }: LoginModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        onClose()
      }
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("mousedown", handlePointerDown)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("mousedown", handlePointerDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-label="로그인"
    >
      <div
        ref={modalRef}
        className="w-full max-w-sm rounded-2xl border border-border bg-background p-6 shadow-2xl theme-transition"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">로그인이 필요해요</h2>
            <p className="mt-1 text-sm text-text-secondary">SNS 계정으로 간편하게 로그인할 수 있어요.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-text-secondary transition hover:text-foreground"
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 space-y-3">
          {providerOptions.map((provider) => (
            <button
              key={provider.id}
              type="button"
              onClick={() => onLogin(provider.id)}
              className={`w-full rounded-xl border border-border/60 px-4 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background ${provider.bgClass} ${provider.textClass}`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-full font-semibold uppercase ${provider.badgeBg} ${provider.badgeText}`}
                >
                  {provider.id === "kakao" ? "Ka" : "G"}
                </span>
                <div>
                  <div className="text-base font-semibold">{provider.label}</div>
                  <p className="text-sm opacity-75">{provider.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
