import type { Metadata } from "next"
import "./globals.css"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"

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
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}

