import { motion } from 'framer-motion'
import { PenLine, BookOpen } from 'lucide-react'
import { useRole } from '@/context/RoleContext'
import { useNavigate } from 'react-router-dom'

export default function RoleGate() {
  const { setRole } = useRole()
  const navigate = useNavigate()

  const choose = (r: 'creator' | 'viewer') => {
    setRole(r)
    if (r === 'viewer') navigate('/explore')
    else navigate('/')
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 bg-ink-900">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-gold/[0.05] blur-[140px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative max-w-lg w-full text-center"
      >
        {/* Logo */}
        <div className="mb-10">
          <p className="font-serif text-2xl text-parchment/80 mb-1">Storii</p>
          <p className="text-xs text-parchment/30 tracking-wide">Stories written by communities, sealed on Solana</p>
        </div>

        <h1 className="font-serif text-3xl md:text-4xl text-parchment mb-3 leading-snug">
          How do you want to show up?
        </h1>
        <p className="text-parchment/40 text-sm mb-10 leading-relaxed">
          Choose your role. You can switch at any time from the menu.
          Each role is kept separate — creators don't vote, viewers don't publish.
        </p>

        <div className="grid grid-cols-2 gap-4">
          {/* Viewer */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => choose('viewer')}
            className="group flex flex-col items-center gap-4 p-7 rounded-2xl border border-parchment/10 bg-parchment/[0.02] hover:border-gold/30 hover:bg-gold/[0.04] transition-all duration-200 text-left"
          >
            <div className="w-12 h-12 rounded-full border border-parchment/15 group-hover:border-gold/40 flex items-center justify-center transition-colors">
              <BookOpen size={20} className="text-parchment/40 group-hover:text-gold/70 transition-colors" />
            </div>
            <div>
              <p className="font-serif text-lg text-parchment/80 group-hover:text-parchment mb-1.5 transition-colors">
                I'm a viewer
              </p>
              <p className="text-xs text-parchment/35 leading-relaxed">
                Read live stories, vote on where they go next, shape what gets written.
              </p>
            </div>
            <span className="text-xs text-parchment/20 group-hover:text-gold/50 transition-colors">
              Go to stories →
            </span>
          </motion.button>

          {/* Creator */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => choose('creator')}
            className="group flex flex-col items-center gap-4 p-7 rounded-2xl border border-parchment/10 bg-parchment/[0.02] hover:border-gold/30 hover:bg-gold/[0.04] transition-all duration-200 text-left"
          >
            <div className="w-12 h-12 rounded-full border border-parchment/15 group-hover:border-gold/40 flex items-center justify-center transition-colors">
              <PenLine size={20} className="text-parchment/40 group-hover:text-gold/70 transition-colors" />
            </div>
            <div>
              <p className="font-serif text-lg text-parchment/80 group-hover:text-parchment mb-1.5 transition-colors">
                I'm a creator
              </p>
              <p className="text-xs text-parchment/35 leading-relaxed">
                Start a piece, open rounds, review the AI script, and publish it on-chain.
              </p>
            </div>
            <span className="text-xs text-parchment/20 group-hover:text-gold/50 transition-colors">
              Start creating →
            </span>
          </motion.button>
        </div>

        <p className="text-xs text-parchment/20 mt-8">
          One role at a time. Creators cannot vote. Viewers cannot publish.
        </p>
      </motion.div>
    </main>
  )
}
