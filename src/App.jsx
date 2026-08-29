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
