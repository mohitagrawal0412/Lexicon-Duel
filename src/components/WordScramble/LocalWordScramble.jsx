import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { generateScramble, MAX_SCORE } from '../../config/wordScramble';
import { ArrowLeft, Trophy } from 'lucide-react';

export default function LocalWordScramble() {
  const navigate = useNavigate();
  const location = useLocation();
  const difficulty = location.state?.difficulty || 'MEDIUM';

  const [scores, setScores] = useState({ p1: 0, p2: 0 }); // p1 top, p2 bottom
  const [gameState, setGameState] = useState('PLAYING'); // PLAYING, ROUND_OVER, GAME_OVER
  
  const [targetWord, setTargetWord] = useState('');
  const [availableLetters, setAvailableLetters] = useState({ p1: [], p2: [] });
  const [placedLetters, setPlacedLetters] = useState({ p1: [], p2: [] });
  const [errorState, setErrorState] = useState({ p1: false, p2: false });
  const [roundWinner, setRoundWinner] = useState(null);

  const startRound = () => {
    setGameState('PLAYING');
    setRoundWinner(null);
    setErrorState({ p1: false, p2: false });
    
    const scramble = generateScramble(difficulty);
    setTargetWord(scramble.word);
    
    setAvailableLetters({
      p1: [...scramble.letters],
      p2: [...scramble.letters]
    });
    setPlacedLetters({ p1: [], p2: [] });
  };

  useEffect(() => {
    startRound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTapAvailable = (player, letterObj) => {
    if (gameState !== 'PLAYING') return;

    // Move from available to placed
    setAvailableLetters(prev => ({
      ...prev,
      [player]: prev[player].filter(l => l.id !== letterObj.id)
    }));
    
    setPlacedLetters(prev => {
      const newPlaced = [...prev[player], letterObj];
      
      // Auto-check if word is fully formed
      if (newPlaced.length === targetWord.length) {
        checkAnswer(player, newPlaced);
      }
      
      return { ...prev, [player]: newPlaced };
    });
  };

  const handleTapPlaced = (player, letterObj) => {
    if (gameState !== 'PLAYING') return;

    // Move from placed back to available
    setPlacedLetters(prev => ({
      ...prev,
      [player]: prev[player].filter(l => l.id !== letterObj.id)
    }));
    
    setAvailableLetters(prev => ({
      ...prev,
      [player]: [...prev[player], letterObj]
    }));
    
    // Clear error state if any
    setErrorState(prev => ({ ...prev, [player]: false }));
  };

  const checkAnswer = (player, placedArr) => {
    const formedWord = placedArr.map(l => l.char).join('');
    
    if (formedWord === targetWord) {
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
      // Auto reset error after 500ms
      setTimeout(() => {
        setErrorState(prev => ({ ...prev, [player]: false }));
      }, 500);
    }
  };

  const renderPlayArea = (player, isTop) => {
    const isP1 = player === 'p1';
    const isWinner = roundWinner === player;
    const isLoser = roundWinner && roundWinner !== player;
    const hasError = errorState[player];
    
    const placed = placedLetters[player] || [];
    const available = availableLetters[player] || [];
    const emptySlotsCount = targetWord.length - placed.length;

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

        {gameState === 'ROUND_OVER' && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <div className={`text-5xl font-black ${isWinner ? 'text-green-400 animate-bounce-in' : 'text-red-400 opacity-50'}`}>
              {isWinner ? '+1 POINT' : 'TOO SLOW'}
            </div>
          </div>
        )}

        <div className={`w-full max-w-lg flex flex-col items-center gap-8 ${gameState === 'ROUND_OVER' && isLoser ? 'opacity-30 blur-sm' : ''} ${hasError ? 'animate-shake' : ''}`}>
          
          {/* Answer Slots */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-3">
            {placed.map((l, idx) => (
              <button
                key={l.id}
                onClick={() => handleTapPlaced(player, l)}
                disabled={gameState !== 'PLAYING'}
                className={`w-12 h-14 md:w-16 md:h-20 flex items-center justify-center rounded-xl font-black text-2xl md:text-4xl text-white shadow-lg transition-transform active:scale-90
                  ${hasError ? 'bg-red-500 border-b-4 border-red-700' : 
                    isWinner ? 'bg-green-500 border-b-4 border-green-700' : 
                    isP1 ? 'bg-p1-500 border-b-4 border-p1-700' : 'bg-p2-500 border-b-4 border-p2-700'
                  }
                `}
              >
                {l.char}
              </button>
            ))}
            {/* Empty Slots */}
            {Array.from({ length: emptySlotsCount }).map((_, idx) => (
              <div 
                key={`empty-${idx}`} 
                className="w-12 h-14 md:w-16 md:h-20 rounded-xl border-2 border-dashed border-white/20 bg-surface-700/50"
              />
            ))}
          </div>

          <div className="w-full h-px bg-white/10" />

          {/* Available Letters Pool */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-3">
            {available.map(l => (
              <button
                key={l.id}
                onClick={() => handleTapAvailable(player, l)}
                disabled={gameState !== 'PLAYING'}
                className="w-12 h-14 md:w-16 md:h-20 flex items-center justify-center rounded-xl bg-surface-700 border-b-4 border-surface-900 font-black text-2xl md:text-4xl text-gray-300 shadow-md hover:bg-surface-600 transition-transform active:scale-90"
              >
                {l.char}
              </button>
            ))}
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
      <div className="absolute top-1/2 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-red-500 -translate-y-1/2 flex items-center justify-center z-50">
        <button 
          onClick={() => navigate('/word-scramble')}
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
                onClick={() => navigate('/word-scramble')}
                className="flex-1 py-4 bg-surface-800 hover:bg-surface-700 text-white rounded-xl font-bold transition-colors"
              >
                Exit
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="flex-1 py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white rounded-xl font-bold transition-transform hover:scale-[1.02]"
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
