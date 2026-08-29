import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Globe, Lock, Brain } from 'lucide-react';

export default function NumberMemorySetupPage() {
  const navigate = useNavigate();

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
          <Brain className="text-blue-400" /> NUMBER MEMORY
        </h1>
        <div className="w-12"></div>
      </div>

      <div className="w-full max-w-md space-y-6">
        
        {/* Local Mode */}
        <button
          onClick={() => navigate('/number-memory/play')}
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
            A sequence of numbers appears for 3 seconds. Type them back using your on-screen numpad. 4 rounds of increasing difficulty.
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
              <p className="text-sm text-gray-400">Test memory globally</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
