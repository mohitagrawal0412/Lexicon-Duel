import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { joinPartyRoom } from '../../services/roomService';
import { ArrowLeft, Hash, Loader2 } from 'lucide-react';

export default function JoinParty() {
  const { user, isConfigured } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!isConfigured || !user) {
      setError("You must be logged in to join online.");
      return;
    }
    
    if (code.length < 6) return;

    setLoading(true);
    setError('');
    
    try {
      const roomId = await joinPartyRoom(code.toUpperCase(), user);
      navigate(`/party/${roomId}`);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] game-bg p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-md bg-surface-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
        <button
          onClick={() => navigate('/')}
          className="absolute top-6 left-6 p-2 text-gray-400 hover:text-white bg-surface-800 rounded-full transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        
        <div className="text-center mt-10 mb-8">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Hash size={32} />
          </div>
          <h2 className="text-3xl font-black text-white">Join Party</h2>
          <p className="text-gray-400 text-sm mt-2">Enter the 6-digit code from your host.</p>
        </div>

        <form onSubmit={handleJoin} className="flex flex-col gap-4">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
            placeholder="ENTER CODE"
            className="w-full bg-surface-800 border-2 border-white/10 rounded-xl px-4 py-4 text-center text-3xl font-black tracking-[0.5em] text-white focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-gray-600 placeholder:tracking-normal"
          />
          
          {error && <p className="text-red-400 text-sm text-center font-bold">{error}</p>}
          
          <button
            type="submit"
            disabled={code.length < 6 || loading}
            className="w-full py-4 mt-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold text-lg hover:from-emerald-400 hover:to-teal-400 transition-all disabled:opacity-50 disabled:grayscale active:scale-95 flex items-center justify-center"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'JOIN ROOM'}
          </button>
        </form>
      </div>
    </div>
  );
}
