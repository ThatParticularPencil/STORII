import { Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'

import CreatorDashboard from '@/pages/CreatorDashboard'
import PieceView from '@/pages/PieceView'
import RoundView from '@/pages/RoundView'
import CreatorRoundWatch from '@/pages/CreatorRoundWatch'
import Explore from '@/pages/Explore'
import NewPiece from '@/pages/NewPiece'
import RoleGate from '@/pages/RoleGate'
import Navbar from '@/components/Navbar'
import { RoleProvider, useRole } from '@/context/RoleContext'

function AppRoutes() {
  const { role } = useRole()

  // No role chosen yet — show the gate, no navbar
  if (!role) {
    return <RoleGate />
  }

  return (
    <div className="noise-overlay min-h-screen bg-ink-900">
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes>
          {/* ── Viewer routes — can read + vote, cannot create ── */}
          {role === 'viewer' && (
            <>
              <Route path="/explore" element={<Explore />} />
              <Route path="/piece/:pieceId" element={<PieceView />} />
              <Route path="/piece/:pieceId/round/:roundIndex" element={<RoundView />} />
              {/* Redirect any creator-only paths */}
              <Route path="/new" element={<Navigate to="/explore" replace />} />
              <Route path="/dashboard" element={<Navigate to="/explore" replace />} />
              <Route path="/" element={<Navigate to="/explore" replace />} />
              <Route path="*" element={<Navigate to="/explore" replace />} />
            </>
          )}

          {/* ── Creator routes — dashboard + write only, cannot see explore or vote ── */}
          {role === 'creator' && (
            <>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<CreatorDashboard />} />
              <Route path="/new" element={<NewPiece />} />
              <Route path="/piece/:pieceId" element={<PieceView />} />
              <Route path="/piece/:pieceId/creator-round/:roundIndex" element={<CreatorRoundWatch />} />
              {/* Creators cannot vote */}
              <Route path="/piece/:pieceId/round/:roundIndex" element={<Navigate to="/dashboard" replace />} />
              {/* Everything else → dashboard */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </>
          )}
        </Routes>
      </AnimatePresence>
    </div>
  )
}

export default function App() {
  return (
    <RoleProvider>
      <AppRoutes />
    </RoleProvider>
  )
}
