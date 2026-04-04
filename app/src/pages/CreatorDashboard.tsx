import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { Plus, ArrowRight, Lock, Eye } from 'lucide-react'
import { DEMO_PIECE, DEMO_ACTIVE_ROUND } from '@/utils/demo-data'
import RoundTimer from '@/components/RoundTimer'
import { clsx } from 'clsx'

export default function CreatorDashboard() {
  const { publicKey } = useWallet()
  const [activeTab, setActiveTab] = useState<'pieces' | 'subscribers'>('pieces')

  if (!publicKey) {
    return (
      <main className="min-h-screen pt-20 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <p className="font-serif text-2xl text-parchment/80 mb-3">Your dashboard</p>
          <p className="text-parchment/40 text-sm mb-8 leading-relaxed">
            Connect your wallet to manage your pieces, see who's reading, and open new rounds.
          </p>
          <WalletMultiButton />
        </div>
      </main>
    )
  }

  const walletShort = `${publicKey.toString().slice(0, 4)}…${publicKey.toString().slice(-4)}`

  return (
    <main className="min-h-screen pt-20 pb-24">
      <div className="max-w-3xl mx-auto px-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-10 mb-10 border-b border-parchment/8 pb-8 flex items-end justify-between"
        >
          <div>
            <p className="text-xs text-parchment/30 mb-1.5 font-mono">{walletShort}</p>
            <h1 className="font-serif text-4xl text-parchment">Your pieces</h1>
          </div>
          <Link to="/new">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 bg-gold/10 border border-gold/30 text-gold px-5 py-2.5 rounded-full text-sm font-medium hover:bg-gold/20 transition-all"
            >
              <Plus size={14} />
              New piece
            </motion.button>
          </Link>
        </motion.div>

        {/* Tabs */}
        <div className="flex items-center gap-6 mb-8 text-sm">
          {(['pieces', 'subscribers'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                'pb-1 border-b transition-all duration-200',
                activeTab === tab
                  ? 'border-parchment/60 text-parchment'
                  : 'border-transparent text-parchment/35 hover:text-parchment/55'
              )}
            >
              {tab === 'pieces' ? 'Pieces' : 'Subscribers'}
            </button>
          ))}
        </div>

        {activeTab === 'pieces' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-5"
          >
            <PieceManageCard piece={DEMO_PIECE} activeRound={DEMO_ACTIVE_ROUND} />

            {/* Start another */}
            <Link to="/new">
              <div className="py-8 border border-dashed border-parchment/10 rounded-2xl text-center hover:border-parchment/20 transition-colors cursor-pointer group">
                <Plus size={16} className="mx-auto text-parchment/20 group-hover:text-parchment/40 mb-2 transition-colors" />
                <p className="text-sm text-parchment/25 group-hover:text-parchment/40 transition-colors">
                  Start another story
                </p>
              </div>
            </Link>
          </motion.div>
        )}

        {activeTab === 'subscribers' && <SubscribersPanel />}
      </div>
    </main>
  )
}

function PieceManageCard({
  piece,
  activeRound,
}: {
  piece: typeof DEMO_PIECE
  activeRound: typeof DEMO_ACTIVE_ROUND
}) {
  const [showNote, setShowNote] = useState(false)
  const [note, setNote] = useState('')

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-parchment/10 rounded-2xl overflow-hidden hover:border-parchment/15 transition-colors"
    >
      {/* Piece header */}
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="live-dot scale-75" />
              <span className="text-xs text-green-400/70">Active · Round {activeRound.roundIndex + 1}</span>
            </div>
            <h3 className="font-serif text-xl text-parchment leading-snug">{piece.title}</h3>
          </div>
          <Link to={`/piece/${piece.id}`}>
            <button className="p-2 rounded-lg text-parchment/30 hover:text-parchment/60 hover:bg-parchment/5 transition-all">
              <Eye size={15} />
            </button>
          </Link>
        </div>

        <div className="flex items-center gap-4 text-xs text-parchment/30">
          <span>{piece.paragraphCount} parts sealed</span>
          <span>·</span>
          <span>{piece.roundCount} rounds done</span>
        </div>
      </div>

      {/* Active round stats */}
      <div className="px-6 py-4 border-t border-parchment/6 bg-parchment/[0.015]">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-parchment/40">Round {activeRound.roundIndex + 1} — {activeRound.status}</p>
          <RoundTimer deadline={activeRound.votingDeadline} label="closes" />
        </div>
        <div className="flex items-center gap-8 text-sm">
          <div>
            <p className="text-lg font-mono font-medium text-parchment">{activeRound.submissionCount}</p>
            <p className="text-xs text-parchment/35 mt-0.5">directions submitted</p>
          </div>
          <div>
            <p className="text-lg font-mono font-medium text-parchment">{activeRound.totalVotes.toLocaleString()}</p>
            <p className="text-xs text-parchment/35 mt-0.5">votes cast</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-4 border-t border-parchment/6 flex items-center gap-3 flex-wrap">
        <Link to={`/piece/${piece.id}/creator-round/${activeRound.roundIndex}`}>
          <button className="flex items-center gap-1.5 text-sm text-gold/70 hover:text-gold transition-colors">
            See live votes
            <ArrowRight size={13} />
          </button>
        </Link>
        <span className="text-parchment/15">·</span>
        <button
          onClick={() => setShowNote(!showNote)}
          className="text-sm text-parchment/35 hover:text-parchment/60 transition-colors"
        >
          {showNote ? 'Cancel' : 'Add creator note'}
        </button>
      </div>

      {showNote && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="px-6 pb-5 border-t border-parchment/6"
        >
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Guide the community without overriding them…"
            rows={3}
            className="w-full mt-4 bg-transparent border border-parchment/12 rounded-xl p-3.5 text-sm text-parchment/80 placeholder:text-parchment/20 focus:outline-none focus:border-parchment/25 resize-none transition-colors font-serif italic"
          />
          <button className="mt-2 text-xs text-gold/50 hover:text-gold/80 transition-colors">
            Post note on-chain →
          </button>
        </motion.div>
      )}
    </motion.div>
  )
}

function SubscribersPanel() {
  const [walletInput, setWalletInput] = useState('')
  const [tier, setTier] = useState<'Community' | 'Reader'>('Community')

  const DEMO_SUBSCRIBERS = [
    { wallet: '3kMn...7pQs', handle: '@devsmith_codes', tier: 'Community' as const },
    { wallet: '7rTv...2nBw', handle: '@maya_writes', tier: 'Community' as const },
    { wallet: '2wXq...5mRo', handle: '@storyhunter_em', tier: 'Community' as const },
    { wallet: '5pNm...8kLj', handle: '@techwriter_ravi', tier: 'Community' as const },
    { wallet: '9cYs...3vPt', handle: '@inkandcode', tier: 'Community' as const },
  ]

  const TIER_LABELS = {
    Community: 'Community',
    Reader: 'Reader',
  }

  const TIER_COLORS = {
    Community: 'text-sky-400/60',
    Reader: 'text-parchment/30',
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Add */}
      <div className="border border-parchment/10 rounded-2xl p-5">
        <p className="text-sm text-parchment/50 mb-4">Add a subscriber</p>
        <div className="flex gap-3 flex-wrap">
          <input
            type="text"
            value={walletInput}
            onChange={e => setWalletInput(e.target.value)}
            placeholder="Wallet address"
            className="flex-1 min-w-48 bg-transparent border border-parchment/12 rounded-xl px-4 py-2.5 text-sm text-parchment/80 placeholder:text-parchment/20 focus:outline-none focus:border-parchment/25 font-mono transition-colors"
          />
          <select
            value={tier}
            onChange={e => setTier(e.target.value as typeof tier)}
            className="bg-transparent border border-parchment/12 rounded-xl px-4 py-2.5 text-sm text-parchment/60 focus:outline-none focus:border-parchment/25 transition-colors"
          >
            <option value="Community">Community — submit + vote</option>
            <option value="Reader">Reader — read only</option>
          </select>
          <button className="border border-gold/25 text-gold/70 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gold/8 hover:text-gold hover:border-gold/40 transition-all">
            Add
          </button>
        </div>
      </div>

      {/* List */}
      <div className="border border-parchment/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-parchment/6">
          <p className="text-xs text-parchment/35">{DEMO_SUBSCRIBERS.length} subscribers</p>
        </div>
        <div className="divide-y divide-parchment/5">
          {DEMO_SUBSCRIBERS.map((sub, i) => (
            <div key={i} className="px-5 py-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {/* Avatar initial */}
                <div className="w-8 h-8 rounded-full bg-parchment/6 border border-parchment/10 flex items-center justify-center text-xs text-parchment/50 font-serif">
                  {sub.handle.slice(1, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm text-parchment/75">{sub.handle}</p>
                  <p className="text-xs text-parchment/25 font-mono">{sub.wallet}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={clsx('text-xs font-medium', TIER_COLORS[sub.tier])}>
                  {TIER_LABELS[sub.tier]}
                </span>
                <button className="text-xs text-parchment/20 hover:text-red-400/60 transition-colors">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
