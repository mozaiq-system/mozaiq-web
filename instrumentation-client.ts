import posthog from "posthog-js"
import { trackAppOpened } from "@/lib/analytics"

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY

const isLocalHost = () => {
  if (typeof window === "undefined") return true
  const host = window.location.hostname
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host === "[::1]" ||
    host.endsWith(".local")
  )
}

if (typeof window !== "undefined" && POSTHOG_KEY && !isLocalHost()) {
  const getAnonymousId = () => {
    const key = "mozaiq_anon_id"
    let id = window.localStorage.getItem(key)
    if (!id) {
      id = self.crypto.randomUUID()
      window.localStorage.setItem(key, id)
    }
    return id
  }

  const anonymousId = getAnonymousId()

  posthog.init(POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    defaults: "2025-05-24",
    // Enables capturing unhandled exceptions via Error Tracking
    capture_exceptions: true,
    // Turn on debug in development mode
    debug: process.env.NODE_ENV === "development",
    autocapture: false,
  })

  posthog.identify(anonymousId)
  trackAppOpened()
}
