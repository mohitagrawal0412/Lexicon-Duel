import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, Trophy, Home, History } from 'lucide-react';

const Navbar = () => {
  const { user, logout, isConfigured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const navItems = [
    { path: '/', label: 'Lobby', icon: Home },
    { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { path: '/history', label: 'History', icon: History },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-surface-900/80 border-b border-white/5">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-pink-400">
            ⚔️ Lexicon Duel
          </span>
        </button>

        {/* Nav Links */}
        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* User / Logout */}
        <div className="flex items-center gap-3">
          {isConfigured && user ? (
            <>
              <div className="hidden sm:flex items-center gap-2">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt=""
                    className="w-6 h-6 rounded-full border border-white/10"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white">
                    {user.displayName?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                <span className="text-xs text-gray-400 font-medium max-w-[100px] truncate">
                  {user.displayName}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <span className="text-xs text-gray-500 font-medium">Guest</span>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
