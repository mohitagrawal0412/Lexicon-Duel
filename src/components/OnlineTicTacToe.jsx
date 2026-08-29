import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  subscribeToTTTRoom,
  updateTTTGameState,
  leaveTTTRoom,
} from '../services/roomService';
import { Loader2, Copy, Check } from 'lucide-react';

const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

const checkWinner = (board) => {
  const safe = board.map((c) => (c === '_' ? null : c));
  for (const [a, b, c] of WINNING_LINES) {
    if (safe[a] && safe[a] === safe[b] && safe[a] === safe[c]) return safe[a];
  }
  if (!safe.includes(null)) return 'Tie';
  return null;
};

const OnlineTicTacToe = () => {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [winLine, setWinLine] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToTTTRoom(roomId, (data) => {
      if (!data) { setError('This room no longer exists.'); setRoom(null); return; }
      setRoom(data);

      // Detect winning line for highlight
      if (data.gameState?.board) {
        const board = data.gameState.board.map((c) => (c === '_' ? null : c));
        for (const line of WINNING_LINES) {
          const [a, b, c] = line;
          if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            setWinLine(line);
            return;
          }
        }
        setWinLine(null);
      }
    });
    return () => unsubscribe();
  }, [roomId]);

  const copyCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeave = async () => {
    if (window.confirm('Leave the room?')) {
      await leaveTTTRoom(roomId);
      navigate('/');
    }
  };

  const handleCellClick = async (index) => {
    if (!room || room.gameState.gameOver) return;

    const { gameState, host, guest } = room;
    const isHost = user.uid === host.uid;
    const mySymbol = isHost ? 'X' : 'O';

    if (gameState.currentTurn !== mySymbol) return;
    if (gameState.board[index] !== '_') return;

    const newBoard = [...gameState.board];
    newBoard[index] = mySymbol;

    const result = checkWinner(newBoard);

    await updateTTTGameState(roomId, {
      board: newBoard,
      currentTurn: mySymbol === 'X' ? 'O' : 'X',
      winner: result,
      gameOver: !!result,
    });
  };

  const handleRematch = async () => {
    await updateTTTGameState(roomId, {
      board: Array(9).fill('_'),
      currentTurn: 'X',
      winner: null,
      gameOver: false,
    });
    setWinLine(null);
  };

  // ── Render states ──────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-56px)] px-4">
        <div className="card-glass p-8 max-w-md w-full text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={() => navigate('/')} className="px-4 py-2 bg-white/10 rounded-lg text-sm font-bold">
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-56px)]">
        <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
      </div>
    );
  }

  if (room.status === 'waiting') {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-56px)] px-4 animate-fade-in">
        <div className="card-glass p-8 max-w-md w-full text-center">
          <Loader2 className="w-8 h-8 text-teal-400 animate-spin mx-auto mb-6" />
          <h2 className="text-xl font-bold text-white mb-2">Waiting for opponent…</h2>
          <p className="text-gray-400 text-sm mb-6">Ask your friend to enter this code:</p>
          <div className="bg-surface-900 border border-white/10 rounded-xl p-4 mb-6 flex items-center justify-between">
            <span className="text-3xl font-mono font-bold tracking-widest text-teal-400">{roomId}</span>
            <button onClick={copyCode} className="p-2 hover:bg-white/10 rounded-lg">
              {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-gray-400" />}
            </button>
          </div>
          <button onClick={handleLeave} className="text-xs text-red-400 hover:text-red-300">Cancel and leave</button>
        </div>
      </div>
    );
  }

  // ── Active Game ────────────────────────────────────────────────────────────

  const { gameState, host, guest } = room;
  const isHost = user.uid === host.uid;
  const mySymbol = isHost ? 'X' : 'O';
  const isMyTurn = gameState.currentTurn === mySymbol;
  const board = (gameState.board || Array(9).fill('_')).map((c) => (c === '_' ? null : c));

  const symbolColor = (s) =>
    s === 'X'
      ? 'text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-purple-500'
      : 'text-transparent bg-clip-text bg-gradient-to-br from-green-400 to-teal-400';

  const playerNames = { X: host.displayName, O: guest?.displayName || 'Opponent' };

  const getCellClass = (index) => {
    const isWin = winLine?.includes(index);
    const val = board[index];
    return [
      'w-24 h-24 rounded-xl text-5xl font-black flex items-center justify-center transition-all duration-200 border',
      isWin ? 'bg-white/10 border-yellow-400/50 scale-105' : 'bg-surface-900 border-white/10',
      !val && !gameState.gameOver && isMyTurn ? 'hover:bg-white/5 hover:border-white/30 cursor-pointer' : 'cursor-default',
    ].join(' ');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] px-4 py-8 animate-fade-in">

      {/* Room header */}
      <div className="flex items-center justify-between w-full max-w-sm mb-6">
        <div className="text-xs text-gray-500">Room: <span className="text-teal-400 font-mono font-bold">{roomId}</span></div>
        <div className="flex gap-3">
          {!gameState.gameOver && room.status === 'playing' && (
            <button onClick={handleLeave} className="text-xs text-red-400 hover:text-red-300">Leave</button>
          )}
        </div>
      </div>

      {/* Scoreboard / status */}
      <div className="card-glass px-8 py-4 mb-6 flex items-center gap-6 animate-slide-up">
        {['X', 'O'].map((sym) => (
          <div key={sym} className={`flex items-center gap-2 transition-opacity ${gameState.currentTurn === sym && !gameState.gameOver ? 'opacity-100' : 'opacity-40'}`}>
            <span className={`text-2xl font-black ${symbolColor(sym)}`}>{sym}</span>
            <span className="text-sm font-bold text-gray-300">{playerNames[sym]}</span>
            {mySymbol === sym && <span className="text-[10px] text-gray-600">(you)</span>}
          </div>
        ))}
      </div>

      {/* Game status message */}
      <div className="mb-5 text-center">
        {gameState.gameOver ? (
          <div className="text-xl font-black winner-glow">
            {gameState.winner === 'Tie'
              ? <span className="text-yellow-400">🤝 It's a Tie!</span>
              : <span>🏆 <span className={symbolColor(gameState.winner)}>{playerNames[gameState.winner]}</span> Wins!</span>
            }
          </div>
        ) : (
          <div className="card-glass px-5 py-2 text-sm font-semibold text-gray-300 inline-flex items-center gap-2">
            <span className={`font-black ${symbolColor(gameState.currentTurn)}`}>{gameState.currentTurn}</span>
            {isMyTurn ? "— your turn" : `— ${playerNames[gameState.currentTurn]} is thinking…`}
          </div>
        )}
      </div>

      {/* Board */}
      <div className="card-glass p-4 rounded-2xl mb-6">
        <div className="grid grid-cols-3 gap-3">
          {board.map((cell, index) => (
            <button
              key={index}
              onClick={() => handleCellClick(index)}
              disabled={!!cell || gameState.gameOver || !isMyTurn}
              className={getCellClass(index)}
            >
              {cell && (
                <span className={symbolColor(cell)}>{cell}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        {gameState.gameOver && (
          <button
            onClick={handleRematch}
            className="px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-teal-500 to-blue-500 text-white hover:opacity-90 transition-opacity"
          >
            🔄 Rematch
          </button>
        )}
        <button
          onClick={handleLeave}
          className="px-5 py-3 rounded-xl font-bold text-sm bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200"
        >
          Leave Room
        </button>
      </div>
    </div>
  );
};

export default OnlineTicTacToe;
