import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { subscribeToPartyRoom, updatePartyRoom, leavePartyRoom } from '../../services/roomService';
import { Loader2, Copy, Check, Gamepad2, Brain, Zap, Target, Search, Type, Image as ImageIcon, Calculator, Hash } from 'lucide-react';

// STUB COMPONENTS FOR ONLINE GAMES (We will implement these later)
const OnlineBisGutiya = () => <div className="text-white text-center p-10">Online Bis Gutiya Component (Coming Soon)</div>;
const OnlineGuessBattle = () => <div className="text-white text-center p-10">Online Guess Battle Component (Coming Soon)</div>;
const OnlineReactionBattle = () => <div className="text-white text-center p-10">Online Reaction Battle Component (Coming Soon)</div>;
const OnlineNumberMemory = () => <div className="text-white text-center p-10">Online Number Memory Component (Coming Soon)</div>;
const OnlineWordScramble = () => <div className="text-white text-center p-10">Online Word Scramble Component (Coming Soon)</div>;
const OnlineMissingLetter = () => <div className="text-white text-center p-10">Online Missing Letter Component (Coming Soon)</div>;
const OnlineOddOneOut = () => <div className="text-white text-center p-10">Online Odd One Out Component (Coming Soon)</div>;
const OnlineTargetBattle = () => <div className="text-white text-center p-10">Online Target Battle Component (Coming Soon)</div>;
const OnlineMemoryMatch = () => <div className="text-white text-center p-10">Online Memory Match Component (Coming Soon)</div>;

const GAMES = [
  { id: 'bisGutiya', name: 'Bis Gutiya', icon: Gamepad2, color: 'text-orange-400', bg: 'bg-orange-500' },
  { id: 'guessBattle', name: 'Guess Battle', icon: Target, color: 'text-pink-400', bg: 'bg-pink-500' },
  { id: 'reactionBattle', name: 'Reaction Battle', icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500' },
  { id: 'numberMemory', name: 'Number Memory', icon: Brain, color: 'text-indigo-400', bg: 'bg-indigo-500' },
  { id: 'wordScramble', name: 'Word Scramble', icon: Type, color: 'text-red-400', bg: 'bg-red-500' },
  { id: 'missingLetter', name: 'Missing Letter', icon: Search, color: 'text-teal-400', bg: 'bg-teal-500' },
  { id: 'oddOneOut', name: 'Odd One Out', icon: Target, color: 'text-blue-400', bg: 'bg-blue-500' },
  { id: 'targetBattle', name: 'Target Battle', icon: Calculator, color: 'text-blue-400', bg: 'bg-blue-500' },
  { id: 'memoryMatch', name: 'Memory Match', icon: ImageIcon, color: 'text-purple-400', bg: 'bg-purple-500' },
];

export default function PartyRoom() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToPartyRoom(roomId, (data) => {
      if (!data) {
        setError('This party room has been closed.');
        setRoom(null);
        return;
      }
      setRoom(data);
    });
    return () => unsubscribe();
  }, [roomId]);

  const copyCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeave = async () => {
    if (window.confirm('Leave the party?')) {
      if (room?.host?.uid === user?.uid) {
        // If host leaves, destroy room
        await leavePartyRoom(roomId);
      }
      navigate('/');
    }
  };

  const handleSelectGame = async (gameId) => {
    if (room?.host?.uid !== user?.uid) return; // Only host can pick
    await updatePartyRoom(roomId, {
      status: 'playing',
      activeGame: gameId,
      gameState: null // Reset game state for the new game
    });
  };

  const handleBackToLobby = async () => {
    if (room?.host?.uid !== user?.uid) return;
    await updatePartyRoom(roomId, {
      status: 'lobby',
      activeGame: null,
      gameState: null
    });
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-56px)] px-4 bg-black">
        <div className="bg-surface-900 border border-white/10 p-8 max-w-md w-full text-center rounded-3xl">
          <p className="text-red-400 mb-4 font-bold">{error}</p>
          <button onClick={() => navigate('/')} className="px-6 py-3 bg-surface-800 hover:bg-surface-700 text-white rounded-xl font-bold">
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-56px)] bg-black">
        <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
      </div>
    );
  }

  const isHost = user?.uid === room.host.uid;

  // ── WAITING FOR GUEST ──
  if (room.status === 'waiting') {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-56px)] px-4 bg-black animate-fade-in">
        <div className="bg-surface-900 border border-white/10 p-8 max-w-md w-full text-center rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 to-blue-500 animate-pulse" />
          
          <div className="w-16 h-16 bg-teal-500/20 text-teal-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Users size={32} />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Party Created!</h2>
          <p className="text-gray-400 text-sm mb-8">Send this code to your friend so they can join.</p>
          
          <div className="bg-surface-800 border border-white/5 rounded-xl p-6 mb-8 flex items-center justify-between shadow-inner">
            <span className="text-5xl font-mono font-black tracking-[0.2em] text-teal-400 ml-2">{roomId}</span>
            <button onClick={copyCode} className="p-3 hover:bg-white/10 rounded-lg transition-colors">
              {copied ? <Check className="w-6 h-6 text-green-400" /> : <Copy className="w-6 h-6 text-gray-400" />}
            </button>
          </div>
          
          <Loader2 className="w-6 h-6 text-gray-500 animate-spin mx-auto mb-4" />
          <p className="text-xs text-gray-500 font-bold tracking-widest uppercase">Waiting for player 2...</p>

          <button onClick={handleLeave} className="mt-8 text-xs text-red-400 hover:text-red-300 font-bold">Cancel Party</button>
        </div>
      </div>
    );
  }

  // ── GAME LOBBY (PICK A GAME) ──
  if (room.status === 'lobby') {
    return (
      <div className="min-h-[calc(100vh-56px)] bg-black p-4 md:p-8 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between max-w-6xl mx-auto w-full mb-8 bg-surface-900 border border-white/10 p-4 rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="text-xs text-gray-500 font-bold tracking-widest uppercase">Party Code</div>
            <div className="bg-surface-800 px-3 py-1 rounded font-mono font-bold text-teal-400 flex items-center gap-2">
              {roomId}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-teal-400">{room.host.displayName}</span>
              <span className="text-gray-600 text-xs">VS</span>
              <span className="text-sm font-bold text-emerald-400">{room.guest?.displayName}</span>
            </div>
            <button onClick={handleLeave} className="text-xs text-red-400 font-bold px-3 py-2 bg-red-400/10 rounded-lg hover:bg-red-400/20 transition-colors">
              Leave
            </button>
          </div>
        </div>

        {/* Game Selection Grid */}
        <div className="max-w-6xl mx-auto w-full flex-1">
          <h2 className="text-3xl font-black text-white mb-2 text-center">
            {isHost ? 'Pick a Game' : 'Waiting for Host...'}
          </h2>
          <p className="text-gray-400 text-center mb-8">
            {isHost ? 'Select a mini-game to instantly teleport both players into it.' : `${room.host.displayName} is selecting the next game.`}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {GAMES.map(game => (
              <button
                key={game.id}
                onClick={() => handleSelectGame(game.id)}
                disabled={!isHost}
                className={`group relative bg-surface-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 transition-all duration-300
                  ${isHost ? `hover:border-${game.color.split('-')[1]}-500/50 hover:-translate-y-1 hover:shadow-lg cursor-pointer` : 'opacity-80 cursor-not-allowed'}
                `}
              >
                <div className={`w-14 h-14 ${game.bg}/20 rounded-2xl flex items-center justify-center ${isHost ? 'group-hover:scale-110' : ''} transition-transform`}>
                  <game.icon className={game.color} size={28} />
                </div>
                <span className="text-white font-bold text-center text-sm">{game.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── ACTIVE GAME ROUTER ──
  if (room.status === 'playing' && room.activeGame) {
    
    // Header for active game
    const gameHeader = (
      <div className="fixed top-4 left-4 right-4 z-50 flex justify-between items-center pointer-events-none">
        <div className="bg-black/50 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full pointer-events-auto flex gap-4">
           <div className="text-xs font-bold text-gray-400">Host: <span className="text-white">{room.host.displayName}</span></div>
           <div className="text-xs font-bold text-gray-400">Guest: <span className="text-white">{room.guest?.displayName}</span></div>
        </div>
        {isHost && (
          <button 
            onClick={handleBackToLobby}
            className="bg-red-500/20 text-red-400 hover:bg-red-500/40 border border-red-500/50 px-4 py-2 rounded-full font-bold text-xs pointer-events-auto transition-colors"
          >
            End Game & Return to Party
          </button>
        )}
      </div>
    );

    let ActiveGameComponent = null;

    switch (room.activeGame) {
      case 'bisGutiya': ActiveGameComponent = OnlineBisGutiya; break;
      case 'guessBattle': ActiveGameComponent = OnlineGuessBattle; break;
      case 'reactionBattle': ActiveGameComponent = OnlineReactionBattle; break;
      case 'numberMemory': ActiveGameComponent = OnlineNumberMemory; break;
      case 'wordScramble': ActiveGameComponent = OnlineWordScramble; break;
      case 'missingLetter': ActiveGameComponent = OnlineMissingLetter; break;
      case 'oddOneOut': ActiveGameComponent = OnlineOddOneOut; break;
      case 'targetBattle': ActiveGameComponent = OnlineTargetBattle; break;
      case 'memoryMatch': ActiveGameComponent = OnlineMemoryMatch; break;
      default: return <div className="text-white text-center p-10">Unknown Game</div>;
    }

    return (
      <div className="relative h-[calc(100vh-56px)] w-full">
        {gameHeader}
        <ActiveGameComponent room={room} roomId={roomId} isHost={isHost} user={user} />
      </div>
    );
  }

  return null;
}

// Temporary fallback for lucide-react icon import missing `Users`
import { Users } from 'lucide-react';
