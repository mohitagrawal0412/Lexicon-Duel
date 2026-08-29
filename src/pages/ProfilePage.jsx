import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Trophy, Target, Flame, TrendingUp, BookOpen } from 'lucide-react';

const ProfilePage = () => {
  const { user, isConfigured } = useAuth();

  if (!isConfigured || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] px-4 animate-fade-in">
        <div className="card-glass p-8 max-w-md w-full text-center">
          <User className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Profile Not Available</h2>
          <p className="text-gray-500 text-sm">
            {!isConfigured
              ? 'Set up Firebase to enable user profiles and stats tracking.'
              : 'Log in to view your profile and stats.'}
          </p>
        </div>
      </div>
    );
  }

  // Placeholder stats — will be fetched from Firestore in Phase 3
  const stats = {
    totalGames: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    totalScore: 0,
    highestGameScore: 0,
    bestWord: '—',
    bestWordScore: 0,
    currentStreak: 0,
    longestStreak: 0,
    wordsPlayed: 0,
  };

  const winRate = stats.totalGames > 0
    ? Math.round((stats.wins / stats.totalGames) * 100)
    : 0;

  const statCards = [
    { label: 'Total Games', value: stats.totalGames, icon: Target, color: 'text-blue-400' },
    { label: 'Wins', value: stats.wins, icon: Trophy, color: 'text-yellow-400' },
    { label: 'Win Rate', value: `${winRate}%`, icon: TrendingUp, color: 'text-green-400' },
    { label: 'Current Streak', value: `${stats.currentStreak} 🔥`, icon: Flame, color: 'text-orange-400' },
    { label: 'Total Score', value: stats.totalScore, icon: Target, color: 'text-purple-400' },
    { label: 'Words Played', value: stats.wordsPlayed, icon: BookOpen, color: 'text-cyan-400' },
  ];

  return (
    <div className="flex flex-col items-center min-h-[calc(100vh-56px)] px-4 py-10 animate-fade-in">
      {/* Profile Header */}
      <div className="card-glass p-6 w-full max-w-lg flex items-center gap-4 mb-6">
        {user.photoURL ? (
          <img src={user.photoURL} alt="" className="w-16 h-16 rounded-full border-2 border-white/10" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl font-black text-white shrink-0">
            {user.displayName?.charAt(0)?.toUpperCase() || '?'}
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-white">{user.displayName}</h1>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-lg mb-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="card-glass p-4 text-center">
              <Icon className={`w-5 h-5 mx-auto mb-2 ${card.color}`} />
              <div className="text-xl font-black text-white">{card.value}</div>
              <div className="text-xs text-gray-500 mt-1">{card.label}</div>
            </div>
          );
        })}
      </div>

      {/* Match History Placeholder */}
      <div className="card-glass p-6 w-full max-w-lg">
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">
          Match History
        </h2>
        <div className="text-center py-8">
          <p className="text-gray-600 text-sm">No matches yet. Start a duel!</p>
          <p className="text-gray-700 text-xs mt-1">Your match history will appear here after Phase 3.</p>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
