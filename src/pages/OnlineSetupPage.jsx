import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createRoom, joinRoom } from '../services/roomService';
import { Users, PlusCircle, ArrowRight, Loader2, Copy, Check } from 'lucide-react';

const OnlineSetupPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('join'); // 'join' or 'create'
  const [joinCode, setJoinCode] = useState('');
  const [gridSize, setGridSize] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [createdRoomCode, setCreatedRoomCode] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleCreateRoom = async () => {
    setError('');
    setLoading(true);
    try {
      const code = await createRoom(user, gridSize);
      setCreatedRoomCode(code);
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
      await joinRoom(code, user);
      navigate(`/online/${code}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(createdRoomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (createdRoomCode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] px-4 animate-fade-in">
        <div className="card-glass p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-6">
            <Users className="w-8 h-8 text-purple-400" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Room Created!</h2>
          <p className="text-gray-400 text-sm mb-6">
            Share this code with your friend. The game will start automatically when they join.
          </p>
          
          <div className="bg-surface-900 border border-white/10 rounded-xl p-4 mb-6 flex items-center justify-between">
            <span className="text-3xl font-mono font-bold tracking-widest text-yellow-400">
              {createdRoomCode}
            </span>
            <button
              onClick={copyToClipboard}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Copy code"
            >
              {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-gray-400" />}
            </button>
          </div>

          <button
            onClick={() => navigate(`/online/${createdRoomCode}`)}
            className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 transition-opacity"
          >
            Enter Waiting Room →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] px-4 py-10 animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
          🌐 Online Duel
        </h1>
        <p className="text-gray-500 text-sm">Play in real-time with friends</p>
      </div>

      <div className="card-glass w-full max-w-md overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => { setActiveTab('join'); setError(''); }}
            className={`flex-1 py-4 text-sm font-bold transition-colors ${
              activeTab === 'join' ? 'text-white border-b-2 border-purple-500 bg-white/5' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Join Room
          </button>
          <button
            onClick={() => { setActiveTab('create'); setError(''); }}
            className={`flex-1 py-4 text-sm font-bold transition-colors ${
              activeTab === 'create' ? 'text-white border-b-2 border-purple-500 bg-white/5' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Create Room
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/15 border border-red-500/20 text-red-300 text-sm">
              {error}
            </div>
          )}

          {activeTab === 'join' ? (
            <form onSubmit={handleJoinRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Room Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. A1B2C3"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="w-full bg-surface-900 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-center tracking-widest placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 uppercase transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading || joinCode.length < 6}
                className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Join Game'}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Grid Size
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[5, 7, 9].map((size) => (
                    <button
                      key={size}
                      onClick={() => setGridSize(size)}
                      className={`py-3 rounded-lg border font-bold transition-all ${
                        gridSize === size
                          ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                          : 'bg-surface-900 border-white/10 text-gray-500 hover:border-white/30 hover:text-gray-300'
                      }`}
                    >
                      {size}×{size}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleCreateRoom}
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
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

export default OnlineSetupPage;
