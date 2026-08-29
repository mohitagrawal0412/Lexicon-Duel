import React, { useState } from 'react';

const GRID_OPTIONS = [
  { size: 5, label: '5×5', desc: 'Quick Match', color: 'from-blue-500 to-cyan-500' },
  { size: 7, label: '7×7', desc: 'Classic', color: 'from-purple-500 to-pink-500' },
  { size: 9, label: '9×9', desc: 'Epic Duel', color: 'from-orange-500 to-red-500' },
];

const HomePage = ({ onStartGame, onBack }) => {
  const [player1Name, setPlayer1Name] = useState('');
  const [player2Name, setPlayer2Name] = useState('');
  const [selectedSize, setSelectedSize] = useState(5);

  const handleStart = () => {
    onStartGame({
      gridSize: selectedSize,
      player1Name: player1Name.trim() || 'Player 1',
      player2Name: player2Name.trim() || 'Player 2',
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8 animate-fade-in">
      {/* Back + Title */}
      <div className="text-center mb-10">
        {onBack && (
          <button
            onClick={onBack}
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors mb-4 inline-block"
          >
            ← Back to Lobby
          </button>
        )}
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
            ⚔️ Local Duel
          </span>
        </h1>
        <p className="text-gray-500 text-sm font-medium">
          Set up your match and start playing
        </p>
      </div>

      {/* Main Card */}
      <div className="card-glass p-8 w-full max-w-lg animate-slide-up">
        {/* Player Names */}
        <div className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">
            Challengers
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-p1-500 shrink-0" />
              <input
                type="text"
                placeholder="Player 1"
                value={player1Name}
                onChange={(e) => setPlayer1Name(e.target.value)}
                maxLength={16}
                className="w-full bg-surface-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-p1-500 focus:ring-1 focus:ring-p1-500/50 transition-all"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-p2-500 shrink-0" />
              <input
                type="text"
                placeholder="Player 2"
                value={player2Name}
                onChange={(e) => setPlayer2Name(e.target.value)}
                maxLength={16}
                className="w-full bg-surface-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-p2-500 focus:ring-1 focus:ring-p2-500/50 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Grid Size Selector */}
        <div className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">
            Arena Size
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {GRID_OPTIONS.map((opt) => (
              <button
                key={opt.size}
                onClick={() => setSelectedSize(opt.size)}
                className={`relative group p-4 rounded-xl border-2 transition-all duration-200 ${
                  selectedSize === opt.size
                    ? 'border-white/30 bg-white/5 scale-105'
                    : 'border-white/5 bg-surface-900 hover:border-white/15 hover:bg-white/[0.03]'
                }`}
              >
                <div className={`text-2xl font-black bg-gradient-to-br ${opt.color} bg-clip-text text-transparent`}>
                  {opt.label}
                </div>
                <div className="text-xs text-gray-500 mt-1 font-medium">{opt.desc}</div>
                {selectedSize === opt.size && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                    <span className="text-black text-xs">✓</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={handleStart}
          className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:from-yellow-300 hover:to-orange-400 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-yellow-500/20"
        >
          ⚔️ Start Duel
        </button>

        {/* How to Play */}
        <div className="mt-8 pt-6 border-t border-white/5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-3">
            How to Play
          </h2>
          <div className="space-y-2 text-sm text-gray-400">
            <div className="flex items-start gap-2">
              <span className="text-yellow-400 font-bold shrink-0">1.</span>
              <span>On your turn, <strong className="text-gray-200">place one letter</strong> in any empty cell.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-yellow-400 font-bold shrink-0">2.</span>
              <span><strong className="text-gray-200">Drag to select</strong> a row or column of filled cells to form a word.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-yellow-400 font-bold shrink-0">3.</span>
              <span><strong className="text-gray-200">Submit the word</strong> to score points equal to its length.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-yellow-400 font-bold shrink-0">4.</span>
              <span>Fill the grid — <strong className="text-gray-200">highest score wins!</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
