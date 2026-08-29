import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { generateOddOneOut, MAX_SCORE } from '../../config/oddOneOut';
import { ArrowLeft, Trophy } from 'lucide-react';

export default function LocalOddOneOut() {
  const navigate = useNavigate();
  const location = useLocation();
  const difficulty = location.state?.difficulty || 'MEDIUM';

  const [scores, setScores] = useState({ p1: 0, p2: 0 }); // p1 top, p2 bottom
  const [gameState, setGameState] = useState('PLAYING'); // PLAYING, ROUND_OVER, GAME_OVER
  
  const [roundData, setRoundData] = useState(null);
  const [errorState, setErrorState] = useState({ p1: false, p2: false });
  const [roundWinner, setRoundWinner] = useState(null);

  const startRound = () => {
    setGameState('PLAYING');
    setRoundWinner(null);
    setErrorState({ p1: false, p2: false });
    
    setRoundData(generateOddOneOut(difficulty));
  };

  useEffect(() => {
    startRound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTap = (player, isTarget) => {
    if (gameState !== 'PLAYING' || errorState[player]) return;

    if (isTarget) {
      // WIN ROUND
      setGameState('ROUND_OVER');
      setRoundWinner(player);
      
      const newScores = { ...scores, [player]: scores[player] + 1 };
      setScores(newScores);

      if (newScores[player] >= MAX_SCORE) {
        setTimeout(() => setGameState('GAME_OVER'), 1500);
      } else {
        setTimeout(() => startRound(), 1500);
      }
    } else {
      // INCORRECT - PENALTY
      setErrorState(prev => ({ ...prev, [player]: true }));
      // 1 second penalty for spam tapping
      setTimeout(() => {
        setErrorState(prev => ({ ...prev, [player]: false }));
      }, 1000);
    }
  };

  const renderGridItem = (player, item) => {
    const isColorMode = item.type === 'COLOR';
    const isTextMode = item.type === 'TEXT';
    
    let className = `flex items-center justify-center rounded-lg shadow-sm transition-transform active:scale-90 select-none cursor-pointer `;
    
    if (isColorMode) {
      className += `w-full h-full ${item.content}`;
    } else {
      className += `w-full h-full bg-surface-700 border border-white/5 hover:bg-surface-600 text-white font-black `;
      if (difficulty === 'EASY') className += 'text-3xl md:text-5xl ';
      else className += 'text-2xl md:text-4xl ';
    }

    // Highlight target if round is over
    if (gameState === 'ROUND_OVER' && item.isTarget) {
      className += ' ring-4 ring-green-400 animate-pulse scale-110 z-10 ';
    }

    return (
      <button
        key={item.id}
        onClick={() => handleTap(player, item.isTarget)}
        disabled={gameState !== 'PLAYING' || errorState[player]}
        className={className}
      >
        {!isColorMode && item.content}
      </button>
    );
  };

  const renderPlayArea = (player, isTop) => {
    const isP1 = player === 'p1';
    const isWinner = roundWinner === player;
    const isLoser = roundWinner && roundWinner !== player;
    const hasError = errorState[player];
    
    if (!roundData) return null;

    const gridColsClass = 
      roundData.size === 4 ? 'grid-cols-4' : 
      roundData.size === 5 ? 'grid-cols-5' : 'grid-cols-6';

    const gridGapClass = roundData.size === 6 ? 'gap-1 md:gap-2' : 'gap-2 md:gap-3';
    
    // Size constraints so the grid is perfectly square and fits half the screen
    const gridContainerClass = `grid ${gridColsClass} ${gridGapClass} w-full max-w-[320px] aspect-square mx-auto`;

    return (
      <div 
        className={`relative flex-1 flex flex-col items-center justify-center p-4 transition-colors duration-300
          ${isTop ? 'rotate-180 bg-surface-900 border-b-4 border-p1-500/30' : 'bg-surface-800 border-t-4 border-p2-500/30'}
          ${isWinner ? (isTop ? 'bg-p1-500/20' : 'bg-p2-500/20') : ''}
          ${isLoser ? 'bg-red-500/10' : ''}
          ${hasError ? 'bg-red-500/20' : ''}
        `}
      >
        {/* Score Indicator */}
        <div className="absolute top-4 left-4 text-3xl font-black opacity-30">
          {scores[player]} <span className="text-sm">PTS</span>
        </div>

        {gameState === 'ROUND_OVER' && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <div className={`text-5xl font-black ${isWinner ? 'text-green-400 animate-bounce-in drop-shadow-lg' : 'text-red-400 opacity-30'}`}>
              {isWinner ? '+1 POINT' : 'TOO SLOW'}
            </div>
          </div>
        )}

        <div className={`w-full flex flex-col items-center ${gameState === 'ROUND_OVER' && isLoser ? 'opacity-30 blur-sm' : ''} ${hasError ? 'animate-shake' : ''}`}>
          
          <div className={gridContainerClass}>
            {roundData.grid.map(item => renderGridItem(player, item))}
          </div>

          {/* Error Message */}
          <div className="h-6 mt-4">
            {hasError && <span className="text-red-400 font-bold bg-black/50 px-3 py-1 rounded-full">Wrong! 1s Penalty...</span>}
          </div>

        </div>
      </div>
    );
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-black font-sans select-none">
      
      {/* Player 1 (Top, rotated) */}
      {renderPlayArea('p1', true)}

      {/* Center Divider / Exit Button */}
      <div className="absolute top-1/2 left-0 w-full h-2 bg-gradient-to-r from-blue-400 to-indigo-500 -translate-y-1/2 flex items-center justify-center z-50">
        <button 
          onClick={() => navigate('/odd-one-out')}
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
              {scores.p1 > scores.p2 ? 'PLAYER 1 WINS!' : 'PLAYER 2 WINS!'}
            </h2>
            <p className="text-gray-400 mb-8 text-xl">Final Score: {scores.p1} - {scores.p2}</p>
            
            <div className="flex gap-4">
              <button 
                onClick={() => navigate('/odd-one-out')}
                className="flex-1 py-4 bg-surface-800 hover:bg-surface-700 text-white rounded-xl font-bold transition-colors"
              >
                Exit
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white rounded-xl font-bold transition-transform hover:scale-[1.02]"
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
