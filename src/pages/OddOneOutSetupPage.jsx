import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Globe, Lock, Target } from 'lucide-react';

export default function OddOneOutSetupPage() {
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState('MEDIUM');

  return (
    <div className="min-h-screen game-bg p-6 flex flex-col items-center">
      <div className="w-full max-w-2xl mb-8 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="p-3 bg-surface-800/80 hover:bg-surface-800 text-white rounded-full transition-colors border border-white/10"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 tracking-tight text-center flex items-center gap-2">
          <Target className="text-blue-400" /> ODD ONE OUT
        </h1>
        <div className="w-12"></div>
      </div>

      <div className="w-full max-w-md space-y-6">

        {/* Difficulty Selector */}
        <div className="bg-surface-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
          <h3 className="text-white font-bold mb-4">Select Difficulty</h3>
          <div className="flex gap-2">
            {['EASY', 'MEDIUM', 'HARD'].map(level => (
              <button
                key={level}
                onClick={() => setDifficulty(level)}
                className={`flex-1 py-2 rounded-xl font-bold text-sm transition-colors ${
                  difficulty === level 
                    ? 'bg-blue-500 text-white shadow-lg' 
                    : 'bg-surface-800 text-gray-400 hover:bg-surface-700'
                }`}
              >
                {level}
                <div className="text-xs opacity-75 font-normal">
                  {level === 'EASY' ? '4x4 Obvious' : level === 'MEDIUM' ? '5x5 Letters' : '6x6 Subtle Colors'}
                </div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Local Mode */}
        <button
          onClick={() => navigate('/odd-one-out/play', { state: { difficulty } })}
          className="w-full group bg-surface-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 text-left hover:border-blue-500/50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-surface-800 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="text-blue-400" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Local Split-Screen</h2>
              <p className="text-sm text-gray-400">Play face-to-face on one device</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            Find the single item in the grid that is different from all the rest. First to tap it wins the round!
          </p>
        </button>

        {/* Online Mode (Coming Soon) */}
        <div className="w-full bg-surface-900/30 backdrop-blur-xl border border-white/5 rounded-3xl p-6 relative overflow-hidden opacity-75">
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px] z-10 rounded-3xl">
            <div className="bg-surface-800 px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
              <Lock size={16} className="text-gray-400" />
              <span className="text-sm font-bold text-gray-300">Coming Soon</span>
            </div>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-surface-800 rounded-2xl flex items-center justify-center">
              <Globe className="text-indigo-400" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Online Match</h2>
              <p className="text-sm text-gray-400">Test perception globally</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
