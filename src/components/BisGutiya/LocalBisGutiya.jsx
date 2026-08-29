import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInitialBoard } from '../../config/bisGutiyaGraph';
import { getValidMoves, applyMove, checkWinCondition } from '../../engine/bisGutiyaEngine';
import BisGutiyaBoard from './BisGutiyaBoard';
import { ArrowLeft, Clock, Trophy } from 'lucide-react';

const TURN_TIME = 30; // 30 seconds per turn

export default function LocalBisGutiya() {
  const navigate = useNavigate();
  
  const [board, setBoard] = useState(getInitialBoard());
  const [activePlayer, setActivePlayer] = useState(1); // 1 = P1, -1 = P2
  const [timeLeft, setTimeLeft] = useState(TURN_TIME);
  
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [mustJumpPiece, setMustJumpPiece] = useState(null); // Used for multi-jumps

  const [winner, setWinner] = useState(null); // 1, -1, or null
  const [winReason, setWinReason] = useState(''); // 'Elimination', 'Blockade', 'Time Out'

  const timerRef = useRef(null);

  // Compute valid moves when turn changes or multi-jump state changes
  useEffect(() => {
    if (winner !== null) return;

    if (mustJumpPiece !== null) {
      // Filter valid moves to only jumps from the mustJumpPiece
      const allMoves = getValidMoves(board, activePlayer);
      setValidMoves(allMoves.filter(m => m.piece === mustJumpPiece && m.isJump));
      setSelectedPiece(mustJumpPiece); // Auto select
    } else {
      const moves = getValidMoves(board, activePlayer);
      setValidMoves(moves);
      setSelectedPiece(null);

      if (moves.length === 0) {
        // Blockade
        handleWin(-activePlayer, 'Blockade - No legal moves left');
      }
    }
  }, [board, activePlayer, mustJumpPiece, winner]);

  // Timer Logic
  useEffect(() => {
    if (winner !== null) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleWin(-activePlayer, 'Time Out');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [activePlayer, winner]);

  const handleWin = (winPlayer, reason) => {
    clearInterval(timerRef.current);
    setWinner(winPlayer);
    setWinReason(reason);
  };

  const handlePieceClick = (pieceIndex) => {
    if (mustJumpPiece !== null) return; // Cannot change piece during multi-jump
    if (board[pieceIndex] !== activePlayer) return;
    
    // Only allow selecting pieces that have valid moves
    if (validMoves.some(m => m.piece === pieceIndex)) {
      setSelectedPiece(pieceIndex === selectedPiece ? null : pieceIndex);
    }
  };

  const handleMoveClick = (move) => {
    const { newBoard, multiJumpAvailable, newActivePiece } = applyMove(board, move);
    setBoard(newBoard);

    const winStatus = checkWinCondition(newBoard, activePlayer);
    if (winStatus !== 0) {
      handleWin(winStatus, winStatus === activePlayer ? 'Elimination' : 'Blockade');
      return;
    }

    if (multiJumpAvailable) {
      setMustJumpPiece(newActivePiece);
      // Keep same active player, timer does NOT reset (or we could reset it, let's not for tension)
    } else {
      // End turn
      setMustJumpPiece(null);
      setActivePlayer(-activePlayer);
      setTimeLeft(TURN_TIME);
    }
  };

  const p1Count = board.filter(x => x === 1).length;
  const p2Count = board.filter(x => x === -1).length;

  return (
    <div className="min-h-screen game-bg flex flex-col p-4 md:p-8 animate-fade-in relative">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8 max-w-4xl mx-auto w-full">
        <button 
          onClick={() => navigate('/bis-gutiya')}
          className="p-3 bg-surface-800/80 hover:bg-surface-800 text-white rounded-full transition-colors border border-white/10"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="text-center">
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
            Bis gutiya
          </h1>
          <div className="text-sm font-bold text-gray-500">Local Match</div>
        </div>
        <div className="w-12"></div>
      </div>

      {/* Game Info HUD */}
      <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto w-full mb-8">
        <div className={`p-4 rounded-2xl border-2 transition-all ${activePlayer === 1 && !winner ? 'bg-p1-500/20 border-p1-500 scale-105' : 'bg-surface-900/50 border-transparent'} flex flex-col items-center justify-center`}>
          <div className="text-p1-400 font-bold mb-1">Player 1</div>
          <div className="text-3xl font-black text-white">{p1Count} <span className="text-sm text-gray-500">left</span></div>
        </div>
        
        <div className="flex flex-col items-center justify-center">
          <div className="text-gray-400 font-bold text-sm uppercase tracking-widest mb-2 flex items-center gap-1">
            <Clock size={16} /> Timer
          </div>
          <div className={`text-5xl font-black transition-colors ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
            {timeLeft}s
          </div>
        </div>

        <div className={`p-4 rounded-2xl border-2 transition-all ${activePlayer === -1 && !winner ? 'bg-p2-500/20 border-p2-500 scale-105' : 'bg-surface-900/50 border-transparent'} flex flex-col items-center justify-center`}>
          <div className="text-p2-400 font-bold mb-1">Player 2</div>
          <div className="text-3xl font-black text-white">{p2Count} <span className="text-sm text-gray-500">left</span></div>
        </div>
      </div>

      {mustJumpPiece !== null && !winner && (
        <div className="max-w-md mx-auto w-full bg-yellow-500/20 border border-yellow-500/50 text-yellow-200 text-center font-bold py-2 rounded-xl mb-4 animate-pulse">
          Chain Jump Available! You must continue jumping.
        </div>
      )}

      {/* Board */}
      <BisGutiyaBoard 
        board={board}
        activePlayer={activePlayer}
        selectedPiece={selectedPiece}
        validMoves={validMoves}
        onPieceClick={handlePieceClick}
        onMoveClick={handleMoveClick}
      />

      {/* Victory Modal */}
      {winner !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-900 border border-white/10 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-full h-2 ${winner === 1 ? 'bg-p1-500 glow-p1' : 'bg-p2-500 glow-p2'}`} />
            
            <Trophy size={64} className={`mx-auto mb-6 ${winner === 1 ? 'text-p1-400' : 'text-p2-400'}`} />
            <h2 className="text-4xl font-black text-white mb-2">
              {winner === 1 ? 'PLAYER 1' : 'PLAYER 2'} WINS!
            </h2>
            <p className="text-gray-400 mb-8">{winReason}</p>
            
            <div className="flex gap-4">
              <button 
                onClick={() => navigate('/bis-gutiya')}
                className="flex-1 py-4 bg-surface-800 hover:bg-surface-700 text-white rounded-xl font-bold transition-colors"
              >
                Exit
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-bold transition-transform hover:scale-[1.02]"
              >
                Play Again
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
