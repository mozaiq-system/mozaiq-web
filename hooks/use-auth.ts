"use client"

import { useCallback, useEffect, useState } from "react"

export type AuthProvider = "kakao" | "google"

const AUTH_STORAGE_KEY = "mozaiq:auth_provider"

function readStoredProvider(): AuthProvider | null {
  if (typeof window === "undefined") return null

  const stored = window.localStorage.getItem(AUTH_STORAGE_KEY)
  if (stored === "kakao" || stored === "google") {
    return stored
  }
  return null
}

export function useAuth() {
  const [provider, setProvider] = useState<AuthProvider | null>(null)

  useEffect(() => {
    setProvider(readStoredProvider())
  }, [])

  const login = useCallback((nextProvider: AuthProvider) => {
    if (typeof window === "undefined") return

    window.localStorage.setItem(AUTH_STORAGE_KEY, nextProvider)
    setProvider(nextProvider)
  }, [])

  const logout = useCallback(() => {
    if (typeof window === "undefined") return

    window.localStorage.removeItem(AUTH_STORAGE_KEY)
    setProvider(null)
  }, [])

  return {
    isLoggedIn: Boolean(provider),
    provider,
    login,
    logout,
  }
}
