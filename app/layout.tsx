import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono, Noto_Sans } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const notoSans = Noto_Sans({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "MOZAIQ - Tag-Based Playlists",
  description: "Create and browse beautiful tag-based playlists",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${notoSans.className} font-sans antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
