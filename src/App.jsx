import { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';

import { useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import LoginPage from './pages/LoginPage';
import LobbyPage from './pages/LobbyPage';
import ProfilePage from './pages/ProfilePage';
import LeaderboardPage from './pages/LeaderboardPage';
import OnlineSetupPage from './pages/OnlineSetupPage';
import OnlineGrid from './components/OnlineGrid';
import TicTacToe from './components/TicTacToe';
import TicTacToeSetupPage from './pages/TicTacToeSetupPage';
import OnlineTicTacToe from './components/OnlineTicTacToe';

import GuessBattleSetupPage from './pages/GuessBattleSetupPage';
import LocalGuessBattle from './components/GuessBattle/LocalGuessBattle';
import OnlineGuessBattle from './components/GuessBattle/OnlineGuessBattle';

import BisGutiyaSetupPage from './pages/BisGutiyaSetupPage';
import LocalBisGutiya from './components/BisGutiya/LocalBisGutiya';

import ReactionBattleSetupPage from './pages/ReactionBattleSetupPage';
import LocalReactionBattle from './components/ReactionBattle/LocalReactionBattle';

import NumberMemorySetupPage from './pages/NumberMemorySetupPage';
import LocalNumberMemory from './components/NumberMemory/LocalNumberMemory';

import WordScrambleSetupPage from './pages/WordScrambleSetupPage';
import LocalWordScramble from './components/WordScramble/LocalWordScramble';

import MissingLetterSetupPage from './pages/MissingLetterSetupPage';
import LocalMissingLetter from './components/MissingLetter/LocalMissingLetter';

import OddOneOutSetupPage from './pages/OddOneOutSetupPage';
import LocalOddOneOut from './components/OddOneOut/LocalOddOneOut';

import TargetBattleSetupPage from './pages/TargetBattleSetupPage';
import LocalTargetBattle from './components/TargetBattle/LocalTargetBattle';

import MemoryMatchSetupPage from './pages/MemoryMatchSetupPage';
import LocalMemoryMatch from './components/MemoryMatch/LocalMemoryMatch';

import CreateParty from './pages/Party/CreateParty';
import JoinParty from './pages/Party/JoinParty';
import PartyRoom from './pages/Party/PartyRoom';

import HomePage from './HomePage';
import Grid from './Grid';

function AppContent() {
  const [gameConfig, setGameConfig] = useState(null);
  const { isConfigured } = useAuth();
  const navigate = useNavigate();

  const handleStartGame = (config) => {
    setGameConfig(config);
  };

  const handleBackFromGame = () => {
    setGameConfig(null);
  };

  const handleBackFromSetup = () => {
    navigate('/');
  };

  return (
    <div className="game-bg min-h-screen">
      <Routes>
        {/* Login — no navbar */}
        <Route path="/login" element={<LoginPage />} />

        {/* All other routes have navbar */}
        <Route
          path="*"
          element={
            <ProtectedRoute>
              <Navbar />
              <Routes>
                {/* Lobby */}
                <Route path="/" element={<LobbyPage />} />

                {/* Local Games */}
                <Route
                  path="/local"
                  element={
                    gameConfig ? (
                      <Grid
                        size={gameConfig.gridSize}
                        player1Name={gameConfig.player1Name}
                        player2Name={gameConfig.player2Name}
                        onBack={handleBackFromGame}
                      />
                    ) : (
                      <HomePage
                        onStartGame={handleStartGame}
                        onBack={handleBackFromSetup}
                      />
                    )
                  }
                />
                
                <Route path="/tictactoe" element={<TicTacToeSetupPage />} />
                <Route path="/tictactoe/local" element={<TicTacToe />} />
                <Route path="/tictactoe/online/:roomId" element={<OnlineTicTacToe />} />

                {/* Guess Battle */}
                <Route path="/guess-battle" element={<GuessBattleSetupPage />} />
                <Route path="/guess-battle/play" element={<LocalGuessBattle />} />
                <Route path="/guess-battle/online/:roomId" element={<OnlineGuessBattle />} />

                {/* Bis Gutiya */}
                <Route path="/bis-gutiya" element={<BisGutiyaSetupPage />} />
                <Route path="/bis-gutiya/play" element={<LocalBisGutiya />} />

                {/* Reaction Battle */}
                <Route path="/reaction-battle" element={<ReactionBattleSetupPage />} />
                <Route path="/reaction-battle/play" element={<LocalReactionBattle />} />

                {/* Number Memory */}
                <Route path="/number-memory" element={<NumberMemorySetupPage />} />
                <Route path="/number-memory/play" element={<LocalNumberMemory />} />

                {/* Word Scramble */}
                <Route path="/word-scramble" element={<WordScrambleSetupPage />} />
                <Route path="/word-scramble/play" element={<LocalWordScramble />} />

                {/* Missing Letter */}
                <Route path="/missing-letter" element={<MissingLetterSetupPage />} />
                <Route path="/missing-letter/play" element={<LocalMissingLetter />} />

                {/* Odd One Out */}
                <Route path="/odd-one-out" element={<OddOneOutSetupPage />} />
                <Route path="/odd-one-out/play" element={<LocalOddOneOut />} />

                {/* Target Battle */}
                <Route path="/target-battle" element={<TargetBattleSetupPage />} />
                <Route path="/target-battle/play" element={<LocalTargetBattle />} />

                {/* Memory Match */}
                <Route path="/memory-match" element={<MemoryMatchSetupPage />} />
                <Route path="/memory-match/play" element={<LocalMemoryMatch />} />

                {/* Party Room (Unified Online) */}
                <Route path="/party" element={<CreateParty />} />
                <Route path="/party/join" element={<JoinParty />} />
                <Route path="/party/:roomId" element={<PartyRoom />} />

                {/* Profile */}
                <Route path="/profile" element={<ProfilePage />} />

                {/* Leaderboard */}
                <Route path="/leaderboard" element={<LeaderboardPage />} />

                {/* Online Multiplayer */}
                <Route path="/online" element={<OnlineSetupPage />} />
                <Route path="/online/:roomId" element={<OnlineGrid />} />
              </Routes>
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

function App() {
  return <AppContent />;
}

export default App;
