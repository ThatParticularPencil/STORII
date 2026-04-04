import { useState, useEffect, useRef } from 'react'

interface TypewriterTextProps {
  text: string
  speed?: number
  className?: string
  onComplete?: () => void
  showCursor?: boolean
  startDelay?: number
}

export default function TypewriterText({
  text,
  speed = 28,
  className = '',
  onComplete,
  showCursor = true,
  startDelay = 0,
}: TypewriterTextProps) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  const indexRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    indexRef.current = 0
    setDisplayed('')
    setDone(false)

    const startTimer = setTimeout(() => {
      const tick = () => {
        if (indexRef.current < text.length) {
          indexRef.current++
          setDisplayed(text.slice(0, indexRef.current))
          timerRef.current = setTimeout(tick, speed)
        } else {
          setDone(true)
          onComplete?.()
        }
      }
      tick()
    }, startDelay)

    return () => {
      clearTimeout(startTimer)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [text, speed, startDelay])

  return (
    <span className={className}>
      {displayed}
      {showCursor && !done && (
        <span className="inline-block w-0.5 h-5 bg-sage ml-0.5 animate-pulse" />
      )}
    </span>
  )
}
