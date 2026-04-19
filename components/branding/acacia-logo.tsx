interface AcaciaLogoProps {
  compact?: boolean
}

export function AcaciaLogo({ compact = false }: AcaciaLogoProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-teal-200 bg-gradient-to-br from-teal-700 via-teal-600 to-emerald-500 text-white shadow-sm">
        <svg viewBox="0 0 44 44" aria-hidden="true" className="h-8 w-8">
          <path
            d="M22 6 10 18.25v19.5h8.5v-9.25h7v9.25H34v-19.5L22 6Z"
            fill="currentColor"
            opacity="0.95"
          />
          <path
            d="M22 13.5 14.75 20.9v4.35c2.5-1.8 4.86-2.7 7.08-2.7 2.22 0 4.7.96 7.42 2.88v-4.53L22 13.5Z"
            fill="#CFFAFE"
            opacity="0.95"
          />
        </svg>
      </div>
      {!compact ? (
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-teal-700">Acacia Therapy Homes</p>
          <p className="text-lg font-semibold text-slate-900">Cornerstone</p>
        </div>
      ) : null}
    </div>
  )
}
