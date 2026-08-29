import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Swords, Globe, Wifi, Users } from 'lucide-react';

const LobbyPage = () => {
  const { user, isConfigured } = useAuth();
  const navigate = useNavigate();

  const displayName = isConfigured && user ? user.displayName : 'Guest';

  return (
    <div className="flex flex-col items-center min-h-[calc(100vh-56px)] px-4 py-10 animate-fade-in">
      {/* Welcome */}
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-black mb-2">
          <span className="text-white">Hey, </span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
            {displayName}
          </span>
          <span className="text-white"> 👋</span>
        </h1>
        <p className="text-gray-500 text-sm">Choose your battle mode</p>
      </div>

      {/* Game Modes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl mb-10">
        
        {/* Local Duel */}
        <button
          onClick={() => navigate('/local')}
          className="group card-glass p-6 text-left hover:border-yellow-400/20 hover:bg-yellow-400/[0.03] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="w-12 h-12 rounded-xl bg-yellow-400/10 flex items-center justify-center mb-4 group-hover:bg-yellow-400/20 transition-colors">
            <Swords className="w-6 h-6 text-yellow-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Local Duel</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Play against a friend on the same screen. Pass the device back and forth.
          </p>
          <div className="flex items-center gap-1.5 mt-4 text-xs text-gray-600">
            <Users className="w-3 h-3" />
            <span>2 Players</span>
          </div>
        </button>

        {/* Online Duel */}
        <button
          onClick={() => navigate('/online')}
          className="group card-glass p-6 text-left hover:border-purple-400/20 hover:bg-purple-400/[0.03] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] relative"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-400/10 flex items-center justify-center mb-4 group-hover:bg-purple-400/20 transition-colors">
            <Globe className="w-6 h-6 text-purple-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Online Duel</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Create a room and share the code with a friend. Play in real-time from anywhere.
          </p>
          <div className="flex items-center gap-1.5 mt-4 text-xs text-gray-600">
            <Wifi className="w-3 h-3" />
            <span>Real-time</span>
          </div>
        </button>

        {/* Tic Tac Toe */}
        <button
          onClick={() => navigate('/tictactoe')}
          className="group card-glass p-6 text-left hover:border-teal-400/20 hover:bg-teal-400/[0.03] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="w-12 h-12 rounded-xl bg-teal-400/10 flex items-center justify-center mb-4 group-hover:bg-teal-400/20 transition-colors">
            <span className="text-2xl font-black text-teal-400">#</span>
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Tic Tac Toe</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Take a break from words. Play classic Tic Tac Toe with a friend locally.
          </p>
          <div className="flex items-center gap-1.5 mt-4 text-xs text-gray-600">
            <Users className="w-3 h-3" />
            <span>2 Players</span>
          </div>
        </button>

      </div>

      {/* Quick Info */}
      {!isConfigured && (
        <div className="mt-8 card-glass px-5 py-3 text-xs text-yellow-400/80 border-yellow-400/10 animate-slide-up max-w-lg text-center">
          💡 <strong>Tip:</strong> Set up Firebase in{' '}
          <code className="px-1 py-0.5 bg-white/5 rounded text-gray-300 font-mono text-[10px]">src/firebase.js</code>{' '}
          to unlock online multiplayer, accounts, stats, and leaderboards.
        </div>
      )}
    </div>
  );
};

export default LobbyPage;
