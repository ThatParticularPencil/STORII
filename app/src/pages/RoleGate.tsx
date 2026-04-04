import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useRole } from '@/context/RoleContext'
import { useNavigate } from 'react-router-dom'
import DotPattern from '@/components/DotPattern'

export default function RoleGate() {
  const { setRole } = useRole()
  const navigate = useNavigate()

  const choose = (r: 'creator' | 'viewer') => {
    setRole(r)
    if (r === 'viewer') navigate('/explore')
    else navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-6 relative overflow-hidden">

      {/* Dot grid */}
      <DotPattern />

      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-[560px]"
      >
        {/* Tagline */}
        <p className="text-label uppercase tracking-[0.08em] text-ink-tertiary mb-10 text-center">
          Stories written by communities, sealed on Solana
        </p>

        {/* Heading */}
        <h1 className="font-mono text-display-md text-ink text-center leading-snug mb-3">
          How do you want to show up?
        </h1>
        <p className="text-sm font-serif text-ink-secondary text-center leading-relaxed mb-12 max-w-sm mx-auto">
          Choose your role. You can switch at any time from the menu.
          Each role is kept separate — creators don't vote, viewers don't publish.
        </p>

        {/* Role cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Viewer */}
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => choose('viewer')}
            className="group relative flex flex-col gap-5 p-8 rounded-[8px] border border-straw bg-paper hover:border-sage hover:bg-sage-light/20 transition-all duration-300 text-left cursor-pointer"
          >
            <div>
              <p className="font-mono font-bold text-xl text-ink group-hover:text-sage-dark transition-colors mb-2">
                I'm a reader
              </p>
              <p className="text-sm font-serif text-ink-secondary leading-relaxed">
                Read live stories, vote on where they go next, shape what gets written.
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-sm text-ink-tertiary group-hover:text-sage transition-colors mt-auto font-mono">
              Go to stories
              <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform duration-150" />
            </div>
          </motion.button>

          {/* Creator */}
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => choose('creator')}
            className="group relative flex flex-col gap-5 p-8 rounded-[8px] border border-straw bg-paper hover:border-seal hover:bg-seal-light/30 transition-all duration-300 text-left cursor-pointer"
          >
            <div>
              <p className="font-mono font-bold text-xl text-ink group-hover:text-seal transition-colors mb-2">
                I'm a writer
              </p>
              <p className="text-sm font-serif text-ink-secondary leading-relaxed">
                Start a piece, open rounds, review the AI script, and publish it on-chain.
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-sm text-ink-tertiary group-hover:text-seal transition-colors mt-auto font-mono">
              Start creating
              <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform duration-150" />
            </div>
          </motion.button>
        </div>

        {/* Footer line */}
        <p className="text-label text-ink-tertiary text-center mt-8 leading-relaxed">
          One role at a time. Creators cannot vote. Viewers cannot publish.
        </p>
      </motion.div>
    </div>
  )
}
