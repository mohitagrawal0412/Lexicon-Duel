import React, { useState, useEffect } from 'react';
import { updatePartyRoom } from '../../services/roomService';
import { concludeGameAndReturnToLobby } from '../../services/relationshipService';
import { Trophy } from 'lucide-react';

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

export default function OnlineTicTacToeParty({ room, roomId, isHost, user }) {
  const [winLine, setWinLine] = useState(null);

  // Initialize game state
  useEffect(() => {
    if (isHost && (!room.gameState || room.gameState === 'initializing')) {
      updatePartyRoom(roomId, {
        gameState: {
          board: Array(9).fill('_'),
          currentTurn: 'X',
          winner: null,
          gameOver: false,
        }
      });
    }
  }, [isHost, room.gameState, roomId]);

  // Loading guard
  if (!room.gameState || typeof room.gameState === 'string') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white text-lg font-bold animate-pulse">Initializing Game...</div>
      </div>
    );
  }

  const { gameState, host, guest } = room;
  const mySymbol = isHost ? 'X' : 'O';
  const isMyTurn = gameState.currentTurn === mySymbol;
  const board = (gameState.board || Array(9).fill('_')).map((c) => (c === '_' ? null : c));
  const playerNames = { X: host.displayName, O: guest?.displayName || 'Opponent' };

  // Detect winning line
  useEffect(() => {
    if (gameState?.board) {
      const b = gameState.board.map((c) => (c === '_' ? null : c));
      for (const line of WINNING_LINES) {
        const [a, bb, c] = line;
        if (b[a] && b[a] === b[bb] && b[a] === b[c]) {
          setWinLine(line);
          return;
        }
      }
      setWinLine(null);
    }
  }, [gameState?.board]);

  const handleCellClick = async (index) => {
    if (gameState.gameOver || !isMyTurn) return;
    if (gameState.board[index] !== '_') return;

    const newBoard = [...gameState.board];
    newBoard[index] = mySymbol;
    const result = checkWinner(newBoard);

    await updatePartyRoom(roomId, {
      gameState: {
        ...gameState,
        board: newBoard,
        currentTurn: mySymbol === 'X' ? 'O' : 'X',
        winner: result,
        gameOver: !!result,
      }
    });
  };

  const handleRematch = async () => {
    await updatePartyRoom(roomId, {
      gameState: {
        board: Array(9).fill('_'),
        currentTurn: 'X',
        winner: null,
        gameOver: false,
      }
    });
    setWinLine(null);
  };

  const handleReturnToLobby = () => {
    const p1Score = gameState.winner === 'X' ? 1 : 0;
    const p2Score = gameState.winner === 'O' ? 1 : 0;
    concludeGameAndReturnToLobby(roomId, room.host, room.guest, 'ticTacToe', p1Score, p2Score);
  };

  const symbolColor = (s) =>
    s === 'X'
      ? 'text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-purple-500'
      : 'text-transparent bg-clip-text bg-gradient-to-br from-green-400 to-teal-400';

  const getCellClass = (index) => {
    const isWin = winLine?.includes(index);
    const val = board[index];
    return [
      'w-24 h-24 rounded-xl text-5xl font-black flex items-center justify-center transition-all duration-200 border',
      isWin ? 'bg-white/10 border-yellow-400/50 scale-105' : 'bg-surface-900 border-white/10',
      !val && !gameState.gameOver && isMyTurn ? 'hover:bg-white/5 hover:border-white/30 cursor-pointer' : 'cursor-default',
    ].join(' ');
  };

  // Game Over Overlay
  if (gameState.gameOver) {
    const isTie = gameState.winner === 'Tie';
    const winnerName = isTie ? null : playerNames[gameState.winner];
    const iWon = gameState.winner === mySymbol;

    return (
      <div className="flex flex-col items-center justify-center h-full px-4">
        <div className="bg-surface-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
          <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-3xl font-black text-white mb-2">
            {isTie ? '🤝 TIE GAME!' : `🏆 ${winnerName} Wins!`}
          </h2>
          <p className="text-gray-400 mb-6">
            {isTie ? 'Great match!' : iWon ? 'Victory is yours!' : 'Better luck next time!'}
          </p>

          <div className="flex gap-3 justify-center">
            {isHost && (
              <>
                <button onClick={handleRematch} className="px-6 py-3 bg-gradient-to-r from-teal-500 to-blue-500 text-white rounded-xl font-bold hover:opacity-90 transition-opacity">
                  🔄 Rematch
                </button>
                <button onClick={handleReturnToLobby} className="px-6 py-3 bg-surface-800 hover:bg-surface-700 text-white rounded-xl font-bold transition-colors">
                  Return to Party Lobby
                </button>
              </>
            )}
            {!isHost && (
              <p className="text-gray-500 text-sm font-bold">Waiting for host...</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-8">
      {/* Scoreboard */}
      <div className="bg-surface-900/80 border border-white/10 rounded-2xl px-8 py-4 mb-6 flex items-center gap-6">
        {['X', 'O'].map((sym) => (
          <div key={sym} className={`flex items-center gap-2 transition-opacity ${gameState.currentTurn === sym ? 'opacity-100' : 'opacity-40'}`}>
            <span className={`text-2xl font-black ${symbolColor(sym)}`}>{sym}</span>
            <span className="text-sm font-bold text-gray-300">{playerNames[sym]}</span>
            {mySymbol === sym && <span className="text-[10px] text-gray-600">(you)</span>}
          </div>
        ))}
      </div>

      {/* Turn Indicator */}
      <div className="mb-5 text-center">
        <div className="bg-surface-900/60 border border-white/10 px-5 py-2 rounded-full text-sm font-semibold text-gray-300 inline-flex items-center gap-2">
          <span className={`font-black ${symbolColor(gameState.currentTurn)}`}>{gameState.currentTurn}</span>
          {isMyTurn ? "— your turn" : `— ${playerNames[gameState.currentTurn]} is thinking…`}
        </div>
      </div>

      {/* Board */}
      <div className="bg-surface-900/60 border border-white/10 p-4 rounded-2xl mb-6">
        <div className="grid grid-cols-3 gap-3">
          {board.map((cell, index) => (
            <button
              key={index}
              onClick={() => handleCellClick(index)}
              disabled={!!cell || gameState.gameOver || !isMyTurn}
              className={getCellClass(index)}
            >
              {cell && <span className={symbolColor(cell)}>{cell}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
