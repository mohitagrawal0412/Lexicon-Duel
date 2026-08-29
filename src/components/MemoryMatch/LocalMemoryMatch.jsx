import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { generateBoard, MAX_SCORE } from '../../config/memoryMatch';
import { ArrowLeft, Trophy } from 'lucide-react';

export default function LocalMemoryMatch() {
  const navigate = useNavigate();
  const location = useLocation();
  const difficulty = location.state?.difficulty || 'HARD';

  const [scores, setScores] = useState({ p1: 0, p2: 0 });
  const [gameState, setGameState] = useState('MEMORIZE'); // MEMORIZE, PLAYING, ROUND_OVER, GAME_OVER
  
  const [boardData, setBoardData] = useState([]);
  const [roundWinner, setRoundWinner] = useState(null);

  // Player states: which cards are currently flipped up (max 2) and which are permanently matched
  const [p1Flipped, setP1Flipped] = useState([]);
  const [p1Matched, setP1Matched] = useState([]);
  const [p1Locked, setP1Locked] = useState(false); // Locked during the 1s mismatch delay

  const [p2Flipped, setP2Flipped] = useState([]);
  const [p2Matched, setP2Matched] = useState([]);
  const [p2Locked, setP2Locked] = useState(false);

  // Timers for phase transitions
  const phaseTimerRef = useRef(null);

  const startRound = () => {
    setRoundWinner(null);
    setGameState('MEMORIZE');
    
    // Generate identical board logic for both players
    const board = generateBoard(difficulty);
    setBoardData(board);
    
    setP1Flipped([]);
    setP1Matched([]);
    setP1Locked(false);
    
    setP2Flipped([]);
    setP2Matched([]);
    setP2Locked(false);

    // 4 seconds to memorize
    phaseTimerRef.current = setTimeout(() => {
      setGameState('PLAYING');
    }, 4000);
  };

  useEffect(() => {
    startRound();
    return () => clearTimeout(phaseTimerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCardTap = (player, cardIdx) => {
    if (gameState !== 'PLAYING') return;

    const isP1 = player === 'p1';
    const flipped = isP1 ? p1Flipped : p2Flipped;
    const matched = isP1 ? p1Matched : p2Matched;
    const isLocked = isP1 ? p1Locked : p2Locked;

    // Ignore if locked, already matched, or already flipped
    if (isLocked || matched.includes(cardIdx) || flipped.includes(cardIdx)) return;

    const newFlipped = [...flipped, cardIdx];
    
    if (isP1) setP1Flipped(newFlipped);
    else setP2Flipped(newFlipped);

    // Check match if 2 cards flipped
    if (newFlipped.length === 2) {
      if (isP1) setP1Locked(true);
      else setP2Locked(true);

      const [firstIdx, secondIdx] = newFlipped;
      const isMatch = boardData[firstIdx].emoji === boardData[secondIdx].emoji;

      if (isMatch) {
        // MATCH!
        const newMatched = [...matched, firstIdx, secondIdx];
        if (isP1) setP1Matched(newMatched);
        else setP2Matched(newMatched);

        // Check for round win
        if (newMatched.length === boardData.length) {
          endRound(player);
        } else {
          // Clear flipped array immediately to allow next moves
          if (isP1) { setP1Flipped([]); setP1Locked(false); }
          else { setP2Flipped([]); setP2Locked(false); }
        }
      } else {
        // MISMATCH! Wait 1 second then flip back
        setTimeout(() => {
          if (isP1) { setP1Flipped([]); setP1Locked(false); }
          else { setP2Flipped([]); setP2Locked(false); }
        }, 800);
      }
    }
  };

  const endRound = (winner) => {
    setGameState('ROUND_OVER');
    setRoundWinner(winner);

    let newScores = { ...scores };
    newScores[winner] += 1;
    setScores(newScores);

    if (newScores.p1 >= MAX_SCORE || newScores.p2 >= MAX_SCORE) {
      setTimeout(() => setGameState('GAME_OVER'), 2000);
    } else {
      setTimeout(() => startRound(), 3000);
    }
  };

  const renderCard = (player, card, idx) => {
    const isP1 = player === 'p1';
    const flipped = isP1 ? p1Flipped : p2Flipped;
    const matched = isP1 ? p1Matched : p2Matched;

    const isFlipped = gameState === 'MEMORIZE' || flipped.includes(idx) || matched.includes(idx);
    const isMatched = matched.includes(idx);

    return (
      <button
        key={card.id}
        onClick={() => handleCardTap(player, idx)}
        className="relative w-14 h-20 md:w-20 md:h-28 active:scale-95 transition-transform"
        style={{ perspective: '1000px' }}
      >
        <div 
          className="w-full h-full duration-500 relative"
          style={{ 
            transformStyle: 'preserve-3d', 
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' 
          }}
        >
          
          {/* Back of Card (Face Down) */}
          <div 
            className="absolute w-full h-full bg-surface-800 border-2 border-surface-600 rounded-xl shadow-lg flex items-center justify-center"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="w-1/2 h-1/2 bg-surface-700 rounded-full opacity-50"></div>
          </div>
          
          {/* Front of Card (Face Up) */}
          <div 
            className={`absolute w-full h-full rounded-xl shadow-lg flex items-center justify-center text-3xl md:text-5xl border-2
              ${isMatched ? 'bg-surface-700/50 border-green-500/50 opacity-50' : 'bg-surface-700 border-surface-500'}
            `}
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            {card.emoji}
          </div>

        </div>
      </button>
    );
  };

  const renderPlayArea = (player, isTop) => {
    const isWinner = roundWinner === player;
    const isLoser = roundWinner && roundWinner !== player;
    
    const gridCols = difficulty === 'EASY' ? 'grid-cols-4' : 'grid-cols-4';
    const gridRows = difficulty === 'EASY' ? 'grid-rows-3' : 'grid-rows-4';

    return (
      <div 
        className={`relative flex-1 flex flex-col items-center justify-center p-4 transition-colors duration-300
          ${isTop ? 'rotate-180 bg-surface-900 border-b-4 border-p1-500/30' : 'bg-surface-800 border-t-4 border-p2-500/30'}
          ${isWinner ? (isTop ? 'bg-p1-500/20' : 'bg-p2-500/20') : ''}
          ${isLoser ? 'bg-red-500/10' : ''}
        `}
      >
        {/* Score & Status Indicator */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center opacity-50">
          <div className="text-3xl font-black">{scores[player]} <span className="text-sm">PTS</span></div>
          {gameState === 'MEMORIZE' && <div className="text-xl font-bold text-yellow-400 animate-pulse">MEMORIZE!</div>}
        </div>

        {gameState === 'ROUND_OVER' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/40 backdrop-blur-[2px]">
            <div className={`text-5xl font-black mb-2 ${isWinner ? 'text-green-400 animate-bounce-in drop-shadow-lg' : 'text-red-400 opacity-80'}`}>
              {isWinner ? 'BOARD CLEARED!' : 'TOO SLOW'}
            </div>
          </div>
        )}

        <div className={`grid ${gridCols} ${gridRows} gap-2 md:gap-3 ${gameState === 'ROUND_OVER' && isLoser ? 'opacity-30 blur-sm' : ''}`}>
          {boardData.map((card, idx) => renderCard(player, card, idx))}
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-black font-sans select-none">
      
      {/* Player 1 */}
      {renderPlayArea('p1', true)}

      {/* Divider */}
      <div className="absolute top-1/2 left-0 w-full h-2 bg-gradient-to-r from-purple-500 to-pink-500 -translate-y-1/2 flex items-center justify-center z-50">
        <button 
          onClick={() => navigate('/memory-match')}
          className="w-12 h-12 bg-surface-900 rounded-full border-4 border-black flex items-center justify-center text-white hover:scale-110 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.2)]"
        >
          <ArrowLeft size={20} />
        </button>
      </div>

      {/* Player 2 */}
      {renderPlayArea('p2', false)}

      {/* Final Modal */}
      {gameState === 'GAME_OVER' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="bg-surface-900 border border-white/10 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl relative overflow-hidden">
            <Trophy size={64} className={`mx-auto mb-6 ${scores.p1 > scores.p2 ? 'text-p1-400' : 'text-p2-400'}`} />
            <h2 className="text-4xl font-black text-white mb-2">
              {scores.p1 > scores.p2 ? 'PLAYER 1 WINS!' : 'PLAYER 2 WINS!'}
            </h2>
            <p className="text-gray-400 mb-8 text-xl">Final Score: {scores.p1} - {scores.p2}</p>
            
            <div className="flex gap-4">
              <button 
                onClick={() => navigate('/memory-match')}
                className="flex-1 py-4 bg-surface-800 hover:bg-surface-700 text-white rounded-xl font-bold transition-colors"
              >
                Exit
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="flex-1 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white rounded-xl font-bold transition-transform hover:scale-[1.02]"
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
