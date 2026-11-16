import React from "react"

interface PlayNovaLogoProps {
  size?: number
  showWordmark?: boolean
  className?: string
  lightMode?: boolean
}

export function PlayNovaMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0 transition-transform duration-300 hover:scale-105"
      aria-hidden="true"
    >
      {/* Outer rounded container with template accent color */}
      <rect x="1" y="1" width="30" height="30" rx="8" fill="#0f3238" stroke="#10292d" strokeWidth="1" />
      {/* Modern stylized play triangle */}
      <path
        d="M12 9.5L22.5 16L12 22.5V9.5Z"
        fill="#f5f4ee"
      />
      {/* Distinctive Olive Gold spark dot */}
      <circle cx="23.5" cy="10" r="2.2" fill="#8c7b33" />
    </svg>
  )
}

export default function PlayNovaLogo({
  size = 28,
  showWordmark = true,
  className = "",
  lightMode = false,
}: PlayNovaLogoProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <PlayNovaMark size={size} />
      {showWordmark && (
        <span
          className={`font-semibold tracking-[-0.03em] text-[17px] ${
            lightMode ? "text-[#eef2ec]" : "text-[#10292d]"
          }`}
        >
          Play<span className="text-[#8c7b33] font-bold">Nova</span>
        </span>
      )}
    </div>
  )
}

