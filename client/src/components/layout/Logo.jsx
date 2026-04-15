export default function Logo({ size = 'md', showText = true }) {
  const sizes = { sm: 28, md: 36, lg: 48 }
  const px = sizes[size] || sizes.md

  return (
    <div className="flex items-center gap-2 select-none">
      {/* SVG Icon */}
      <svg
        width={px}
        height={px}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Touchbase logo"
      >
        <defs>
          <linearGradient id="tbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#EF4444" />
          </linearGradient>
          <linearGradient id="tbGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#F97316" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* Left circle */}
        <circle cx="18" cy="24" r="14" fill="url(#tbGrad)" />

        {/* Right circle — overlaps to create connection */}
        <circle cx="30" cy="24" r="14" fill="url(#tbGrad2)" />

        {/* Pulse / signal wave in the intersection */}
        <path
          d="M 18 24 Q 20 18 24 24 Q 28 30 30 24"
          stroke="white"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Small dots at endpoints of the wave */}
        <circle cx="18" cy="24" r="2" fill="white" opacity="0.9" />
        <circle cx="30" cy="24" r="2" fill="white" opacity="0.9" />
      </svg>

      {/* Wordmark */}
      {showText && (
        <span className={`font-semibold tracking-tight ${size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-base' : 'text-xl'}`}>
          <span className="text-gray-900 dark:text-white">Touch</span>
          <span className="text-amber-500">base</span>
        </span>
      )}
    </div>
  )
}
