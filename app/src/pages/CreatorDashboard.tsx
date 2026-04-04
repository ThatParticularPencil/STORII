import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { Plus, ArrowRight, Eye } from 'lucide-react'
import { DEMO_PIECE, DEMO_ACTIVE_ROUND } from '@/utils/demo-data'
import RoundTimer from '@/components/RoundTimer'
import DotPattern from '@/components/DotPattern'
import { clsx } from 'clsx'

export default function CreatorDashboard() {
  const { publicKey } = useWallet()
  const [activeTab, setActiveTab] = useState<'pieces' | 'subscribers'>('pieces')

  if (!publicKey) {
    return (
      <main className="min-h-screen pt-20 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <p className="font-mono font-bold text-2xl text-ink mb-3">Your dashboard</p>
          <p className="text-ink-secondary text-sm mb-8 leading-relaxed font-serif">
            Connect your wallet to manage your pieces, see who's reading, and open new rounds.
          </p>
          <WalletMultiButton />
        </div>
      </main>
    )
  }

  const walletShort = `${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}`

  return (
    <main className="min-h-screen pt-20 pb-24 relative">
      <DotPattern />
      <div className="max-w-3xl mx-auto px-6 relative z-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-10 mb-10 border-b border-straw pb-8 flex items-end justify-between"
        >
          <div>
            <p className="text-label uppercase tracking-[0.08em] text-ink-tertiary mb-1.5">{walletShort}</p>
            <h1 className="font-mono text-display-md text-ink">Your Stories</h1>
          </div>
          <Link to="/new">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 bg-sage text-white px-5 py-2.5 rounded-[8px] text-sm font-mono font-bold hover:bg-sage-dark transition-all"
            >
              <Plus size={14} />
              New piece
            </motion.button>
          </Link>
        </motion.div>

        {/* Tabs */}
        <div className="flex items-center gap-6 mb-8 text-sm font-mono">
          {(['pieces', 'subscribers'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                'pb-1 border-b-2 transition-all duration-200',
                activeTab === tab
                  ? 'border-sage text-ink'
                  : 'border-transparent text-ink-tertiary hover:text-ink-secondary'
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
              <div className="py-8 border border-dashed border-straw rounded-[8px] text-center hover:border-sage transition-colors cursor-pointer group">
                <Plus size={16} className="mx-auto text-ink-tertiary group-hover:text-sage mb-2 transition-colors" />
                <p className="text-sm text-ink-tertiary group-hover:text-sage transition-colors font-mono">
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
      className="border border-straw rounded-[8px] overflow-hidden bg-paper hover:border-ink-tertiary/40 transition-colors"
    >
      {/* Piece header */}
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="live-dot scale-75" />
              <span className="text-label uppercase tracking-[0.08em] text-sage font-bold">Active · Round {activeRound.roundIndex + 1}</span>
            </div>
            <h3 className="font-mono font-bold text-xl text-ink leading-snug">{piece.title}</h3>
          </div>
          <Link to={`/piece/${piece.id}`}>
            <button className="p-2 rounded-[8px] text-ink-tertiary hover:text-ink hover:bg-parchment transition-all">
              <Eye size={15} />
            </button>
          </Link>
        </div>

        <div className="flex items-center gap-4 text-xs text-ink-tertiary font-mono">
          <span>{piece.paragraphCount} parts sealed</span>
          <span>·</span>
          <span>{piece.roundCount} rounds done</span>
        </div>
      </div>

      {/* Active round stats */}
      <div className="px-6 py-4 border-t border-straw bg-parchment/30">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-ink-secondary font-mono">Round {activeRound.roundIndex + 1} — {activeRound.status}</p>
          <RoundTimer deadline={activeRound.votingDeadline} label="closes" />
        </div>
        <div className="flex items-center gap-8 text-sm">
          <div>
            <p className="text-lg font-mono font-bold text-ink">{activeRound.submissionCount}</p>
            <p className="text-xs text-ink-tertiary mt-0.5">directions submitted</p>
          </div>
          <div>
            <p className="text-lg font-mono font-bold text-ink">{activeRound.totalVotes.toLocaleString()}</p>
            <p className="text-xs text-ink-tertiary mt-0.5">votes cast</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-4 border-t border-straw flex items-center gap-3 flex-wrap">
        <Link to={`/piece/${piece.id}/creator-round/${activeRound.roundIndex}`}>
          <button className="flex items-center gap-1.5 text-sm text-sage-dark hover:text-sage transition-colors font-mono font-bold">
            See live votes
            <ArrowRight size={13} />
          </button>
        </Link>
        <span className="text-straw">·</span>
        <button
          onClick={() => setShowNote(!showNote)}
          className="text-sm text-ink-tertiary hover:text-ink-secondary transition-colors font-mono"
        >
          {showNote ? 'Cancel' : 'Add creator note'}
        </button>
      </div>

      {showNote && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="px-6 pb-5 border-t border-straw"
        >
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Guide the community without overriding them..."
            rows={3}
            className="w-full mt-4 bg-canvas border border-straw rounded-[8px] p-3.5 text-sm text-ink placeholder:text-ink-tertiary focus:outline-none focus:border-sage resize-none transition-colors font-serif italic"
          />
          <button className="mt-2 text-xs text-sage-dark hover:text-sage transition-colors font-mono font-bold">
            Post note on-chain →
          </button>
        </motion.div>
      )}
    </motion.div>
  )
}

function SubscribersPanel() {
  const [walletInput, setWalletInput] = useState('')
  const [tier, setTier] = useState<'InnerCircle' | 'Community' | 'Reader'>('Community')

  const DEMO_SUBSCRIBERS = [
    { wallet: '3kMn...7pQs', handle: '@devsmith_codes', tier: 'InnerCircle' as const },
    { wallet: '7rTv...2nBw', handle: '@maya_writes', tier: 'InnerCircle' as const },
    { wallet: '2wXq...5mRo', handle: '@storyhunter_em', tier: 'Community' as const },
    { wallet: '5pNm...8kLj', handle: '@techwriter_ravi', tier: 'Community' as const },
    { wallet: '9cYs...3vPt', handle: '@inkandcode', tier: 'InnerCircle' as const },
  ]

  const TIER_LABELS = {
    InnerCircle: 'Inner Circle',
    Community: 'Community',
    Reader: 'Reader',
  }

  const TIER_COLORS = {
    InnerCircle: 'text-seal',
    Community: 'text-sage',
    Reader: 'text-ink-tertiary',
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Add */}
      <div className="border border-straw rounded-[8px] p-5 bg-paper">
        <p className="text-sm text-ink-secondary mb-4 font-mono">Add a subscriber</p>
        <div className="flex gap-3 flex-wrap">
          <input
            type="text"
            value={walletInput}
            onChange={e => setWalletInput(e.target.value)}
            placeholder="Wallet address"
            className="flex-1 min-w-48 bg-canvas border border-straw rounded-[8px] px-4 py-2.5 text-sm text-ink placeholder:text-ink-tertiary focus:outline-none focus:border-sage font-mono transition-colors"
          />
          <select
            value={tier}
            onChange={e => setTier(e.target.value as typeof tier)}
            className="bg-canvas border border-straw rounded-[8px] px-4 py-2.5 text-sm text-ink-secondary focus:outline-none focus:border-sage transition-colors font-mono"
          >
            <option value="InnerCircle">Inner Circle — submit + vote</option>
            <option value="Community">Community — vote only</option>
            <option value="Reader">Reader — read only</option>
          </select>
          <button className="border border-sage text-sage px-5 py-2.5 rounded-[8px] text-sm font-mono font-bold hover:bg-sage hover:text-white transition-all">
            Add
          </button>
        </div>
      </div>

      {/* List */}
      <div className="border border-straw rounded-[8px] overflow-hidden bg-paper">
        <div className="px-5 py-3.5 border-b border-straw">
          <p className="text-label uppercase tracking-[0.08em] text-ink-tertiary">{DEMO_SUBSCRIBERS.length} subscribers</p>
        </div>
        <div className="divide-y divide-straw/50">
          {DEMO_SUBSCRIBERS.map((sub, i) => (
            <div key={i} className="px-5 py-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-parchment border border-straw flex items-center justify-center text-xs text-ink-secondary font-mono font-bold">
                  {sub.handle.slice(1, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm text-ink">{sub.handle}</p>
                  <p className="text-xs text-ink-tertiary font-mono">{sub.wallet}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={clsx('text-xs font-mono font-bold', TIER_COLORS[sub.tier])}>
                  {TIER_LABELS[sub.tier]}
                </span>
                <button className="text-xs text-ink-tertiary hover:text-red-500 transition-colors font-mono">
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
