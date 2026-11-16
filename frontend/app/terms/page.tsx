import React from "react"
import Link from "next/link"

export default function TermsPage() {
  return (
    <div className="pt-28 pb-24 bg-[#f5f4ee] min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-[#ffffff] border border-[#e2e0d6] shadow-sm flex flex-col gap-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8c7b33]/15 text-[#8c7b33] text-xs font-mono uppercase tracking-wider w-max">
            Draft Policy Notice
          </div>

          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#10292d]">
            Terms of Service
          </h1>

          <div className="p-4 rounded-xl bg-[#f5f4ee] border border-[#e2e0d6] text-xs sm:text-sm text-[#66726f] leading-relaxed">
            <strong>Important Notice:</strong> This document is a placeholder draft for Phase 1 of the PlayNova platform. Formal terms of service will be prepared and enacted prior to multi-user features in Phase 2.
          </div>

          <div className="flex flex-col gap-4 text-sm text-[#66726f] leading-relaxed">
            <h2 className="text-lg font-semibold text-[#10292d]">1. Acceptance of Terms</h2>
            <p>
              By accessing and previewing the PlayNova demonstration environment, you acknowledge that Phase 1 represents a technology preview and design prototype showcasing the HTML5 Video engine and GSAP animation pipeline.
            </p>

            <h2 className="text-lg font-semibold text-[#10292d]">2. Content Attribution</h2>
            <p>
              All video assets utilized during Phase 1 testing originate from public domain and open-source creative projects (such as the Blender Open Movie Project: Big Buck Bunny, Tears of Steel, and Elephants Dream). Visual layout and animation techniques are adapted under MIT license from the Kedhareswer Naidu treasury landing page template.
            </p>

            <h2 className="text-lg font-semibold text-[#10292d]">3. No Warranty</h2>
            <p>
              The platform is provided &quot;as is&quot; for evaluation, development testing, and verification.
            </p>
          </div>

          <div className="pt-6 border-t border-[#e2e0d6]">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#8c7b33] hover:underline"
            >
              ← Return to PlayNova Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

