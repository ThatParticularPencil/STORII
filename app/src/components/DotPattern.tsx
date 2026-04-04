import { useId } from 'react'
import { clsx } from 'clsx'

/**
 * DotPattern — editorial dot grid background.
 * Adapted from 21st.dev / Tailark. SVG-based so it scales crisp,
 * supports theming via currentColor/fill, and can be animated.
 */
interface DotPatternProps {
  width?: number
  height?: number
  cx?: number
  cy?: number
  cr?: number
  className?: string
}

export default function DotPattern({
  width = 22,
  height = 22,
  cx = 1,
  cy = 1,
  cr = 1,
  className,
}: DotPatternProps) {
  const id = useId()

  return (
    <svg
      aria-hidden="true"
      className={clsx(
        'pointer-events-none fixed inset-0 h-full w-full fill-ink-tertiary/20',
        'animate-[dotBreathe_6s_ease-in-out_infinite]',
        className,
      )}
      style={{ zIndex: 0 }}
    >
      <defs>
        <pattern
          id={id}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
        >
          <circle cx={cx} cy={cy} r={cr} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${id})`} />
    </svg>
  )
}
