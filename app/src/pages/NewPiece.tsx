import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { ArrowRight, CheckCircle2, Lock, AlertCircle, Users, Sparkles, BookOpen } from 'lucide-react'
import { clsx } from 'clsx'
import { sendSolPayment } from '@/utils/solana'
import DotPattern from '@/components/DotPattern'

export const MAX_PARAGRAPHS = 8

type Step = 'title' | 'settings' | 'confirm' | 'done'
const STEP_ORDER: Step[] = ['title', 'settings', 'confirm', 'done']

export default function NewPiece() {
  const navigate = useNavigate()
  const wallet = useWallet()
  const { publicKey } = wallet
  const { connection } = useConnection()

  const [step, setStep] = useState<Step>('title')
  const [title, setTitle] = useState('')
  const [submissionHours, setSubmissionHours] = useState(24)
  const [votingHours, setVotingHours] = useState(24)
  const [maxSubmissions, setMaxSubmissions] = useState(20)
  const [submitting, setSubmitting] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)

  const stepIndex = STEP_ORDER.indexOf(step)

  const goNext = async () => {
    if (step === 'confirm') {
      setSubmitting(true)
      setPayError(null)

      try {
        await sendSolPayment(connection, wallet, 0.1)
      } catch (err: any) {
        setPayError(err?.message?.includes('rejected') || err?.message?.includes('cancel')
          ? 'Transaction cancelled.'
          : 'Transaction failed — check your SOL balance and try again.')
        setSubmitting(false)
        return
      }

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
          <div className="w-14 h-14 rounded-full bg-sage-light border border-sage/30 flex items-center justify-center mx-auto mb-5">
            <Lock size={22} className="text-sage" />
          </div>
          <h1 className="font-mono font-bold text-3xl text-ink mb-3">Creators only</h1>
          <p className="text-ink-secondary mb-8 text-sm leading-relaxed font-serif">
            Connect your Phantom or Solflare wallet to start a new piece.
            Only wallet-connected creators can open a piece on Storii.
          </p>
          <WalletMultiButton />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen pt-28 pb-24 px-6 relative">
      <DotPattern />
      <div className="max-w-2xl mx-auto relative z-10">

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-10">
          {(['Title', 'Settings', 'Confirm'] as const).map((label, i) => {
            const done = stepIndex > i
            const active = stepIndex === i && step !== 'done'
            return (
              <div key={label} className="flex items-center gap-2">
                <div className={clsx(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all',
                  done  ? 'bg-sage-light border border-sage/40 text-sage-dark' :
                  active ? 'bg-sage text-white' :
                           'bg-parchment border border-straw text-ink-tertiary'
                )}>
                  {done ? <CheckCircle2 size={14} /> : i + 1}
                </div>
                <span className={clsx('text-xs font-mono', active || done ? 'text-ink' : 'text-ink-tertiary')}>
                  {label}
                </span>
                {i < 2 && (
                  <div className={clsx('w-8 h-px', done ? 'bg-sage/40' : 'bg-straw')} />
                )}
              </div>
            )
          })}
        </div>

        <AnimatePresence mode="wait">

          {/* Step 1: Title */}
          {step === 'title' && (
            <StepWrapper key="title">
              <StepHeading
                eyebrow="Step 1"
                title="Name your piece"
                description="This is the hook that draws contributors in. It becomes the permanent title on-chain."
              />
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="It was the night before the product launch..."
                maxLength={128}
                className="w-full bg-paper border border-straw rounded-[8px] px-5 py-4 font-serif text-xl text-ink placeholder:text-ink-tertiary focus:outline-none focus:border-sage mb-2 transition-colors"
                autoFocus
              />
              <div className="text-xs text-ink-tertiary text-right mb-6 font-mono">{title.length} / 128</div>

              <div className="p-4 rounded-[8px] border border-sage/20 bg-sage-light/20 mb-8 space-y-2.5">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen size={13} className="text-sage" />
                  <span className="text-label uppercase tracking-[0.08em] text-sage font-bold">How your piece works</span>
                </div>
                {[
                  { icon: Users,    text: 'Community submits 50-word directions for each part' },
                  { icon: Users,    text: 'Everyone votes — but not for their own idea' },
                  { icon: Sparkles, text: 'Gemini writes the full scene from the winning direction' },
                  { icon: Lock,     text: 'You review and publish to Solana devnet permanently' },
                  { icon: BookOpen, text: `Max ${MAX_PARAGRAPHS} parts — intro included, all voted on` },
                ].map(({ icon: Icon, text }, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-ink-secondary">
                    <Icon size={11} className="text-sage/60 mt-0.5 flex-shrink-0" />
                    {text}
                  </div>
                ))}
              </div>

              <StepButton onClick={goNext} disabled={title.trim().length < 5}>
                Continue
              </StepButton>
            </StepWrapper>
          )}

          {/* Step 2: Settings */}
          {step === 'settings' && (
            <StepWrapper key="settings">
              <StepHeading
                eyebrow="Step 2"
                title="Round settings"
                description={`Configure timing for each of the ${MAX_PARAGRAPHS} voting rounds. Applies to every round including the intro.`}
              />
              <div className="space-y-4 mb-8">
                <SettingInput
                  label="Submission window"
                  value={submissionHours}
                  onChange={setSubmissionHours}
                  unit="hours"
                  min={1}
                  max={168}
                  hint="How long the community has to submit 50-word directions"
                />
                <SettingInput
                  label="Voting window"
                  value={votingHours}
                  onChange={setVotingHours}
                  unit="hours"
                  min={1}
                  max={168}
                  hint="How long voting is open after submissions close"
                />
                <SettingInput
                  label="Max submissions per round"
                  value={maxSubmissions}
                  onChange={setMaxSubmissions}
                  unit="submissions"
                  min={2}
                  max={100}
                  hint="Limits the vote pool — keeps it readable"
                />

                <div className="flex items-start gap-3 p-4 rounded-[8px] border border-straw bg-parchment/30">
                  <BookOpen size={14} className="text-ink-tertiary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-mono font-bold text-ink mb-0.5">Max {MAX_PARAGRAPHS} parts per piece</p>
                    <p className="text-xs text-ink-tertiary leading-5 font-serif">
                      Round 1 decides the intro. Rounds 2–{MAX_PARAGRAPHS} continue the piece.
                      After {MAX_PARAGRAPHS} sealed paragraphs the piece is marked complete on-chain.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={goBack} className="text-sm text-ink-tertiary hover:text-ink-secondary transition-colors font-mono">
                  ← Back
                </button>
                <StepButton onClick={goNext} className="flex-1">Continue</StepButton>
              </div>
            </StepWrapper>
          )}

          {/* Step 3: Confirm */}
          {step === 'confirm' && (
            <StepWrapper key="confirm">
              <StepHeading
                eyebrow="Step 3"
                title="Ready to create"
                description="This sends one transaction to register the piece on Solana. Round 1 opens immediately after — the community votes on the intro."
              />

              <div className="rounded-[8px] bg-paper border border-straw p-6 mb-5 space-y-4">
                <ConfirmRow label="Title" value={title} />
                <ConfirmRow label="Submission window" value={`${submissionHours}h per round`} />
                <ConfirmRow label="Voting window" value={`${votingHours}h per round`} />
                <ConfirmRow label="Max submissions" value={`${maxSubmissions} per round`} />
                <ConfirmRow label="Max paragraphs" value={`${MAX_PARAGRAPHS} (including intro)`} />
                <ConfirmRow label="Intro paragraph" value="Voted on in Round 1 by the community" />
                <ConfirmRow label="Network" value="Solana Devnet" />
              </div>

              <div className="flex items-start gap-2 p-3 rounded-[8px] bg-sage-light/30 border border-sage/20 mb-5">
                <Sparkles size={13} className="text-sage mt-0.5 flex-shrink-0" />
                <p className="text-xs text-ink-secondary leading-5 font-serif">
                  You do not write the opening paragraph. Round 1 works exactly like every other round —
                  your community submits directions, votes, and Gemini writes the opening scene.
                  You review and publish it.
                </p>
              </div>

              <div className="flex items-start gap-2 p-3 rounded-[8px] bg-parchment/50 border border-straw mb-4">
                <AlertCircle size={13} className="text-ink-tertiary mt-0.5 flex-shrink-0" />
                <p className="text-xs text-ink-tertiary font-mono">
                  Estimated gas: ~0.001 SOL to create the piece account on devnet.
                </p>
              </div>

              {payError && (
                <div className="flex items-start gap-2 p-3 rounded-[8px] bg-red-50 border border-red-200 mb-4 text-xs text-red-600">
                  <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
                  {payError}
                </div>
              )}

              <div className="flex items-center gap-4">
                <button onClick={goBack} className="text-sm text-ink-tertiary hover:text-ink-secondary transition-colors font-mono">
                  ← Back
                </button>
                <div className="flex-1">
                  <motion.button
                    onClick={goNext}
                    disabled={submitting}
                    whileHover={{ scale: submitting ? 1 : 1.01 }}
                    whileTap={{ scale: submitting ? 1 : 0.98 }}
                    className="w-full flex items-center justify-center gap-2 h-11 rounded-[8px] font-mono font-bold text-sm bg-sage text-white hover:bg-sage-dark transition-all disabled:opacity-40"
                  >
                    {submitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating on Solana...
                      </>
                    ) : (
                      <>
                        <Lock size={13} />
                        Create Piece
                      </>
                    )}
                  </motion.button>
                  {!submitting && (
                    <p className="text-center text-xs text-ink-tertiary mt-2 font-mono">0.1 SOL + gas fee</p>
                  )}
                </div>
              </div>
            </StepWrapper>
          )}

          {/* Done */}
          {step === 'done' && (
            <StepWrapper key="done">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 180, damping: 14 }}
                className="text-center py-8"
              >
                <div className="inline-flex w-20 h-20 rounded-full bg-seal-light border-2 border-seal/40 items-center justify-center mb-6 animate-seal-stamp">
                  <CheckCircle2 size={32} className="text-seal" />
                </div>
                <h2 className="font-mono font-bold text-3xl text-ink mb-3">Piece created.</h2>
                <p className="text-ink-secondary mb-2 max-w-sm mx-auto text-sm leading-relaxed font-serif">
                  "{title}" is registered on Solana. Round 1 is open — your community will now submit
                  directions and vote on the opening paragraph.
                </p>
                <div className="text-xs font-mono text-seal mb-6">
                  Piece account → Solana Devnet · Round 1 open
                </div>

                <div className="flex items-center justify-center gap-1.5 mb-8">
                  {Array.from({ length: MAX_PARAGRAPHS }).map((_, i) => (
                    <div
                      key={i}
                      className={clsx(
                        'w-6 h-1.5 rounded-full transition-all',
                        i === 0 ? 'bg-sage animate-pulse' : 'bg-parchment'
                      )}
                    />
                  ))}
                  <span className="text-xs text-ink-tertiary ml-2 font-mono">0 / {MAX_PARAGRAPHS} parts</span>
                </div>

                <div className="flex items-center gap-3 justify-center">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="h-10 px-5 rounded-[8px] text-sm text-ink-tertiary hover:text-ink border border-straw hover:border-sage transition-all font-mono"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => navigate('/piece/demo-piece-new')}
                    className="flex items-center gap-2 h-10 px-5 rounded-[8px] text-sm bg-sage text-white hover:bg-sage-dark font-mono font-bold transition-all"
                  >
                    Open Round 1
                    <ArrowRight size={13} />
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

function StepHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mb-8">
      <div className="text-label uppercase tracking-[0.08em] text-sage mb-2">{eyebrow}</div>
      <h2 className="font-mono font-bold text-3xl text-ink mb-2">{title}</h2>
      <p className="text-ink-secondary leading-relaxed font-serif">{description}</p>
    </div>
  )
}

function StepButton({ onClick, disabled, children, className = '' }: {
  onClick: () => void; disabled?: boolean; children: React.ReactNode; className?: string
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.01 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={clsx(
        'flex items-center justify-center gap-2 h-11 px-6 rounded-[8px] font-mono font-bold text-sm transition-all',
        disabled
          ? 'bg-parchment text-ink-tertiary cursor-not-allowed'
          : 'bg-sage text-white hover:bg-sage-dark',
        className
      )}
    >
      {children}
      {!disabled && <ArrowRight size={14} />}
    </motion.button>
  )
}

function SettingInput({ label, value, onChange, unit, min, max, hint }: {
  label: string; value: number; onChange: (v: number) => void;
  unit: string; min: number; max: number; hint: string
}) {
  return (
    <div className="rounded-[8px] border border-straw bg-paper p-4">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-mono font-bold text-ink">{label}</label>
        <div className="flex items-center gap-2">
          <button onClick={() => onChange(Math.max(min, value - 1))}
            className="w-6 h-6 rounded border border-straw text-ink-secondary hover:text-ink hover:border-sage flex items-center justify-center text-sm transition-colors">−</button>
          <span className="font-mono font-bold text-sage min-w-[3ch] text-center">{value}</span>
          <button onClick={() => onChange(Math.min(max, value + 1))}
            className="w-6 h-6 rounded border border-straw text-ink-secondary hover:text-ink hover:border-sage flex items-center justify-center text-sm transition-colors">+</button>
          <span className="text-xs text-ink-tertiary font-mono">{unit}</span>
        </div>
      </div>
      <p className="text-xs text-ink-tertiary font-serif">{hint}</p>
    </div>
  )
}

function ConfirmRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-ink-tertiary flex-shrink-0 mt-0.5 font-mono">{label}</span>
      <span className="text-sm text-ink text-right font-mono">{value}</span>
    </div>
  )
}
