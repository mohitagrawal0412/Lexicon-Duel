import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Globe, Search } from 'lucide-react';
import { CATEGORIES } from '../config/missingLetter';

export default function MissingLetterSetupPage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState('RANDOM');

  const allCategories = ['RANDOM', ...Object.keys(CATEGORIES)];

  return (
    <div className="min-h-screen game-bg p-6 flex flex-col items-center">
      <div className="w-full max-w-2xl mb-8 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="p-3 bg-surface-800/80 hover:bg-surface-800 text-white rounded-full transition-colors border border-white/10"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-500 tracking-tight text-center flex items-center gap-2">
          <Search className="text-teal-400" /> MISSING LETTER
        </h1>
        <div className="w-12"></div>
      </div>

      <div className="w-full max-w-md space-y-6">

        {/* Category Selector */}
        <div className="bg-surface-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
          <h3 className="text-white font-bold mb-4">Select Category</h3>
          <div className="grid grid-cols-2 gap-2">
            {allCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`py-2 px-3 rounded-xl font-bold text-xs transition-colors ${
                  category === cat 
                    ? 'bg-teal-500 text-white shadow-lg' 
                    : 'bg-surface-800 text-gray-400 hover:bg-surface-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        
        {/* Local Mode */}
        <button
          onClick={() => navigate('/missing-letter/play', { state: { category } })}
          className="w-full group bg-surface-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 text-left hover:border-teal-500/50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-teal-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-surface-800 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="text-teal-400" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Local Split-Screen</h2>
              <p className="text-sm text-gray-400">Play face-to-face on one device</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            A word appears with one missing letter. Race to find and tap the correct letter on your mini-keyboard first!
          </p>
        </button>

        {/* Online Match */}
        <button
          onClick={() => navigate('/party/duel?game=missingLetter')}
          className="w-full group bg-surface-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 text-left hover:border-blue-500/50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-surface-800 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Globe className="text-blue-400" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Online Match</h2>
              <p className="text-sm text-gray-400">Play with a random opponent</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            Jump into matchmaking to find a random opponent and play online!
          </p>
        </button>

      </div>
    </div>
  );
}
