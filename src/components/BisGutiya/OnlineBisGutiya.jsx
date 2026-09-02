import React, { useState, useEffect, useRef } from 'react';
import { updatePartyRoom } from '../../services/roomService';
import { concludeGameAndReturnToLobby } from '../../services/relationshipService';
import { getInitialBoard } from '../../config/bisGutiyaGraph';
import { getValidMoves, applyMove, checkWinCondition } from '../../engine/bisGutiyaEngine';
import BisGutiyaBoard from './BisGutiyaBoard';
import { Clock, Trophy } from 'lucide-react';

const TURN_TIME = 30;

export default function OnlineBisGutiya({ room, roomId, isHost, user }) {
  // We need to initialize the game state if it doesn't exist yet
  useEffect(() => {
    if (isHost && (!room.gameState || room.gameState === 'initializing')) {
      updatePartyRoom(roomId, {
        gameState: {
          board: getInitialBoard(),
          activePlayer: 1, // 1 for host, -1 for guest
          timeLeft: TURN_TIME,
          mustJumpPiece: null,
          winner: null,
          winReason: '',
          lastMoveTime: Date.now()
        }
      });
    }
  }, [isHost, room.gameState, roomId]);

  if (!room.gameState || typeof room.gameState === 'string') {
    return <div className="text-white text-center p-10">Initializing Game...</div>;
  }
  return <InnerOnlineBisGutiya room={room} roomId={roomId} isHost={isHost} user={user} />;
}

function InnerOnlineBisGutiya({ room, roomId, isHost, user }) {

  const { board, activePlayer, timeLeft, mustJumpPiece, winner, winReason, lastMoveTime } = room.gameState;
  const myPlayerNum = isHost ? 1 : -1;
  const isMyTurn = activePlayer === myPlayerNum;

  // Derive state that doesn't need to be synced directly from DB
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [validMoves, setValidMoves] = useState([]);

  // Compute valid moves locally for the current player
  useEffect(() => {
    if (winner !== null || !isMyTurn) {
      setValidMoves([]);
      return;
    }

    if (mustJumpPiece !== null) {
      const allMoves = getValidMoves(board, activePlayer);
      setValidMoves(allMoves.filter(m => m.piece === mustJumpPiece && m.isJump));
      setSelectedPiece(mustJumpPiece);
    } else {
      const moves = getValidMoves(board, activePlayer);
      setValidMoves(moves);
      setSelectedPiece(null);

      // Blockade check
      if (moves.length === 0) {
        handleWin(-activePlayer, 'Blockade - No legal moves left');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, activePlayer, mustJumpPiece, winner, isMyTurn]);

  // Host-controlled timer
  useEffect(() => {
    if (!isHost || winner !== null) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastMoveTime) / 1000);
      const newTime = Math.max(0, TURN_TIME - elapsed);
      
      if (newTime !== timeLeft) {
        updatePartyRoom(roomId, { 'gameState/timeLeft': newTime });
      }

      if (newTime <= 0) {
        clearInterval(interval);
        handleWin(-activePlayer, 'Time Out');
      }
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, winner, lastMoveTime, activePlayer, timeLeft]);

  const handleWin = async (winPlayerNum, reason) => {
    await updatePartyRoom(roomId, {
      'gameState/winner': winPlayerNum,
      'gameState/winReason': reason
    });
  };

  const handlePieceClick = (pieceIndex) => {
    if (!isMyTurn || mustJumpPiece !== null || winner !== null) return;
    if (board[pieceIndex] !== myPlayerNum) return;
    
    if (validMoves.some(m => m.piece === pieceIndex)) {
      setSelectedPiece(pieceIndex === selectedPiece ? null : pieceIndex);
    }
  };

  const handleMoveClick = async (move) => {
    if (!isMyTurn) return;

    const { newBoard, multiJumpAvailable, newActivePiece } = applyMove(board, move);
    
    let updates = {
      'gameState/board': newBoard,
      'gameState/lastMoveTime': Date.now()
    };

    const winStatus = checkWinCondition(newBoard, activePlayer);
    if (winStatus !== 0) {
      updates['gameState/winner'] = winStatus;
      updates['gameState/winReason'] = winStatus === activePlayer ? 'Elimination' : 'Blockade';
      updates['gameState/mustJumpPiece'] = null;
    } else if (multiJumpAvailable) {
      updates['gameState/mustJumpPiece'] = newActivePiece;
    } else {
      updates['gameState/mustJumpPiece'] = null;
      updates['gameState/activePlayer'] = -activePlayer;
      updates['gameState/timeLeft'] = TURN_TIME;
    }

    // Optimistically update local state not needed here since onValue will push it down fast
    // but clearing selected piece is good UX
    setSelectedPiece(null);
    await updatePartyRoom(roomId, updates);
  };

  const p1Count = board.filter(x => x === 1).length;
  const p2Count = board.filter(x => x === -1).length;
  const hostName = room.host.displayName;
  const guestName = room.guest?.displayName || 'Guest';

  return (
    <div className="h-full pt-16 flex flex-col p-4 animate-fade-in relative max-w-4xl mx-auto">
      
      {/* Game Info HUD */}
      <div className="grid grid-cols-3 gap-2 md:gap-4 w-full mb-6">
        <div className={`p-3 md:p-4 rounded-2xl border-2 transition-all ${activePlayer === 1 && !winner ? 'bg-p1-500/20 border-p1-500 scale-105' : 'bg-surface-900/50 border-transparent'} flex flex-col items-center justify-center`}>
          <div className="text-p1-400 font-bold mb-1 text-sm md:text-base">{hostName}</div>
          <div className="text-2xl md:text-3xl font-black text-white">{p1Count} <span className="text-xs text-gray-500">left</span></div>
        </div>
        
        <div className="flex flex-col items-center justify-center">
          <div className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-2 flex items-center gap-1">
            <Clock size={14} /> {isMyTurn ? "Your Turn" : "Thinking..."}
          </div>
          <div className={`text-4xl md:text-5xl font-black transition-colors ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
            {timeLeft}s
          </div>
        </div>

        <div className={`p-3 md:p-4 rounded-2xl border-2 transition-all ${activePlayer === -1 && !winner ? 'bg-p2-500/20 border-p2-500 scale-105' : 'bg-surface-900/50 border-transparent'} flex flex-col items-center justify-center`}>
          <div className="text-p2-400 font-bold mb-1 text-sm md:text-base">{guestName}</div>
          <div className="text-2xl md:text-3xl font-black text-white">{p2Count} <span className="text-xs text-gray-500">left</span></div>
        </div>
      </div>

      {mustJumpPiece !== null && !winner && isMyTurn && (
        <div className="max-w-md mx-auto w-full bg-yellow-500/20 border border-yellow-500/50 text-yellow-200 text-center font-bold py-2 rounded-xl mb-4 animate-pulse">
          Chain Jump Available! You must continue jumping.
        </div>
      )}

      {/* Board */}
      <div className="flex-1 flex items-center justify-center">
        <BisGutiyaBoard 
          board={board}
          activePlayer={activePlayer}
          selectedPiece={selectedPiece}
          validMoves={validMoves}
          onPieceClick={handlePieceClick}
          onMoveClick={handleMoveClick}
        />
      </div>

      {/* Victory Overlay */}
      {winner !== null && (
        <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in rounded-3xl">
          <div className="bg-surface-900 border border-white/10 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-full h-2 ${winner === 1 ? 'bg-p1-500 glow-p1' : 'bg-p2-500 glow-p2'}`} />
            
            <Trophy size={64} className={`mx-auto mb-6 ${winner === 1 ? 'text-p1-400' : 'text-p2-400'}`} />
            <h2 className="text-3xl font-black text-white mb-2">
              {winner === 1 ? hostName : guestName} WINS!
            </h2>
            <p className="text-gray-400 mb-2">{winReason}</p>
            {winner === myPlayerNum ? (
              <p className="text-emerald-400 font-bold mb-8 text-xl">Victory!</p>
            ) : (
              <p className="text-red-400 font-bold mb-8 text-xl">Defeat</p>
            )}
            
            {isHost ? (
              <button 
                onClick={() => concludeGameAndReturnToLobby(roomId, room.host, room.guest, 'bisGutiya', winner === 1 ? 1 : 0, winner === -1 ? 1 : 0)}
                className="w-full py-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white rounded-xl font-bold transition-all hover:scale-[1.02]"
              >
                Return to Party Lobby
              </button>
            ) : (
              <div className="text-gray-400 text-sm font-bold animate-pulse">Waiting for host to return to lobby...</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
