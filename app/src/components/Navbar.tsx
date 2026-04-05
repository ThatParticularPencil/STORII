import { Link, useLocation, useNavigate } from 'react-router-dom'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useWallet } from '@solana/wallet-adapter-react'
import { motion } from 'framer-motion'
import { RefreshCw, Sun, Moon } from 'lucide-react'
import { useRole } from '@/context/RoleContext'
import { useTheme } from '@/context/ThemeContext'

export default function Navbar() {
  const location = useLocation()
  const { publicKey } = useWallet()
  const { role, clearRole } = useRole()
  const { dark, toggle } = useTheme()
  const navigate = useNavigate()

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/')

  const handleSwitchRole = () => {
    clearRole()
    navigate('/role')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-ink-900/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-6 h-6 flex items-center justify-center -translate-y-[2px]">
            <LockQuillIcon />
          </div>
          <span className="font-serif text-lg leading-none font-semibold text-parchment tracking-tight">
            Storii
          </span>
        </Link>

        {/* Nav links — centered, role-aware */}
        <div className="hidden md:flex items-center gap-7 absolute left-1/2 -translate-x-1/2">
          {role === 'creator' ? (
            <NavLink to="/dashboard" active={isActive('/dashboard')}>
              Dashboard
            </NavLink>
          ) : (
            <NavLink to="/explore" active={isActive('/explore')}>
              Stories
            </NavLink>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <button
            onClick={toggle}
            className="flex items-center justify-center w-7 h-7 rounded-full border border-parchment/10 hover:border-parchment/25 text-parchment/40 hover:text-parchment/70 transition-all duration-200"
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? <Sun size={13} /> : <Moon size={13} />}
          </button>

          {/* Role badge + switch */}
          <button
            onClick={handleSwitchRole}
            className="hidden md:flex items-center gap-1.5 text-xs text-parchment/30 hover:text-parchment/60 transition-colors border border-parchment/10 hover:border-parchment/20 rounded-full h-7 px-3"
            title="Switch role"
          >
            <RefreshCw size={10} />
            <span className="capitalize">{role}</span>
          </button>

          {(role === 'creator' || role === 'viewer') && <WalletMultiButton />}
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
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="storii-book-gradient-nav" x1="4.5" y1="3.25" x2="15.5" y2="17.5" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="rgba(249,115,22,0.95)" />
          <stop offset="45%" stopColor="rgba(74,222,128,0.95)" />
          <stop offset="100%" stopColor="rgba(21,128,61,0.95)" />
        </linearGradient>
        <linearGradient id="storii-book-fill-nav" x1="5" y1="3.25" x2="15.25" y2="15.75" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="rgba(249,115,22,0.18)" />
          <stop offset="55%" stopColor="rgba(74,222,128,0.16)" />
          <stop offset="100%" stopColor="rgba(21,128,61,0.16)" />
        </linearGradient>
      </defs>
      <path
        d="M4.5 4.75C4.5 3.92157 5.17157 3.25 6 3.25H15.5V15.75H6.25C5.2835 15.75 4.5 16.5335 4.5 17.5V4.75Z"
        fill="url(#storii-book-fill-nav)"
      />
      <path
        d="M4.5 4.75C4.5 3.92157 5.17157 3.25 6 3.25H15.5V15.75H6.25C5.2835 15.75 4.5 16.5335 4.5 17.5M4.5 4.75V17.5M4.5 17.5H13.75"
        stroke="url(#storii-book-gradient-nav)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M7.5 6.5H12.75" stroke="url(#storii-book-gradient-nav)" strokeWidth="1.2" strokeLinecap="round" opacity="0.92" />
      <path d="M7.5 9H12.75" stroke="url(#storii-book-gradient-nav)" strokeWidth="1.2" strokeLinecap="round" opacity="0.74" />
      <path d="M7.5 11.5H11" stroke="url(#storii-book-gradient-nav)" strokeWidth="1.2" strokeLinecap="round" opacity="0.58" />
    </svg>
  )
}
