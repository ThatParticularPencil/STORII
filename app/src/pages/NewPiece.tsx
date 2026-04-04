import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { ArrowRight, CheckCircle2, Lock, AlertCircle } from 'lucide-react'
import { clsx } from 'clsx'

type Step = 'title' | 'opening' | 'settings' | 'confirm' | 'done'

const STEP_ORDER: Step[] = ['title', 'opening', 'settings', 'confirm', 'done']

export default function NewPiece() {
  const navigate = useNavigate()
  const { publicKey } = useWallet()
  const [step, setStep] = useState<Step>('title')
  const [title, setTitle] = useState('')
  const [opening, setOpening] = useState('')
  const [submissionHours, setSubmissionHours] = useState(24)
  const [votingHours, setVotingHours] = useState(24)
  const [maxSubmissions, setMaxSubmissions] = useState(20)
  const [submitting, setSubmitting] = useState(false)

  const stepIndex = STEP_ORDER.indexOf(step)

  const goNext = async () => {
    if (step === 'confirm') {
      setSubmitting(true)
      await new Promise(r => setTimeout(r, 2200))
      setSubmitting(false)
      setStep('done')
      return
    }
    setStep(STEP_ORDER[stepIndex + 1])
  }

  const goBack = () => {
    if (stepIndex > 0 && step !== 'done') setStep(STEP_ORDER[stepIndex - 1])
  }

  if (!publicKey) {
    return (
      <main className="min-h-screen pt-28 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <h1 className="font-serif text-3xl text-parchment mb-3">Start a Piece</h1>
          <p className="text-parchment/50 mb-8">Connect your wallet to create a new collaborative piece.</p>
          <WalletMultiButton />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen pt-28 pb-24 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-10">
          {['Title', 'Opening', 'Settings', 'Confirm'].map((label, i) => {
            const s = STEP_ORDER[i]
            const done = stepIndex > i
            const active = stepIndex === i
            return (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={clsx(
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all',
                    done
                      ? 'bg-gold/20 border border-gold/40 text-gold'
                      : active
                      ? 'bg-gold text-ink-900'
                      : 'bg-parchment/5 border border-parchment/15 text-parchment/30'
                  )}
                >
                  {done ? <CheckCircle2 size={14} /> : i + 1}
                </div>
                <span
                  className={clsx(
                    'text-xs',
                    active ? 'text-parchment' : 'text-parchment/35'
                  )}
                >
                  {label}
                </span>
                {i < 3 && (
                  <div className={clsx('w-8 h-px', done ? 'bg-gold/30' : 'bg-parchment/10')} />
                )}
              </div>
            )
          })}
        </div>

        <AnimatePresence mode="wait">
          {/* Step: Title */}
          {step === 'title' && (
            <StepWrapper key="title">
              <StepHeading
                eyebrow="Step 1"
                title="What's the first line?"
                description="This becomes the title and the hook that draws contributors in."
              />
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="It was the night before the product launch…"
                maxLength={128}
                className="w-full bg-ink-50/50 border border-parchment/15 rounded-xl px-5 py-4 font-serif text-xl text-parchment placeholder:text-parchment/20 focus:outline-none focus:border-gold/40 mb-2 transition-colors"
                autoFocus
              />
              <div className="text-xs text-parchment/30 text-right mb-8">
                {title.length} / 128
              </div>
              <StepButton onClick={goNext} disabled={title.trim().length < 5}>
                Continue
              </StepButton>
            </StepWrapper>
          )}

          {/* Step: Opening paragraph */}
          {step === 'opening' && (
            <StepWrapper key="opening">
              <StepHeading
                eyebrow="Step 2"
                title="Write the opening paragraph"
                description="Set the tone, introduce the world or situation. This is the only paragraph that is yours alone — everything after will be written by your community."
              />
              <textarea
                value={opening}
                onChange={e => setOpening(e.target.value)}
                placeholder="Write the first paragraph of your piece…"
                rows={7}
                className="w-full bg-ink-50/50 border border-parchment/15 rounded-xl px-5 py-4 font-serif text-lg text-parchment leading-8 placeholder:text-parchment/20 focus:outline-none focus:border-gold/40 resize-none mb-3 transition-colors"
                autoFocus
              />
              <div className="flex justify-between text-xs text-parchment/30 mb-8">
                <span>{opening.trim().split(/\s+/).filter(Boolean).length} words</span>
                <span>Will be hashed and stored on Arweave</span>
              </div>
              <div className="flex gap-3">
                <button onClick={goBack} className="px-5 py-3 rounded-xl border border-parchment/15 text-parchment/50 hover:text-parchment/70 transition-all text-sm">
                  Back
                </button>
                <StepButton onClick={goNext} disabled={opening.trim().split(/\s+/).filter(Boolean).length < 20} className="flex-1">
                  Continue
                </StepButton>
              </div>
            </StepWrapper>
          )}

          {/* Step: Round settings */}
          {step === 'settings' && (
            <StepWrapper key="settings">
              <StepHeading
                eyebrow="Step 3"
                title="Round settings"
                description="Configure the default duration and limits for each writing round."
              />
              <div className="space-y-5 mb-8">
                <SettingInput
                  label="Submission window"
                  value={submissionHours}
                  onChange={setSubmissionHours}
                  unit="hours"
                  min={1}
                  max={168}
                  hint="How long contributors have to submit their paragraph"
                />
                <SettingInput
                  label="Voting window"
                  value={votingHours}
                  onChange={setVotingHours}
                  unit="hours"
                  min={1}
                  max={168}
                  hint="How long the community has to vote after submissions close"
                />
                <SettingInput
                  label="Max submissions per round"
                  value={maxSubmissions}
                  onChange={setMaxSubmissions}
                  unit="submissions"
                  min={2}
                  max={100}
                  hint="Limits quality by keeping the vote readable"
                />
              </div>
              <div className="flex gap-3">
                <button onClick={goBack} className="px-5 py-3 rounded-xl border border-parchment/15 text-parchment/50 hover:text-parchment/70 transition-all text-sm">
                  Back
                </button>
                <StepButton onClick={goNext} className="flex-1">
                  Continue
                </StepButton>
              </div>
            </StepWrapper>
          )}

          {/* Step: Confirm */}
          {step === 'confirm' && (
            <StepWrapper key="confirm">
              <StepHeading
                eyebrow="Step 4"
                title="Ready to create"
                description="This will send two transactions — one to create the piece account, one to store the opening paragraph hash on Solana."
              />
              <div className="rounded-2xl bg-parchment/3 border border-parchment/10 p-6 mb-6 space-y-4">
                <ConfirmRow label="Title" value={title} />
                <ConfirmRow label="Opening" value={`${opening.trim().split(/\s+/).filter(Boolean).length} words`} />
                <ConfirmRow label="Submission window" value={`${submissionHours}h per round`} />
                <ConfirmRow label="Voting window" value={`${votingHours}h per round`} />
                <ConfirmRow label="Max submissions" value={`${maxSubmissions} per round`} />
                <ConfirmRow label="Network" value="Solana Devnet" />
              </div>

              <div className="flex items-start gap-2 p-3 rounded-lg bg-gold/5 border border-gold/15 mb-6">
                <AlertCircle size={14} className="text-gold/60 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-parchment/50">
                  Estimated gas: ~0.003 SOL. The opening paragraph text will be
                  uploaded to Arweave before the transaction is signed.
                </p>
              </div>

              <div className="flex gap-3">
                <button onClick={goBack} className="px-5 py-3 rounded-xl border border-parchment/15 text-parchment/50 hover:text-parchment/70 transition-all text-sm">
                  Back
                </button>
                <motion.button
                  onClick={goNext}
                  disabled={submitting}
                  whileHover={{ scale: submitting ? 1 : 1.02 }}
                  whileTap={{ scale: submitting ? 1 : 0.98 }}
                  className={clsx(
                    'flex-1 flex items-center justify-center gap-3 py-4 rounded-xl font-semibold text-base transition-all',
                    'bg-gold text-ink-900 hover:bg-gold-light'
                  )}
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-ink-900/30 border-t-ink-900 rounded-full animate-spin" />
                      Creating piece on Solana…
                    </>
                  ) : (
                    <>
                      <Lock size={18} />
                      Create Piece
                    </>
                  )}
                </motion.button>
              </div>
            </StepWrapper>
          )}

          {/* Step: Done */}
          {step === 'done' && (
            <StepWrapper key="done">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 180, damping: 14 }}
                className="text-center py-8"
              >
                <div className="inline-flex w-20 h-20 rounded-full bg-gold/10 border-2 border-gold/40 items-center justify-center mb-6 animate-seal-stamp">
                  <CheckCircle2 size={32} className="text-gold" />
                </div>
                <h2 className="font-serif text-3xl text-parchment mb-3">
                  Piece created.
                </h2>
                <p className="text-parchment/50 mb-2 max-w-sm mx-auto">
                  Your opening paragraph is now sealed on Solana.
                  Invite your Inner Circle to begin the first round.
                </p>
                <div className="text-xs font-mono text-gold/40 mb-8">
                  Opening paragraph hash written to Solana Devnet
                </div>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="px-6 py-3 rounded-xl border border-parchment/20 text-parchment/70 hover:border-parchment/40 text-sm transition-all"
                  >
                    Go to Dashboard
                  </button>
                  <button
                    onClick={() => navigate('/piece/demo-piece-new')}
                    className="flex items-center gap-2 bg-gold/15 border border-gold/30 text-gold px-6 py-3 rounded-xl text-sm hover:bg-gold/25 transition-all"
                  >
                    View Piece
                    <ArrowRight size={14} />
                  </button>
                </div>
              </motion.div>
            </StepWrapper>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StepWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.div>
  )
}

function StepHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div className="mb-8">
      <div className="text-xs uppercase tracking-widest text-gold/50 mb-2">{eyebrow}</div>
      <h2 className="font-serif text-3xl text-parchment mb-2">{title}</h2>
      <p className="text-parchment/50 leading-relaxed">{description}</p>
    </div>
  )
}

function StepButton({
  onClick,
  disabled,
  children,
  className = '',
}: {
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={clsx(
        'flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all',
        disabled
          ? 'bg-parchment/8 text-parchment/30 cursor-not-allowed'
          : 'bg-gold text-ink-900 hover:bg-gold-light',
        className
      )}
    >
      {children}
      {!disabled && <ArrowRight size={16} />}
    </motion.button>
  )
}

function SettingInput({
  label,
  value,
  onChange,
  unit,
  min,
  max,
  hint,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  unit: string
  min: number
  max: number
  hint: string
}) {
  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium text-parchment/80">{label}</label>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onChange(Math.max(min, value - 1))}
            className="w-6 h-6 rounded border border-parchment/20 text-parchment/50 hover:text-parchment flex items-center justify-center text-sm"
          >
            −
          </button>
          <span className="font-mono text-gold min-w-[3ch] text-center">{value}</span>
          <button
            onClick={() => onChange(Math.min(max, value + 1))}
            className="w-6 h-6 rounded border border-parchment/20 text-parchment/50 hover:text-parchment flex items-center justify-center text-sm"
          >
            +
          </button>
          <span className="text-xs text-parchment/40">{unit}</span>
        </div>
      </div>
      <p className="text-xs text-parchment/35">{hint}</p>
    </div>
  )
}

function ConfirmRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-parchment/40 flex-shrink-0 mt-0.5">{label}</span>
      <span className="text-sm text-parchment/80 text-right">{value}</span>
    </div>
  )
}
