import { Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'

import Landing from '@/pages/Landing'
import RoleGate from '@/pages/RoleGate'
import CreatorDashboard from '@/pages/CreatorDashboard'
import PieceView from '@/pages/PieceView'
import RoundView from '@/pages/RoundView'
import CreatorRoundWatch from '@/pages/CreatorRoundWatch'
import Explore from '@/pages/Explore'
import NewPiece from '@/pages/NewPiece'
import Navbar from '@/components/Navbar'
import { RoleProvider, useRole } from '@/context/RoleContext'

function AppRoutes() {
  const { role } = useRole()

  // No role chosen yet — show Landing / RoleGate without navbar
  if (!role) {
    return (
      <Routes>
        <Route path="/"     element={<Landing />} />
        <Route path="/role" element={<RoleGate />} />
        {/* Any other path → landing */}
        <Route path="*"     element={<Navigate to="/" replace />} />
      </Routes>
    )
  }

  return (
    <div className="min-h-screen bg-canvas relative">
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes>
          {/* ── Viewer routes — read + vote, cannot create ────────────── */}
          {role === 'viewer' && (
            <>
              <Route path="/explore"                               element={<Explore />} />
              <Route path="/piece/:pieceId"                        element={<PieceView />} />
              <Route path="/piece/:pieceId/round/:roundIndex"      element={<RoundView />} />
              {/* Redirect creator-only paths */}
              <Route path="/new"                                   element={<Navigate to="/explore" replace />} />
              <Route path="/dashboard"                             element={<Navigate to="/explore" replace />} />
              <Route path="/"                                      element={<Navigate to="/explore" replace />} />
              <Route path="*"                                      element={<Navigate to="/explore" replace />} />
            </>
          )}

          {/* ── Creator routes — dashboard + write, cannot vote ──────── */}
          {role === 'creator' && (
            <>
              <Route path="/"                                                element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard"                                       element={<CreatorDashboard />} />
              <Route path="/new"                                             element={<NewPiece />} />
              <Route path="/piece/:pieceId"                                  element={<PieceView />} />
              <Route path="/piece/:pieceId/creator-round/:roundIndex"        element={<CreatorRoundWatch />} />
              {/* Creators cannot vote — redirect round view */}
              <Route path="/piece/:pieceId/round/:roundIndex"                element={<Navigate to="/dashboard" replace />} />
              <Route path="*"                                                element={<Navigate to="/dashboard" replace />} />
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
