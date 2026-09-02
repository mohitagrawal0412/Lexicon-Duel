import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { findRandomMatch, cancelMatchmaking } from '../../services/roomService';
import { Loader2, Globe, ArrowLeft, Zap } from 'lucide-react';

export default function PartyDuelPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState('searching');
  const queueKeyRef = useRef(null);
  const unsubscribeRefObj = useRef(null);

  // Parse preferred game from query string
  const queryParams = new URLSearchParams(location.search);
  let preferredGame = queryParams.get('game') || 'any';
  
  // Convert kebab-case to camelCase (e.g. bis-gutiya -> bisGutiya)
  if (preferredGame !== 'any') {
    preferredGame = preferredGame.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    // Special handling for guess-battle since our setup page might use 'guess' or 'guess-battle'
    if (preferredGame === 'guessBattle') preferredGame = 'guessBattle'; // Ensure it's correct
  }

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    const startMatchmaking = async () => {
      try {
        const { roomCode, isHost, queueKey: key, unsubscribe } = await findRandomMatch(user, preferredGame, (foundRoomCode) => {
          setStatus('matched');
          setTimeout(() => {
            navigate(`/party/${foundRoomCode}`);
          }, 1500);
        });

        if (roomCode) {
          // Instantly matched as guest
          setStatus('matched');
          setTimeout(() => {
            navigate(`/party/${roomCode}`);
          }, 1500);
        } else {
          // Waiting as host
          queueKeyRef.current = key;
          unsubscribeRefObj.current = unsubscribe;
        }
      } catch (err) {
        console.error("Matchmaking error:", err);
        setStatus('error');
      }
    };

    startMatchmaking();

    return () => {
      // Cleanup if component unmounts while waiting
      if (queueKeyRef.current) {
        cancelMatchmaking(queueKeyRef.current);
      }
      if (unsubscribeRefObj.current) {
        unsubscribeRefObj.current();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  const handleCancel = async () => {
    if (queueKeyRef.current) {
      await cancelMatchmaking(queueKeyRef.current);
    }
    if (unsubscribeRefObj.current) {
      unsubscribeRefObj.current();
    }
    navigate('/');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] px-4 bg-black animate-fade-in relative">
      
      <button 
        onClick={handleCancel}
        className="absolute top-8 left-8 text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
      >
        <ArrowLeft size={20} /> Back to Lobby
      </button>

      <div className="bg-surface-900/80 backdrop-blur-xl border border-white/10 p-10 max-w-md w-full text-center rounded-3xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 animate-pulse" />
        
        {status === 'searching' && (
          <>
            <div className="w-20 h-20 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-8 relative">
              <Globe size={40} className="animate-spin-slow" />
              <div className="absolute inset-0 rounded-2xl border-4 border-blue-500/30 animate-ping" />
            </div>
            
            <h2 className="text-3xl font-black text-white mb-2 tracking-tight">FINDING OPPONENT</h2>
            <p className="text-gray-400 mb-8 font-bold">Scanning for players online...</p>
            
            <div className="flex justify-center items-center gap-3 text-blue-400 font-bold uppercase tracking-widest text-sm">
              <Loader2 className="w-5 h-5 animate-spin" />
              Searching
            </div>
          </>
        )}

        {status === 'matched' && (
          <div className="animate-pop-in">
            <div className="w-24 h-24 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(34,197,94,0.3)]">
              <Zap size={48} className="animate-pulse" />
            </div>
            
            <h2 className="text-4xl font-black text-white mb-2">MATCH FOUND!</h2>
            <p className="text-gray-400 mb-2 font-bold uppercase tracking-widest">Connecting to Party Room...</p>
            
            <div className="w-full bg-surface-800 rounded-full h-2 mt-8 overflow-hidden">
              <div className="bg-green-500 h-full animate-progress rounded-full" />
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="animate-pop-in">
            <h2 className="text-2xl font-black text-red-400 mb-4">MATCHMAKING FAILED</h2>
            <p className="text-gray-400 mb-8">Could not connect to the matchmaking server.</p>
            <button 
              onClick={handleCancel}
              className="px-8 py-4 bg-surface-800 hover:bg-surface-700 text-white rounded-xl font-bold transition-all w-full"
            >
              Return to Lobby
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
