import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import {
  Plus,
  BookOpen,
  Users,
  BarChart2,
  ArrowRight,
  Lock,
  Settings,
  Eye,
  Clock,
} from 'lucide-react'
import { DEMO_PIECE, DEMO_ACTIVE_ROUND } from '@/utils/demo-data'
import RoundTimer from '@/components/RoundTimer'
import { clsx } from 'clsx'

export default function CreatorDashboard() {
  const { publicKey } = useWallet()
  const [activeTab, setActiveTab] = useState<'pieces' | 'subscribers'>('pieces')

  if (!publicKey) {
    return (
      <main className="min-h-screen pt-28 pb-24 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center mx-auto mb-6">
            <Lock size={24} className="text-gold/60" />
          </div>
          <h1 className="font-serif text-3xl text-parchment mb-3">Creator Dashboard</h1>
          <p className="text-parchment/50 mb-8 leading-relaxed">
            Connect your wallet to manage your pieces, open rounds,
            and track your community's writing.
          </p>
          <WalletMultiButton />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen pt-28 pb-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between mb-10"
        >
          <div>
            <div className="text-xs uppercase tracking-widest text-parchment/40 mb-2">Creator</div>
            <h1 className="font-serif text-4xl text-parchment">Dashboard</h1>
            <p className="text-parchment/40 text-sm mt-1">
              {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
            </p>
          </div>
          <Link to="/new">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 bg-gold text-ink-900 font-semibold px-5 py-2.5 rounded-xl hover:bg-gold-light transition-colors text-sm"
            >
              <Plus size={16} />
              New Piece
            </motion.button>
          </Link>
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Active Pieces', value: '1', icon: <BookOpen size={16} /> },
            { label: 'Total Subscribers', value: '847', icon: <Users size={16} /> },
            { label: 'Votes Cast', value: '12,840', icon: <BarChart2 size={16} /> },
            { label: 'Sealed Paragraphs', value: '3', icon: <Lock size={16} /> },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass rounded-2xl p-5"
            >
              <div className="flex items-center gap-2 text-parchment/40 mb-3 text-xs">
                {stat.icon}
                <span>{stat.label}</span>
              </div>
              <div className="font-mono text-2xl font-semibold text-parchment">{stat.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Tab nav */}
        <div className="flex items-center gap-1 mb-8 p-1 bg-ink-50 rounded-xl w-fit">
          {(['pieces', 'subscribers'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                'px-5 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === tab
                  ? 'bg-gold/15 text-gold border border-gold/30'
                  : 'text-parchment/50 hover:text-parchment/70'
              )}
            >
              {tab === 'pieces' ? 'My Pieces' : 'Subscribers'}
            </button>
          ))}
        </div>

        {/* Pieces tab */}
        {activeTab === 'pieces' && (
          <div className="space-y-5">
            <PieceManageCard piece={DEMO_PIECE} activeRound={DEMO_ACTIVE_ROUND} />

            {/* Empty state prompt */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl border border-dashed border-parchment/15 p-10 text-center"
            >
              <div className="text-parchment/30 mb-3 font-serif text-lg">Start another story?</div>
              <Link to="/new">
                <button className="text-sm text-gold/60 hover:text-gold transition-colors flex items-center gap-1.5 mx-auto">
                  <Plus size={14} />
                  Create a new piece
                </button>
              </Link>
            </motion.div>
          </div>
        )}

        {/* Subscribers tab */}
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
  const [showRoundForm, setShowRoundForm] = useState(false)
  const [note, setNote] = useState('')

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl overflow-hidden"
    >
      {/* Piece header */}
      <div className="p-6 border-b border-parchment/8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 text-xs text-green-400">
                <div className="live-dot scale-75" />
                Active
              </span>
              <span className="text-xs text-parchment/30">Round {activeRound.roundIndex + 1} open</span>
            </div>
            <h3 className="font-serif text-xl text-parchment">{piece.title}</h3>
            <p className="text-xs text-parchment/40 mt-1">
              {piece.paragraphCount} sealed · {piece.roundCount} rounds completed
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to={`/piece/${piece.id}`}>
              <button className="p-2 rounded-lg border border-parchment/15 text-parchment/40 hover:text-parchment/70 hover:border-parchment/30 transition-all">
                <Eye size={15} />
              </button>
            </Link>
            <button className="p-2 rounded-lg border border-parchment/15 text-parchment/40 hover:text-parchment/70 hover:border-parchment/30 transition-all">
              <Settings size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Active round info */}
      <div className="p-6 border-b border-parchment/8 bg-green-400/[0.02]">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs uppercase tracking-widest text-parchment/40">
            Round {activeRound.roundIndex + 1} — {activeRound.status}
          </div>
          <RoundTimer
            deadline={activeRound.votingDeadline}
            label="Voting closes"
          />
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xl font-mono font-semibold text-parchment">
              {activeRound.submissionCount}
            </div>
            <div className="text-xs text-parchment/40">Submissions</div>
          </div>
          <div>
            <div className="text-xl font-mono font-semibold text-parchment">
              {activeRound.totalVotes.toLocaleString()}
            </div>
            <div className="text-xs text-parchment/40">Votes cast</div>
          </div>
          <div>
            <div className="text-xl font-mono font-semibold text-gold">
              {Math.round((Date.now() - activeRound.submissionDeadline) / 60000)}m
            </div>
            <div className="text-xs text-parchment/40">Since voting opened</div>
          </div>
        </div>
      </div>

      {/* Creator actions */}
      <div className="p-6">
        <div className="flex items-center gap-3 flex-wrap">
          <Link to={`/piece/${piece.id}/round/${activeRound.roundIndex}`}>
            <button className="flex items-center gap-2 bg-gold/10 border border-gold/25 text-gold px-4 py-2 rounded-lg text-sm font-medium hover:bg-gold/20 transition-all">
              <BarChart2 size={14} />
              View Live Votes
            </button>
          </Link>

          <button
            onClick={() => setShowRoundForm(!showRoundForm)}
            className="flex items-center gap-2 border border-parchment/15 text-parchment/60 px-4 py-2 rounded-lg text-sm hover:border-parchment/30 hover:text-parchment/80 transition-all"
          >
            <Clock size={14} />
            Add Creator Note
          </button>

          <button className="flex items-center gap-2 border border-parchment/15 text-parchment/60 px-4 py-2 rounded-lg text-sm hover:border-parchment/30 hover:text-parchment/80 transition-all">
            <Plus size={14} />
            Open Next Round
          </button>
        </div>

        {showRoundForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4"
          >
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Guide the story without overriding the community... e.g. 'Remember the protagonist hasn't revealed their secret yet.'"
              rows={3}
              className="w-full bg-ink-50/50 border border-parchment/15 rounded-lg p-3 text-sm text-parchment placeholder:text-parchment/25 focus:outline-none focus:border-gold/30 resize-none transition-colors"
            />
            <button className="mt-2 text-sm text-gold/70 hover:text-gold transition-colors">
              Post note on-chain →
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

function SubscribersPanel() {
  const [walletInput, setWalletInput] = useState('')
  const [tier, setTier] = useState<'InnerCircle' | 'Community' | 'Reader'>('Community')

  const DEMO_SUBSCRIBERS = [
    { wallet: '3kMn...7pQs', handle: '@devsmith_codes', tier: 'InnerCircle', tokens: 1 },
    { wallet: '7rTv...2nBw', handle: '@maya_writes', tier: 'InnerCircle', tokens: 1 },
    { wallet: '2wXq...5mRo', handle: '@storyhunter_em', tier: 'Community', tokens: 3 },
    { wallet: '5pNm...8kLj', handle: '@techwriter_ravi', tier: 'Community', tokens: 3 },
    { wallet: '9cYs...3vPt', handle: '@inkandcode', tier: 'InnerCircle', tokens: 0 },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Add subscriber */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-sm font-medium text-parchment/60 uppercase tracking-wider mb-4">
          Add Subscriber
        </h3>
        <div className="flex gap-3 flex-wrap">
          <input
            type="text"
            value={walletInput}
            onChange={e => setWalletInput(e.target.value)}
            placeholder="Wallet address (Base58)"
            className="flex-1 min-w-64 bg-ink-50/50 border border-parchment/15 rounded-lg px-4 py-2.5 text-sm text-parchment placeholder:text-parchment/25 focus:outline-none focus:border-gold/40 font-mono"
          />
          <select
            value={tier}
            onChange={e => setTier(e.target.value as typeof tier)}
            className="bg-ink-50/50 border border-parchment/15 rounded-lg px-4 py-2.5 text-sm text-parchment focus:outline-none focus:border-gold/40"
          >
            <option value="InnerCircle">Inner Circle (Submit + Vote)</option>
            <option value="Community">Community (Vote only)</option>
            <option value="Reader">Reader (Read only)</option>
          </select>
          <button className="bg-gold/15 border border-gold/30 text-gold px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gold/25 transition-all">
            Add
          </button>
        </div>
      </div>

      {/* Subscriber list */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-parchment/8 flex items-center justify-between">
          <span className="text-sm font-medium text-parchment/60">
            {DEMO_SUBSCRIBERS.length} subscribers
          </span>
          <button className="text-xs text-gold/50 hover:text-gold transition-colors">
            Issue tokens to all →
          </button>
        </div>
        <div className="divide-y divide-parchment/5">
          {DEMO_SUBSCRIBERS.map((sub, i) => (
            <div key={i} className="px-6 py-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-parchment/5 border border-parchment/10 flex items-center justify-center text-xs text-parchment/40 font-mono">
                  {sub.handle.slice(1, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm text-parchment/80">{sub.handle}</div>
                  <div className="text-xs text-parchment/35 font-mono">{sub.wallet}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <TierBadge tier={sub.tier} />
                <span className="text-xs text-parchment/30 font-mono">
                  {sub.tokens} token{sub.tokens !== 1 ? 's' : ''}
                </span>
                <button className="text-xs text-parchment/30 hover:text-red-400 transition-colors">
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

function TierBadge({ tier }: { tier: string }) {
  const styles: Record<string, string> = {
    InnerCircle: 'text-gold border-gold/30 bg-gold/8',
    Community: 'text-sky-400 border-sky-400/30 bg-sky-400/8',
    Reader: 'text-parchment/40 border-parchment/15 bg-parchment/5',
  }
  return (
    <span className={clsx('text-xs border rounded-full px-2 py-0.5', styles[tier] || styles.Reader)}>
      {tier === 'InnerCircle' ? 'Inner Circle' : tier}
    </span>
  )
}
