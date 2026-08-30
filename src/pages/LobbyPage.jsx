import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Gamepad2, Globe, Hash, Target, Trophy, User, Users, Zap, Brain, Type, Search, Calculator, Image as ImageIcon } from 'lucide-react';

const LobbyPage = () => {
  const { user, isConfigured } = useAuth();
  const navigate = useNavigate();

  const displayName = isConfigured && user ? user.displayName : 'Guest';

  return (
    <div className="min-h-[calc(100vh-56px)] game-bg p-4 md:p-8">
      
      {/* ── ONLINE PARTY SECTION ── */}
      <div className="max-w-6xl mx-auto mb-12">
        <div className="flex items-center gap-3 mb-6">
          <Globe className="text-teal-400" size={32} />
          <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-500 tracking-tight">
            ONLINE PARTY
          </h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Create Room */}
          <button 
            onClick={() => navigate('/party')}
            className="group relative bg-surface-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 text-left hover:border-teal-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(20,184,166,0.15)] hover:-translate-y-1 overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-teal-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                Create Room
              </h2>
              <div className="w-10 h-10 bg-teal-500/20 text-teal-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users size={20} />
              </div>
            </div>
            <p className="text-gray-400 text-sm">Create a private party room and invite a friend to play all 11 games online.</p>
          </button>

          {/* Join Room */}
          <button 
            onClick={() => navigate('/party/join')}
            className="group relative bg-surface-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 text-left hover:border-emerald-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] hover:-translate-y-1 overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                Join Room
              </h2>
              <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Hash size={20} />
              </div>
            </div>
            <p className="text-gray-400 text-sm">Got a 6-digit code? Enter it here to join your friend's party room.</p>
          </button>
        </div>
      </div>

      {/* ── LOCAL SPLIT-SCREEN SECTION ── */}
      <div className="max-w-6xl mx-auto mb-10">
        <div className="flex items-center gap-3 mb-6">
          <Users className="text-white" size={28} />
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            LOCAL SPLIT-SCREEN
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          
          {/* Lexicon Duel Card */}
        <div 
          onClick={() => navigate('/local')}
          className="group relative bg-surface-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 cursor-pointer hover:border-p1-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] hover:-translate-y-1"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-p1-500/50 rounded-t-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-14 h-14 bg-surface-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Gamepad2 className="text-p1-400" size={28} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Local Duel</h2>
          <p className="text-gray-400 text-sm">Play Lexicon Duel locally with a friend on the same device.</p>
        </div>

        {/* Online Duel Card */}
        <div 
          onClick={() => navigate('/online')}
          className="group relative bg-surface-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 cursor-pointer hover:border-purple-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] hover:-translate-y-1"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-purple-500/50 rounded-t-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-14 h-14 bg-surface-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform relative">
            <Globe className="text-purple-400" size={28} />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse-soft border-2 border-surface-900" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Online Duel</h2>
          <p className="text-gray-400 text-sm">Create a room and invite a friend to play Lexicon Duel online.</p>
        </div>
        
        {/* Tic Tac Toe Card */}
        <div 
          onClick={() => navigate('/tictactoe')}
          className="group relative bg-surface-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 cursor-pointer hover:border-p2-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] hover:-translate-y-1"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-p2-500/50 rounded-t-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-14 h-14 bg-surface-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Hash className="text-p2-400" size={28} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Tic Tac Toe</h2>
          <p className="text-gray-400 text-sm">Classic 3x3 game. Play locally or online against a friend.</p>
        </div>
        
        {/* Guess Battle Card */}
        <div 
          onClick={() => navigate('/guess-battle')}
          className="group relative bg-surface-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 cursor-pointer hover:border-pink-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(236,72,153,0.15)] hover:-translate-y-1"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-pink-500/50 rounded-t-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-14 h-14 bg-surface-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Target className="text-pink-400" size={28} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Guess Battle</h2>
          <p className="text-gray-400 text-sm">1v1 competitive guessing game. Play local, bot, or online.</p>
        </div>

        {/* Bis Gutiya Card */}
        <div 
          onClick={() => navigate('/bis-gutiya')}
          className="group relative bg-surface-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 cursor-pointer hover:border-orange-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(249,115,22,0.15)] hover:-translate-y-1"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-orange-500/50 rounded-t-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-14 h-14 bg-surface-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Gamepad2 className="text-orange-400" size={28} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Bis Gutiya</h2>
          <p className="text-gray-400 text-sm">Classic 5x5 strategy game. Capture opponent pieces by jumping!</p>
        </div>

        {/* Reaction Battle Card */}
        <div 
          onClick={() => navigate('/reaction-battle')}
          className="group relative bg-surface-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 cursor-pointer hover:border-yellow-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(234,179,8,0.15)] hover:-translate-y-1"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500/50 rounded-t-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-14 h-14 bg-surface-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Zap className="text-yellow-400" size={28} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Reaction Battle</h2>
          <p className="text-gray-400 text-sm">Test your reflexes! Find and tap the unique item before your opponent.</p>
        </div>

        {/* Number Memory Card */}
        <div 
          onClick={() => navigate('/number-memory')}
          className="group relative bg-surface-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 cursor-pointer hover:border-indigo-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] hover:-translate-y-1"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500/50 rounded-t-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-14 h-14 bg-surface-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Brain className="text-indigo-400" size={28} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Number Memory</h2>
          <p className="text-gray-400 text-sm">Memorize the sequence before it vanishes. Type it back correctly!</p>
        </div>

        {/* Word Scramble Card */}
        <div 
          onClick={() => navigate('/word-scramble')}
          className="group relative bg-surface-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 cursor-pointer hover:border-red-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(239,68,68,0.15)] hover:-translate-y-1"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-red-500/50 rounded-t-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-14 h-14 bg-surface-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Type className="text-red-400" size={28} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Word Scramble</h2>
          <p className="text-gray-400 text-sm">Race to unscramble the hidden word! 5, 7, and 9 letter modes.</p>
        </div>

        {/* Missing Letter Card */}
        <div 
          onClick={() => navigate('/missing-letter')}
          className="group relative bg-surface-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 cursor-pointer hover:border-teal-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(20,184,166,0.15)] hover:-translate-y-1"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-teal-500/50 rounded-t-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-14 h-14 bg-surface-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Search className="text-teal-400" size={28} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Missing Letter</h2>
          <p className="text-gray-400 text-sm">Find the missing letter in categorized words. Race against time!</p>
        </div>

        {/* Odd One Out Card */}
        <div 
          onClick={() => navigate('/odd-one-out')}
          className="group relative bg-surface-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 cursor-pointer hover:border-blue-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] hover:-translate-y-1"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/50 rounded-t-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-14 h-14 bg-surface-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Target className="text-blue-400" size={28} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Odd One Out</h2>
          <p className="text-gray-400 text-sm">Find the subtle difference in the grid before your opponent does.</p>
        </div>

        {/* Target Battle Card */}
        <div 
          onClick={() => navigate('/target-battle')}
          className="group relative bg-surface-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 cursor-pointer hover:border-blue-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] hover:-translate-y-1"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/50 rounded-t-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-14 h-14 bg-surface-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Calculator className="text-blue-400" size={28} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Target Battle</h2>
          <p className="text-gray-400 text-sm">Combine numbers using math to hit the target. Closest wins!</p>
        </div>

        {/* Memory Match Card */}
        <div 
          onClick={() => navigate('/memory-match')}
          className="group relative bg-surface-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 cursor-pointer hover:border-purple-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] hover:-translate-y-1"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-purple-500/50 rounded-t-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-14 h-14 bg-surface-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <ImageIcon className="text-purple-400" size={28} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Memory Match</h2>
          <p className="text-gray-400 text-sm">Memorize the board and furiously match all the pairs!</p>
        </div>
      </div>
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
