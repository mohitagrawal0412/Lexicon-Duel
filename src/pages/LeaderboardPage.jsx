import React from 'react';
import { Trophy, Medal, Flame } from 'lucide-react';

const LeaderboardPage = () => {
  const tabs = [
    { label: 'Most Wins', icon: Trophy, color: 'text-yellow-400' },
    { label: 'Highest Score', icon: Medal, color: 'text-blue-400' },
    { label: 'Longest Streak', icon: Flame, color: 'text-orange-400' },
  ];

  return (
    <div className="flex flex-col items-center min-h-[calc(100vh-56px)] px-4 py-10 animate-fade-in">
      <h1 className="text-2xl font-black text-white mb-6">🏆 Leaderboard</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab, i) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.label}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                i === 0
                  ? 'bg-white/10 text-white'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${tab.color}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Placeholder */}
      <div className="card-glass p-8 w-full max-w-lg text-center">
        <Trophy className="w-12 h-12 text-gray-700 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-gray-400 mb-2">Leaderboard Coming Soon</h2>
        <p className="text-sm text-gray-600">
          Global rankings will be available after Phase 3 — once match data is being stored in Firestore.
        </p>
      </div>
    </div>
  );
};

export default LeaderboardPage;
