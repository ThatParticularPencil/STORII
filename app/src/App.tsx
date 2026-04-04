import { Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'

import Landing from '@/pages/Landing'
import CreatorDashboard from '@/pages/CreatorDashboard'
import PieceView from '@/pages/PieceView'
import RoundView from '@/pages/RoundView'
import Explore from '@/pages/Explore'
import NewPiece from '@/pages/NewPiece'
import Navbar from '@/components/Navbar'

export default function App() {
  return (
    <div className="noise-overlay min-h-screen bg-ink-900">
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/dashboard" element={<CreatorDashboard />} />
          <Route path="/new" element={<NewPiece />} />
          <Route path="/piece/:pieceId" element={<PieceView />} />
          <Route path="/piece/:pieceId/round/:roundIndex" element={<RoundView />} />
        </Routes>
      </AnimatePresence>
    </div>
  )
}
