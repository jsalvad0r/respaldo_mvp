import Image from 'next/image'

import { cn } from '@/lib/utils'

interface RespaldoMarkProps {
  className?: string
  /** Use on dark surfaces (e.g. the indigo hero). */
  onDark?: boolean
}

/**
 * Abstract, minimal Respaldo monogram — a rounded indigo tile with the "R".
 * Kept deliberately simple per brand guidance (no family imagery in the mark).
 */
export function RespaldoMark({ className, onDark = false }: RespaldoMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn('size-8 shrink-0', className)}
      role="img"
      aria-label="Respaldo"
    >
      <rect
        width="32"
        height="32"
        rx="9"
        fill={onDark ? '#ffffff' : 'var(--brand-indigo)'}
      />
      <path
        d="M11.5 7.5h5.6c3 0 5 1.9 5 4.7 0 2-1 3.5-2.8 4.2l3.2 8.1h-3.5l-2.8-7.4h-1.9v7.4h-2.9V7.5Zm2.9 2.7v3.9h2.4c1.3 0 2.1-.8 2.1-2s-.8-1.9-2.1-1.9h-2.4Z"
        fill={onDark ? 'var(--brand-indigo)' : '#ffffff'}
      />
      <circle cx="24" cy="9" r="2.4" fill="var(--brand-blue)" />
    </svg>
  )
}

interface RespaldoWordmarkProps {
  className?: string
  /** Renders the word in white for dark surfaces. */
  onDark?: boolean
  /** Hide the "Seguros de vida" tagline. */
  compact?: boolean
}

/** Mark + wordmark lockup used across app chrome (sidebar, headers). */
export function RespaldoWordmark({
  className,
  onDark = false,
  compact = false,
}: RespaldoWordmarkProps) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <RespaldoMark onDark={onDark} className="size-8" />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            'font-display text-lg font-extrabold tracking-tight',
            onDark ? 'text-white' : 'text-[var(--brand-indigo)]'
          )}
        >
          Respaldo
        </span>
        {!compact && (
          <span
            className={cn(
              'text-[10px] font-semibold uppercase tracking-[0.18em]',
              onDark ? 'text-white/60' : 'text-[var(--brand-blue)]'
            )}
          >
            Seguros de vida
          </span>
        )}
      </span>
    </span>
  )
}

interface RespaldoLogoProps {
  className?: string
  width?: number
  height?: number
  priority?: boolean
}

/** The full Respaldo logo image — for large brand moments on light surfaces. */
export function RespaldoLogo({
  className,
  width = 220,
  height = 147,
  priority,
}: RespaldoLogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="Respaldo · Seguros de vida"
      width={width}
      height={height}
      priority={priority}
      className={cn('h-auto w-auto object-contain', className)}
    />
  )
}
