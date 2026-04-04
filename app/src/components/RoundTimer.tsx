import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'

interface RoundTimerProps {
  deadline: number // unix ms
  label: string
  className?: string
}

interface TimeLeft {
  hours: number
  minutes: number
  seconds: number
  total: number
}

function getTimeLeft(deadline: number): TimeLeft {
  const total = Math.max(0, deadline - Date.now())
  const seconds = Math.floor((total / 1000) % 60)
  const minutes = Math.floor((total / 1000 / 60) % 60)
  const hours = Math.floor(total / 1000 / 60 / 60)
  return { hours, minutes, seconds, total }
}

export default function RoundTimer({ deadline, label, className }: RoundTimerProps) {
  const [time, setTime] = useState<TimeLeft>(getTimeLeft(deadline))

  useEffect(() => {
    if (time.total <= 0) return
    const interval = setInterval(() => {
      const next = getTimeLeft(deadline)
      setTime(next)
      if (next.total <= 0) clearInterval(interval)
    }, 1000)
    return () => clearInterval(interval)
  }, [deadline])

  const isUrgent = time.total > 0 && time.total < 1000 * 60 * 30 // < 30 min
  const isExpired = time.total <= 0

  if (isExpired) {
    return (
      <div className={clsx('flex items-center gap-2', className)}>
        <div className="w-2 h-2 rounded-full bg-ink-tertiary" />
        <span className="text-sm text-ink-tertiary">{label} — Closed</span>
      </div>
    )
  }

  return (
    <div className={clsx('flex items-center gap-3', className)}>
      <div className={clsx('live-dot', isUrgent && '!bg-amber-500')} />
      <span className="text-label uppercase tracking-[0.08em] text-ink-tertiary">{label}</span>
      <div className="flex items-center gap-1">
        <TimeUnit value={time.hours} label="h" urgent={isUrgent} />
        <span className="text-ink-tertiary text-sm">:</span>
        <TimeUnit value={time.minutes} label="m" urgent={isUrgent} />
        <span className="text-ink-tertiary text-sm">:</span>
        <TimeUnit value={time.seconds} label="s" urgent={isUrgent} />
      </div>
    </div>
  )
}

function TimeUnit({
  value,
  label,
  urgent,
}: {
  value: number
  label: string
  urgent: boolean
}) {
  return (
    <motion.div
      key={value}
      initial={{ y: -4, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.15 }}
      className={clsx(
        'font-mono text-sm font-bold min-w-[1.8rem] text-center',
        urgent ? 'text-amber-600' : 'text-ink'
      )}
    >
      {String(value).padStart(2, '0')}
      <span className={clsx('text-xs ml-0.5', urgent ? 'text-amber-500' : 'text-ink-tertiary')}>
        {label}
      </span>
    </motion.div>
  )
}
