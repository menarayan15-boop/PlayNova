import React from "react"
import Link from "next/link"

export default function PrivacyPage() {
  return (
    <div className="pt-28 pb-24 bg-[#f5f4ee] min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-[#ffffff] border border-[#e2e0d6] shadow-sm flex flex-col gap-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8c7b33]/15 text-[#8c7b33] text-xs font-mono uppercase tracking-wider w-max">
            Draft Policy Notice
          </div>

          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#10292d]">
            Privacy Policy
          </h1>

          <div className="p-4 rounded-xl bg-[#f5f4ee] border border-[#e2e0d6] text-xs sm:text-sm text-[#66726f] leading-relaxed">
            <strong>Important Notice:</strong> This document is a placeholder draft for Phase 1 of the PlayNova platform. Formal legal policies are currently in preparation and will be finalized prior to public launch and user account enablement in Phase 2.
          </div>

          <div className="flex flex-col gap-4 text-sm text-[#66726f] leading-relaxed">
            <h2 className="text-lg font-semibold text-[#10292d]">1. Data Collection in Phase 1</h2>
            <p>
              Phase 1 of PlayNova does not require user registration or account creation to stream video samples. We do not harvest personal identity records, payment details, or tracking cookies during Phase 1 testing.
            </p>

            <h2 className="text-lg font-semibold text-[#10292d]">2. Local Playback State</h2>
            <p>
              Playback preferences such as volume levels and current timestamp are managed locally within your browser session using standard HTML5 Video APIs and client-side memory.
            </p>

            <h2 className="text-lg font-semibold text-[#10292d]">3. Contact Information</h2>
            <p>
              For technical queries regarding Phase 1 development, please consult the project documentation.
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

