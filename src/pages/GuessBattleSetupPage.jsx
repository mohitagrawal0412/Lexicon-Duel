import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createGuessBattleRoom, joinGuessBattleRoom } from '../services/guessBattleService';
import { BOT_DIFFICULTIES, TIMER_MODES } from '../config/guessBattle';
import { Users, Bot, Globe, Loader2, ArrowLeft } from 'lucide-react';

export default function GuessBattleSetupPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('local');
  const [botDiff, setBotDiff] = useState('easy');
  const [timerMode, setTimerMode] = useState('standard');
  const [joinCode, setJoinCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

  const handleStartLocal = () => {
    navigate('/guess-battle/play', { state: { mode: 'local', timerMode } });
  };

  const handleStartBot = () => {
    navigate('/guess-battle/play', { state: { mode: 'bot', botDiff, timerMode } });
  };

  const handleCreateOnline = async () => {
    if (!user) {
      setError('You must be logged in to play online.');
      return;
    }
    setError('');
    setIsCreating(true);
    try {
      const code = await createGuessBattleRoom(user, timerMode);
      navigate(`/guess-battle/online/${code}`);
    } catch (err) {
      setError(err.message || 'Failed to create room.');
      setIsCreating(false);
    }
  };

  const handleJoinOnline = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to play online.');
      return;
    }
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) {
      setError('Room code must be 6 characters.');
      return;
    }
    setError('');
    setIsJoining(true);
    try {
      await joinGuessBattleRoom(code, user);
      navigate(`/guess-battle/online/${code}`);
    } catch (err) {
      setError(err.message || 'Failed to join room.');
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen game-bg p-6 flex flex-col items-center">
      <div className="w-full max-w-2xl mb-8 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="p-3 bg-surface-800/80 hover:bg-surface-800 text-white rounded-full transition-colors border border-white/10"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 tracking-tight text-center">
          GUESS BATTLE
        </h1>
        <div className="w-12"></div>
      </div>

      <div className="w-full max-w-md bg-surface-900/60 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('local')}
            className={`flex-1 py-4 font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'local' ? 'bg-surface-800 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-surface-800/50'}`}
          >
            <Users size={18} /> Local
          </button>
          <button
            onClick={() => setActiveTab('bot')}
            className={`flex-1 py-4 font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'bot' ? 'bg-surface-800 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-surface-800/50'}`}
          >
            <Bot size={18} /> Vs Bot
          </button>
          <button
            onClick={() => setActiveTab('online')}
            className={`flex-1 py-4 font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'online' ? 'bg-surface-800 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-surface-800/50'}`}
          >
            <Globe size={18} /> Online
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-900/50 border border-red-500/50 rounded-xl text-red-200 text-sm">
              {error}
            </div>
          )}

          <div className="mb-8">
            <h3 className="text-gray-400 text-sm font-semibold mb-3 uppercase tracking-wider">Timer Mode</h3>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(TIMER_MODES).map(([key, mode]) => (
                <button
                  key={key}
                  onClick={() => setTimerMode(key)}
                  className={`p-3 rounded-xl border font-bold transition-all ${
                    timerMode === key 
                      ? 'bg-purple-600/20 border-purple-500 text-white scale-[1.02]' 
                      : 'bg-surface-800/50 border-white/10 text-gray-400 hover:border-white/20'
                  }`}
                >
                  <div className="text-sm">{mode.label}</div>
                  <div className={`text-xs mt-1 ${mode.color}`}>{mode.seconds}s</div>
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'local' && (
            <div className="space-y-6">
              <div className="p-4 bg-surface-800/50 rounded-xl border border-white/10">
                <p className="text-gray-300 text-sm leading-relaxed">
                  Pass the device back and forth. You both try to guess the secret number. The closest guess wins! 10 rounds of increasing stakes.
                </p>
              </div>
              <button
                onClick={handleStartLocal}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-bold text-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Start Local Game
              </button>
            </div>
          )}

          {activeTab === 'bot' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-gray-400 text-sm font-semibold mb-3 uppercase tracking-wider">Bot Difficulty</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(BOT_DIFFICULTIES).map(([key, diff]) => (
                    <button
                      key={key}
                      onClick={() => setBotDiff(key)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        botDiff === key 
                          ? 'bg-purple-600/20 border-purple-500 text-white scale-[1.02]' 
                          : 'bg-surface-800/50 border-white/10 text-gray-400 hover:border-white/20'
                      }`}
                    >
                      <div className="font-bold text-sm mb-1">{diff.label}</div>
                      <div className="text-xs text-gray-500 leading-tight">{diff.description}</div>
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleStartBot}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-bold text-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Play vs Bot
              </button>
            </div>
          )}

          {activeTab === 'online' && (
            <div className="space-y-8">
              {!user ? (
                <div className="p-6 bg-surface-800/80 rounded-2xl text-center border border-white/10">
                  <p className="text-gray-300 mb-4">You need to be logged in to play online.</p>
                  <button
                    onClick={() => navigate('/login', { state: { returnTo: '/guess-battle' } })}
                    className="px-6 py-2 bg-p1-500 hover:bg-p1-400 text-white rounded-lg font-semibold transition-colors"
                  >
                    Log In / Sign Up
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <h3 className="text-gray-400 text-sm font-semibold mb-3 uppercase tracking-wider">Host Game</h3>
                    <button
                      onClick={handleCreateOnline}
                      disabled={isCreating || isJoining}
                      className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-bold text-lg transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isCreating ? <><Loader2 className="animate-spin" size={20} /> Creating...</> : 'Create Room'}
                    </button>
                  </div>

                  <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                    <div className="relative px-4 bg-surface-900 text-gray-500 text-sm font-medium">OR</div>
                  </div>

                  <form onSubmit={handleJoinOnline}>
                    <h3 className="text-gray-400 text-sm font-semibold mb-3 uppercase tracking-wider">Join Room</h3>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        placeholder="ENTER 6-LETTER CODE"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        maxLength={6}
                        className="flex-1 bg-surface-800/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 uppercase tracking-widest font-mono text-center font-bold"
                      />
                      <button
                        type="submit"
                        disabled={joinCode.length !== 6 || isCreating || isJoining}
                        className="px-6 py-3 bg-surface-800 hover:bg-surface-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50 disabled:hover:bg-surface-800"
                      >
                        {isJoining ? <Loader2 className="animate-spin" size={20} /> : 'Join'}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
