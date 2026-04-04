import { Link, useLocation, useNavigate } from 'react-router-dom'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useWallet } from '@solana/wallet-adapter-react'
import { motion } from 'framer-motion'
import { PenLine, RefreshCw } from 'lucide-react'
import { useRole } from '@/context/RoleContext'

export default function Navbar() {
  const location = useLocation()
  const { publicKey } = useWallet()
  const { role, clearRole } = useRole()
  const navigate = useNavigate()

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/')

  const handleSwitchRole = () => {
    clearRole()
    navigate('/')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-ink-900/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to={role === 'viewer' ? '/explore' : '/'} className="flex items-center gap-2.5 group">
          <div className="w-6 h-6 flex items-center justify-center">
            <LockQuillIcon />
          </div>
          <span className="font-serif text-lg font-semibold text-parchment tracking-tight">
            Storii
          </span>
        </Link>

        {/* Nav links — centered, role-aware */}
        <div className="hidden md:flex items-center gap-7 absolute left-1/2 -translate-x-1/2">
          {role === 'creator' ? (
            <>
              <NavLink to="/dashboard" active={isActive('/dashboard')}>
                Dashboard
              </NavLink>
              {publicKey && (
                <NavLink to="/new" active={isActive('/new')}>
                  Write
                </NavLink>
              )}
            </>
          ) : (
            <NavLink to="/explore" active={isActive('/explore')}>
              Stories
            </NavLink>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Role badge + switch */}
          <button
            onClick={handleSwitchRole}
            className="hidden md:flex items-center gap-1.5 text-xs text-parchment/30 hover:text-parchment/60 transition-colors border border-parchment/10 hover:border-parchment/20 rounded-full h-7 px-3"
            title="Switch role"
          >
            <RefreshCw size={10} />
            <span className="capitalize">{role}</span>
          </button>

          {role === 'creator' && publicKey && (
            <Link to="/new">
              <motion.button
                whileTap={{ scale: 0.96 }}
                className="hidden md:flex items-center gap-1.5 text-xs font-medium text-gold/70 hover:text-gold transition-colors"
              >
                <PenLine size={13} />
                New piece
              </motion.button>
            </Link>
          )}

          {role === 'creator' && <WalletMultiButton />}
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-parchment/8 to-transparent" />
    </nav>
  )
}

function NavLink({
  to,
  active,
  children,
}: {
  to: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      to={to}
      className={`relative text-sm transition-colors duration-200 ${
        active ? 'text-parchment' : 'text-parchment/45 hover:text-parchment/75'
      }`}
    >
      {children}
      {active && (
        <motion.div
          layoutId="nav-underline"
          className="absolute -bottom-0.5 left-0 right-0 h-px bg-gold/60"
        />
      )}
    </Link>
  )
}

function LockQuillIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
      <path
        d="M12 4C13.5 5.5, 14 9, 9 12 L7.5 16 L7 14 C5 15, 4 14.5, 3.5 12.5 C6.5 11.5, 10 6.5, 12 4Z"
        fill="#c9a84c"
        opacity="0.7"
      />
      <rect x="5.5" y="9.5" width="7" height="5.5" rx="1" stroke="#c9a84c" strokeWidth="1.2" fill="none" opacity="0.8" />
      <path d="M7 9.5 V7 Q9 5 11 7 V9.5" stroke="#c9a84c" strokeWidth="1.2" fill="none" opacity="0.8" />
    </svg>
  )
}
