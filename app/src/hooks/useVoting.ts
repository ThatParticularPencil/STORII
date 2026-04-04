import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import type { DemoSubmission } from '@/types'

interface VoteUpdate {
  submissionId: string
  newCount: number
  totalVotes: number
}

export function useVoting(roundId: string | null) {
  const socketRef = useRef<Socket | null>(null)
  const [submissions, setSubmissions] = useState<DemoSubmission[]>([])
  const [totalVotes, setTotalVotes] = useState(0)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!roundId) return

    const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000', {
      transports: ['websocket', 'polling'],
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      socket.emit('join:round', roundId)
    })

    socket.on('disconnect', () => setConnected(false))

    socket.on('vote:update', (update: VoteUpdate) => {
      setSubmissions(prev =>
        prev.map(s =>
          s.id === update.submissionId
            ? { ...s, voteCount: update.newCount }
            : s
        )
      )
      setTotalVotes(update.totalVotes)
    })

    socket.on('round:submissions', (data: { submissions: DemoSubmission[]; totalVotes: number }) => {
      setSubmissions(data.submissions)
      setTotalVotes(data.totalVotes)
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [roundId])

  const emitVote = useCallback((submissionId: string) => {
    socketRef.current?.emit('vote:cast', { roundId, submissionId })
  }, [roundId])

  return { submissions, totalVotes, connected, emitVote, setSubmissions, setTotalVotes }
}
