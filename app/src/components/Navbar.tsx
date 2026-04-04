import { Link, useLocation } from 'react-router-dom'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { motion } from 'framer-motion'

export default function Navbar() {
  const location = useLocation()

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-parchment/5 bg-ink-900/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center"
          >
            <LockQuillIcon />
          </motion.div>
          <span className="font-serif text-xl font-semibold text-parchment tracking-tight">
            Storylock
          </span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-8">
          <NavLink to="/explore" active={isActive('/explore')}>
            Explore
          </NavLink>
          <NavLink to="/dashboard" active={isActive('/dashboard')}>
            Dashboard
          </NavLink>
          <NavLink to="/new" active={isActive('/new')}>
            + New Piece
          </NavLink>
        </div>

        {/* Wallet */}
        <WalletMultiButton />
      </div>
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
      className={`text-sm font-medium transition-colors duration-200 ${
        active
          ? 'text-gold'
          : 'text-parchment/60 hover:text-parchment'
      }`}
    >
      {children}
    </Link>
  )
}

function LockQuillIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M12 4C13.5 5.5, 14 9, 9 12 L7.5 16 L7 14 C5 15, 4 14.5, 3.5 12.5 C6.5 11.5, 10 6.5, 12 4Z"
        fill="#c9a84c"
        opacity="0.8"
      />
      <rect x="5.5" y="9.5" width="7" height="5.5" rx="1" stroke="#c9a84c" strokeWidth="1.2" fill="none" />
      <path d="M7 9.5 V7 Q9 5 11 7 V9.5" stroke="#c9a84c" strokeWidth="1.2" fill="none" />
    </svg>
  )
}
