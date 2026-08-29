import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { generateMissingLetter, MAX_SCORE } from '../../config/missingLetter';
import { ArrowLeft, Trophy } from 'lucide-react';

export default function LocalMissingLetter() {
  const navigate = useNavigate();
  const location = useLocation();
  const category = location.state?.category || 'RANDOM';

  const [scores, setScores] = useState({ p1: 0, p2: 0 }); // p1 top, p2 bottom
  const [gameState, setGameState] = useState('PLAYING'); // PLAYING, ROUND_OVER, GAME_OVER
  
  const [roundData, setRoundData] = useState(null);
  const [errorState, setErrorState] = useState({ p1: false, p2: false });
  const [roundWinner, setRoundWinner] = useState(null);

  const startRound = () => {
    setGameState('PLAYING');
    setRoundWinner(null);
    setErrorState({ p1: false, p2: false });
    
    setRoundData(generateMissingLetter(category));
  };

  useEffect(() => {
    startRound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleKeyPress = (player, key) => {
    if (gameState !== 'PLAYING' || errorState[player]) return;

    if (key === roundData.missingLetter) {
      // WIN ROUND
      setGameState('ROUND_OVER');
      setRoundWinner(player);
      
      const newScores = { ...scores, [player]: scores[player] + 1 };
      setScores(newScores);

      if (newScores[player] >= MAX_SCORE) {
        setTimeout(() => setGameState('GAME_OVER'), 1500);
      } else {
        setTimeout(() => startRound(), 2000);
      }
    } else {
      // INCORRECT
      setErrorState(prev => ({ ...prev, [player]: true }));
      // Penalty timeout
      setTimeout(() => {
        setErrorState(prev => ({ ...prev, [player]: false }));
      }, 800);
    }
  };

  const renderKeyboard = (player) => {
    const rows = [
      ['Q','W','E','R','T','Y','U','I','O','P'],
      ['A','S','D','F','G','H','J','K','L'],
      ['Z','X','C','V','B','N','M']
    ];

    return (
      <div className="flex flex-col gap-1 md:gap-2 items-center w-full max-w-lg mt-8">
        {rows.map((row, rowIdx) => (
          <div key={rowIdx} className="flex gap-1 md:gap-2 justify-center w-full">
            {row.map(key => (
              <button
                key={key}
                onClick={() => handleKeyPress(player, key)}
                disabled={gameState !== 'PLAYING' || errorState[player]}
                className="flex-1 max-w-[40px] h-12 md:h-14 bg-surface-700 hover:bg-surface-600 rounded-lg text-white font-bold text-lg md:text-xl shadow-md transition-transform active:scale-90 disabled:opacity-50"
              >
                {key}
              </button>
            ))}
          </div>
        ))}
      </div>
    );
  };

  const renderPlayArea = (player, isTop) => {
    const isP1 = player === 'p1';
    const isWinner = roundWinner === player;
    const isLoser = roundWinner && roundWinner !== player;
    const hasError = errorState[player];
    
    return (
      <div 
        className={`relative flex-1 flex flex-col items-center justify-center p-4 md:p-8 transition-colors duration-300
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
        
        {/* Category Indicator */}
        <div className="absolute top-4 right-4 text-xs font-bold text-gray-400 tracking-widest border border-gray-600 px-3 py-1 rounded-full">
          {roundData?.categoryName}
        </div>

        {gameState === 'ROUND_OVER' && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <div className={`text-5xl font-black ${isWinner ? 'text-green-400 animate-bounce-in' : 'text-red-400 opacity-50'}`}>
              {isWinner ? '+1 POINT' : 'TOO SLOW'}
            </div>
          </div>
        )}

        <div className={`w-full flex flex-col items-center ${gameState === 'ROUND_OVER' && isLoser ? 'opacity-30 blur-sm' : ''} ${hasError ? 'animate-shake' : ''}`}>
          
          {/* Word Display */}
          <div className="flex gap-2 md:gap-4 justify-center">
            {roundData?.displayArray.map((char, idx) => (
              <div 
                key={idx}
                className={`w-10 h-14 md:w-12 md:h-16 flex items-center justify-center text-3xl md:text-4xl font-black rounded-lg border-b-4
                  ${char === '_' 
                    ? (gameState === 'ROUND_OVER' ? 'text-green-400 border-green-500' : 'text-yellow-400 border-yellow-500 animate-pulse') 
                    : 'text-white border-surface-600 bg-surface-700'
                  }
                `}
              >
                {char === '_' && gameState === 'ROUND_OVER' ? roundData.missingLetter : char}
              </div>
            ))}
          </div>

          {/* Error Message */}
          <div className="h-6 mt-4">
            {hasError && <span className="text-red-400 font-bold">Wrong letter! Time penalty...</span>}
          </div>

          {/* Keyboard */}
          {renderKeyboard(player)}

        </div>
      </div>
    );
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-black font-sans select-none">
      
      {/* Player 1 (Top, rotated) */}
      {renderPlayArea('p1', true)}

      {/* Center Divider / Exit Button */}
      <div className="absolute top-1/2 left-0 w-full h-2 bg-gradient-to-r from-teal-400 to-emerald-500 -translate-y-1/2 flex items-center justify-center z-50">
        <button 
          onClick={() => navigate('/missing-letter')}
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
                onClick={() => navigate('/missing-letter')}
                className="flex-1 py-4 bg-surface-800 hover:bg-surface-700 text-white rounded-xl font-bold transition-colors"
              >
                Exit
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="flex-1 py-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white rounded-xl font-bold transition-transform hover:scale-[1.02]"
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
