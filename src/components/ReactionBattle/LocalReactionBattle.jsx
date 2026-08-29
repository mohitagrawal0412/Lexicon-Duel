import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateRound, MAX_SCORE } from '../../config/reactionBattle';
import { ArrowLeft, Trophy } from 'lucide-react';

export default function LocalReactionBattle() {
  const navigate = useNavigate();

  const [scores, setScores] = useState({ p1: 0, p2: 0 }); // p1 is top, p2 is bottom
  const [gameState, setGameState] = useState('READY'); // READY, DELAY, ACTIVE, ROUND_OVER, GAME_OVER
  const [roundData, setRoundData] = useState(null);
  const [roundWinner, setRoundWinner] = useState(null); // 'p1' or 'p2'
  const [winReason, setWinReason] = useState('');

  const delayTimerRef = useRef(null);

  const startRound = () => {
    setGameState('DELAY');
    setRoundWinner(null);
    setRoundData(generateRound());

    // Random delay between 1.5s and 4.5s
    const delay = Math.floor(Math.random() * 3000) + 1500;
    delayTimerRef.current = setTimeout(() => {
      setGameState('ACTIVE');
    }, delay);
  };

  useEffect(() => {
    // Start first round on mount
    startRound();
    return () => clearTimeout(delayTimerRef.current);
  }, []);

  const handleTap = (player, isTarget) => {
    if (gameState === 'ROUND_OVER' || gameState === 'GAME_OVER') return;

    if (gameState === 'DELAY') {
      // False start! Opponent gets the point
      clearTimeout(delayTimerRef.current);
      const winner = player === 'p1' ? 'p2' : 'p1';
      endRound(winner, 'False Start!');
      return;
    }

    if (gameState === 'ACTIVE') {
      if (isTarget) {
        endRound(player, 'Fastest Reaction!');
      } else {
        // Tapped wrong item, opponent gets point
        const winner = player === 'p1' ? 'p2' : 'p1';
        endRound(winner, 'Wrong Target!');
      }
    }
  };

  const endRound = (winner, reason) => {
    setGameState('ROUND_OVER');
    setRoundWinner(winner);
    setWinReason(reason);

    const newScores = { ...scores, [winner]: scores[winner] + 1 };
    setScores(newScores);

    if (newScores[winner] >= MAX_SCORE) {
      setTimeout(() => setGameState('GAME_OVER'), 1500);
    } else {
      setTimeout(() => startRound(), 2500);
    }
  };

  const renderPlayArea = (player, isTop) => {
    const isWinner = roundWinner === player;
    const isLoser = roundWinner && roundWinner !== player;

    return (
      <div 
        className={`relative flex-1 flex flex-col items-center justify-center p-8 transition-colors duration-300
          ${isTop ? 'rotate-180 bg-surface-900 border-b-4 border-p1-500/30' : 'bg-surface-800 border-t-4 border-p2-500/30'}
          ${isWinner ? (isTop ? 'bg-p1-500/20' : 'bg-p2-500/20') : ''}
          ${isLoser ? 'bg-red-500/10' : ''}
        `}
        onClick={() => {
          // If they tap the background during delay, it's a false start
          if (gameState === 'DELAY') handleTap(player, false);
        }}
      >
        {/* Score Indicator */}
        <div className="absolute top-4 right-4 text-4xl font-black opacity-30">
          {scores[player]}
        </div>

        {/* State Messaging */}
        {gameState === 'READY' && <div className="text-2xl font-bold animate-pulse">Get Ready...</div>}
        {gameState === 'DELAY' && <div className="text-2xl font-bold animate-pulse">Wait for it...</div>}
        
        {gameState === 'ROUND_OVER' && (
          <div className="text-center animate-bounce-in z-10">
            <div className={`text-4xl font-black mb-2 ${isWinner ? 'text-green-400' : 'text-red-400'}`}>
              {isWinner ? '+1 POINT' : 'TOO SLOW'}
            </div>
            <div className="text-gray-400">{winReason}</div>
          </div>
        )}

        {/* Targets */}
        {gameState === 'ACTIVE' && roundData && (
          <div className="flex flex-wrap items-center justify-center gap-6 max-w-sm mx-auto z-10">
            {roundData.items.map((item, idx) => (
              <div 
                key={`${player}-${item.id}-${idx}`}
                className={item.className}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent background click false-start
                  handleTap(player, item.isTarget);
                }}
              >
                {item.content}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-black font-sans">
      
      {/* Player 1 (Top, rotated) */}
      {renderPlayArea('p1', true)}

      {/* Center Divider / Exit Button */}
      <div className="absolute top-1/2 left-0 w-full h-2 bg-gradient-to-r from-p1-500 to-p2-500 -translate-y-1/2 flex items-center justify-center z-50">
        <button 
          onClick={() => navigate('/reaction-battle')}
          className="w-12 h-12 bg-surface-900 rounded-full border-4 border-black flex items-center justify-center text-white hover:scale-110 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.2)]"
        >
          <ArrowLeft size={20} />
        </button>
      </div>

      {/* Player 2 (Bottom) */}
      {renderPlayArea('p2', false)}

      {/* Game Over Modal */}
      {gameState === 'GAME_OVER' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="bg-surface-900 border border-white/10 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl relative overflow-hidden">
            <Trophy size={64} className={`mx-auto mb-6 ${scores.p1 > scores.p2 ? 'text-p1-400' : 'text-p2-400'}`} />
            <h2 className="text-4xl font-black text-white mb-2">
              {scores.p1 > scores.p2 ? 'PLAYER 1' : 'PLAYER 2'} WINS!
            </h2>
            <p className="text-gray-400 mb-8 text-xl">{scores.p1} - {scores.p2}</p>
            
            <div className="flex gap-4">
              <button 
                onClick={() => navigate('/reaction-battle')}
                className="flex-1 py-4 bg-surface-800 hover:bg-surface-700 text-white rounded-xl font-bold transition-colors"
              >
                Exit
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-500 hover:to-green-500 text-white rounded-xl font-bold transition-transform hover:scale-[1.02]"
              >
                Rematch
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
