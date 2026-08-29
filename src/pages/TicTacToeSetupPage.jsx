import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createTTTRoom, joinTTTRoom } from '../services/roomService';
import { Monitor, Globe, Loader2, Copy, Check } from 'lucide-react';

const TicTacToeSetupPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState(null); // null | 'local' | 'online-create' | 'online-join'
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdCode, setCreatedCode] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleCreateRoom = async () => {
    setError('');
    setLoading(true);
    try {
      const code = await createTTTRoom(user);
      setCreatedCode(code);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (e) => {
    e?.preventDefault();
    if (!joinCode.trim()) return;
    setError('');
    setLoading(true);
    try {
      const code = joinCode.toUpperCase().trim();
      await joinTTTRoom(code, user);
      navigate(`/tictactoe/online/${code}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(createdCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // After creating a room — show the code and "Enter Room" button
  if (createdCode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] px-4 animate-fade-in">
        <div className="card-glass p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">⭕❌</div>
          <h2 className="text-2xl font-black text-white mb-2">Room Created!</h2>
          <p className="text-gray-400 text-sm mb-6">
            Share this code with your friend. The game starts when they join.
          </p>
          <div className="bg-surface-900 border border-white/10 rounded-xl p-4 mb-6 flex items-center justify-between">
            <span className="text-3xl font-mono font-bold tracking-widest text-teal-400">
              {createdCode}
            </span>
            <button onClick={copyCode} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-gray-400" />}
            </button>
          </div>
          <button
            onClick={() => navigate(`/tictactoe/online/${createdCode}`)}
            className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-teal-500 to-blue-500 text-white hover:opacity-90 transition-opacity"
          >
            Enter Waiting Room →
          </button>
        </div>
      </div>
    );
  }

  // Mode picker — first screen
  if (!mode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] px-4 animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-400 mb-2">
            ⭕ Tic Tac Toe ❌
          </h1>
          <p className="text-gray-500 text-sm">How do you want to play?</p>
          <button onClick={() => navigate('/')} className="text-xs text-gray-600 hover:text-gray-400 mt-2 block mx-auto">
            ← Back to Lobby
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
          <button
            onClick={() => navigate('/tictactoe/local')}
            className="group card-glass p-6 text-center hover:border-teal-400/20 hover:bg-teal-400/[0.03] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Monitor className="w-8 h-8 text-teal-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="text-base font-bold text-white mb-1">Local</h3>
            <p className="text-xs text-gray-500">Same device, take turns</p>
          </button>

          <button
            onClick={() => setMode('online')}
            className="group card-glass p-6 text-center hover:border-blue-400/20 hover:bg-blue-400/[0.03] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Globe className="w-8 h-8 text-blue-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="text-base font-bold text-white mb-1">Online</h3>
            <p className="text-xs text-gray-500">Play with a friend remotely</p>
          </button>
        </div>
      </div>
    );
  }

  // Online mode — create or join tabs
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] px-4 animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-400 mb-2">
          🌐 Online Tic Tac Toe
        </h1>
        <button onClick={() => setMode(null)} className="text-xs text-gray-600 hover:text-gray-400">
          ← Back
        </button>
      </div>

      <div className="card-glass w-full max-w-md overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {['join', 'create'].map((tab) => (
            <button
              key={tab}
              onClick={() => { setMode(`online-${tab}`); setError(''); }}
              className={`flex-1 py-4 text-sm font-bold capitalize transition-colors ${
                mode === `online-${tab}` || (tab === 'join' && mode === 'online')
                  ? 'text-white border-b-2 border-teal-500 bg-white/5'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab} Room
            </button>
          ))}
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/15 border border-red-500/20 text-red-300 text-sm">
              {error}
            </div>
          )}

          {(mode === 'online' || mode === 'online-join') ? (
            <form onSubmit={handleJoinRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Room Code</label>
                <input
                  type="text"
                  placeholder="e.g. A1B2C3"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="w-full bg-surface-900 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-center tracking-widest placeholder-gray-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 uppercase transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading || joinCode.length < 6}
                className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-teal-500 to-blue-500 text-white hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Join Game'}
              </button>
            </form>
          ) : (
            <div>
              <p className="text-sm text-gray-400 mb-5 text-center">
                Create a room and share the 6-letter code with your friend.
              </p>
              <button
                onClick={handleCreateRoom}
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-teal-400 to-blue-500 text-black hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate Room Code'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicTacToeSetupPage;
