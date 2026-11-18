import type { Metadata } from "next"
import "./globals.css"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import AuthProvider from "@/components/auth/AuthProvider"

export const metadata: Metadata = {
  title: "PlayNova — A Smarter Way to Watch",
  description:
    "Experience fluid HTML5 video streaming with advanced playback controls, responsive 3D design, and zero distractions.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "PlayNova — A Smarter Way to Watch",
    description:
      "Modern HTML5 video streaming platform with responsive 3D design and advanced custom playback controls.",
    siteName: "PlayNova",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#f5f4ee] text-[#10292d]">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-full focus:bg-[#0f3238] focus:text-white focus:text-xs focus:font-semibold focus:shadow-lg"
        >
          Skip to main content
        </a>
        <AuthProvider>
          <Navbar />
          <main id="main-content" className="flex-1 outline-none" tabIndex={-1}>
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  )
}
