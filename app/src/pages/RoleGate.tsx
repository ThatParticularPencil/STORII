import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useRole } from '@/context/RoleContext'
import { useNavigate } from 'react-router-dom'

export default function RoleGate() {
  const { setRole } = useRole()
  const navigate = useNavigate()

  const choose = (r: 'creator' | 'viewer') => {
    setRole(r)
    if (r === 'viewer') navigate('/explore')
    else navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-ink-900 flex flex-col items-center justify-center px-6 relative overflow-hidden">

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full bg-gold/[0.04] blur-[160px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-[560px]"
      >
        {/* Tagline */}
        <p className="text-xs tracking-[0.18em] uppercase text-parchment/25 mb-10 font-sans text-center">
          Stories written by communities, sealed on Solana
        </p>

        {/* Heading */}
        <h1 className="font-serif text-3xl md:text-4xl text-parchment text-center leading-snug mb-3">
          How do you want to show up?
        </h1>
        <p className="text-sm text-parchment/35 text-center leading-relaxed mb-12 max-w-sm mx-auto">
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
            className="group relative flex flex-col gap-5 p-8 rounded-2xl border border-parchment/8 bg-parchment/[0.015] hover:border-parchment/20 hover:bg-parchment/[0.04] transition-all duration-300 text-left cursor-pointer"
          >
            {/* Role label */}
            <div>
              <p className="font-serif text-xl text-parchment/80 group-hover:text-parchment transition-colors mb-2">
                I'm a viewer
              </p>
              <p className="text-sm text-parchment/35 leading-relaxed">
                Read live stories, vote on where they go next, shape what gets written.
              </p>
            </div>

            {/* CTA line */}
            <div className="flex items-center gap-1.5 text-sm text-parchment/25 group-hover:text-parchment/55 transition-colors mt-auto">
              Go to stories
              <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform duration-150" />
            </div>

            {/* Hover border glow */}
            <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-parchment/0 group-hover:ring-parchment/8 transition-all duration-300 pointer-events-none" />
          </motion.button>

          {/* Creator */}
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => choose('creator')}
            className="group relative flex flex-col gap-5 p-8 rounded-2xl border border-parchment/8 bg-parchment/[0.015] hover:border-gold/25 hover:bg-gold/[0.035] transition-all duration-300 text-left cursor-pointer"
          >
            <div>
              <p className="font-serif text-xl text-parchment/80 group-hover:text-parchment transition-colors mb-2">
                I'm a creator
              </p>
              <p className="text-sm text-parchment/35 leading-relaxed">
                Start a piece, open rounds, review the AI script, and publish it on-chain.
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-sm text-parchment/25 group-hover:text-gold/60 transition-colors mt-auto">
              Start creating
              <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform duration-150" />
            </div>

            <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-gold/0 group-hover:ring-gold/10 transition-all duration-300 pointer-events-none" />
          </motion.button>
        </div>

        {/* Footer line */}
        <p className="text-[11px] text-parchment/18 text-center mt-8 leading-relaxed font-sans">
          One role at a time. Creators cannot vote. Viewers cannot publish.
        </p>
      </motion.div>
    </div>
  )
}
