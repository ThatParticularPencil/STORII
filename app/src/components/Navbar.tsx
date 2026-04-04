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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-canvas/90 backdrop-blur-sm border-b border-straw">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to={role === 'viewer' ? '/explore' : '/'} className="flex items-center gap-2">
          <span className="font-mono text-lg font-bold text-ink tracking-tight">
            storii
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
              Explore
            </NavLink>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Role badge + switch */}
          <button
            onClick={handleSwitchRole}
            className="hidden md:flex items-center gap-1.5 text-xs text-ink-tertiary hover:text-ink-secondary transition-colors border border-straw hover:border-sage rounded-[8px] h-7 px-3"
            title="Switch role"
          >
            <RefreshCw size={10} />
            <span className="capitalize">{role}</span>
          </button>

          {role === 'creator' && publicKey && (
            <Link to="/new">
              <motion.button
                whileTap={{ scale: 0.96 }}
                className="hidden md:flex items-center gap-1.5 text-xs font-medium text-sage-dark hover:text-sage transition-colors"
              >
                <PenLine size={13} />
                New piece
              </motion.button>
            </Link>
          )}

          {role === 'creator' && <WalletMultiButton />}
        </div>
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
      className={`relative text-sm font-mono transition-colors duration-200 ${
        active ? 'text-ink' : 'text-ink-tertiary hover:text-ink-secondary'
      }`}
    >
      {children}
      {active && (
        <motion.div
          layoutId="nav-underline"
          className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-sage"
        />
      )}
    </Link>
  )
}
