import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import GuideOverlay from '@/components/GuideOverlay';
import Lobby from '@/pages/Lobby';
import Character from '@/pages/Character';
import GameHub from '@/pages/GameHub';
import GameMap from '@/pages/GameMap';
import GameTurn from '@/pages/GameTurn';
import GameChat from '@/pages/GameChat';
import BattleReport from '@/pages/BattleReport';
import Leaderboard from '@/pages/Leaderboard';

export default function App() {
  return (
    <Router>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Lobby />} />
          <Route path="/lobby" element={<Navigate to="/" replace />} />
          <Route path="/character" element={<Character />} />
          <Route path="/game" element={<GameHub />} />
          <Route path="/game/map" element={<GameHub />} />
          <Route path="/game/turn" element={<GameHub />} />
          <Route path="/game/chat" element={<GameHub />} />
          <Route path="/game/report" element={<GameHub />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
      <GuideOverlay />
    </Router>
  );
}
