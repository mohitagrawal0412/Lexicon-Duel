import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUND_LENGTHS, MEMORY_TIME_MS, generateSequence, calculateScore } from '../../config/numberMemory';
import { ArrowLeft, Trophy, Check, X, Delete } from 'lucide-react';

export default function LocalNumberMemory() {
  const navigate = useNavigate();

  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [scores, setScores] = useState({ p1: 0, p2: 0 }); // p1 top, p2 bottom
  
  // States: READY (Get Ready), MEMORIZE (Showing numbers), RECALL (Numpad), ROUND_OVER (Results), GAME_OVER (Final)
  const [gameState, setGameState] = useState('READY'); 
  const [targetSequence, setTargetSequence] = useState('');
  
  const [inputs, setInputs] = useState({ p1: '', p2: '' });
  const [submitted, setSubmitted] = useState({ p1: false, p2: false });
  const [roundResults, setRoundResults] = useState(null);

  const timerRef = useRef(null);

  const startRound = (roundIdx) => {
    setCurrentRoundIndex(roundIdx);
    setInputs({ p1: '', p2: '' });
    setSubmitted({ p1: false, p2: false });
    setRoundResults(null);
    setGameState('READY');

    const seq = generateSequence(ROUND_LENGTHS[roundIdx]);
    setTargetSequence(seq);

    // Get Ready -> Memorize
    setTimeout(() => {
      setGameState('MEMORIZE');
      
      // Memorize -> Recall
      timerRef.current = setTimeout(() => {
        setGameState('RECALL');
      }, MEMORY_TIME_MS);
    }, 1500);
  };

  useEffect(() => {
    startRound(0);
    return () => clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    // Check if both submitted
    if (gameState === 'RECALL' && submitted.p1 && submitted.p2) {
      processRoundResults();
    }
  }, [submitted, gameState]);

  const processRoundResults = () => {
    setGameState('ROUND_OVER');
    
    const p1Result = calculateScore(targetSequence, inputs.p1);
    const p2Result = calculateScore(targetSequence, inputs.p2);

    setRoundResults({ p1: p1Result, p2: p2Result });
    setScores(prev => ({
      p1: prev.p1 + p1Result.score,
      p2: prev.p2 + p2Result.score
    }));

    setTimeout(() => {
      if (currentRoundIndex + 1 < ROUND_LENGTHS.length) {
        startRound(currentRoundIndex + 1);
      } else {
        setGameState('GAME_OVER');
      }
    }, 5000); // Show results for 5 seconds
  };

  const handleKeyPress = (player, key) => {
    if (gameState !== 'RECALL' || submitted[player]) return;

    setInputs(prev => {
      const currentInput = prev[player];
      if (key === 'DEL') {
        return { ...prev, [player]: currentInput.slice(0, -1) };
      } 
      
      if (currentInput.length < targetSequence.length) {
        return { ...prev, [player]: currentInput + key };
      }
      return prev;
    });
  };

  const handleSubmit = (player) => {
    if (gameState !== 'RECALL') return;
    setSubmitted(prev => ({ ...prev, [player]: true }));
  };

  const renderNumpad = (player) => {
    const numbers = ['1','2','3','4','5','6','7','8','9','DEL','0','GO'];
    const isP1 = player === 'p1';

    return (
      <div className="grid grid-cols-3 gap-2 w-full max-w-[240px] mx-auto">
        {numbers.map(num => (
          <button
            key={num}
            onClick={() => {
              if (num === 'GO') handleSubmit(player);
              else handleKeyPress(player, num);
            }}
            disabled={submitted[player]}
            className={`
              h-12 md:h-14 rounded-xl font-bold text-xl transition-transform active:scale-90
              ${num === 'GO' 
                ? (inputs[player].length === targetSequence.length ? (isP1 ? 'bg-p1-500 text-white' : 'bg-p2-500 text-white') : 'bg-surface-700 text-gray-500') 
                : num === 'DEL' 
                  ? 'bg-red-500/20 text-red-400' 
                  : 'bg-surface-700 text-white hover:bg-surface-600'}
              ${submitted[player] ? 'opacity-50 grayscale' : ''}
            `}
          >
            {num === 'DEL' ? <Delete className="mx-auto" size={20} /> : num === 'GO' ? <Check className="mx-auto" size={24} /> : num}
          </button>
        ))}
      </div>
    );
  };

  const renderInputDisplay = (player) => {
    const input = inputs[player];
    const isP1 = player === 'p1';
    
    // Mask with asterisks unless ROUND_OVER
    const displayChars = Array(targetSequence.length).fill('_');
    for (let i = 0; i < targetSequence.length; i++) {
      if (i < input.length) {
        displayChars[i] = gameState === 'ROUND_OVER' ? input[i] : '*';
      }
    }

    return (
      <div className="flex gap-1 md:gap-2 justify-center mb-6">
        {displayChars.map((char, idx) => {
          let bgColor = 'bg-surface-800';
          let textColor = 'text-gray-400';
          let borderColor = 'border-white/10';

          if (gameState === 'ROUND_OVER' && roundResults) {
            const result = roundResults[player];
            if (char !== '_' && char !== '*') {
              const isMatch = result.matches[idx];
              bgColor = isMatch ? (isP1 ? 'bg-p1-500/20' : 'bg-p2-500/20') : 'bg-red-500/20';
              textColor = isMatch ? (isP1 ? 'text-p1-400' : 'text-p2-400') : 'text-red-400';
              borderColor = isMatch ? (isP1 ? 'border-p1-500/50' : 'border-p2-500/50') : 'border-red-500/50';
            }
          }

          return (
            <div 
              key={idx}
              className={`w-8 h-10 md:w-10 md:h-12 flex items-center justify-center rounded-lg border-2 ${bgColor} ${borderColor} ${textColor} text-xl md:text-2xl font-black`}
            >
              {char}
            </div>
          );
        })}
      </div>
    );
  };

  const renderPlayArea = (player, isTop) => {
    const isP1 = player === 'p1';
    
    return (
      <div 
        className={`relative flex-1 flex flex-col items-center justify-center p-4 md:p-8 transition-colors duration-300
          ${isTop ? 'rotate-180 bg-surface-900 border-b-4 border-p1-500/30' : 'bg-surface-800 border-t-4 border-p2-500/30'}
        `}
      >
        {/* Score & Round Indicator */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center opacity-50">
          <div className="font-bold text-gray-400">ROUND {currentRoundIndex + 1}/4</div>
          <div className="text-2xl font-black">{scores[player]} <span className="text-sm">PTS</span></div>
        </div>

        {gameState === 'READY' && <div className="text-3xl font-black animate-pulse text-white">GET READY</div>}
        
        {gameState === 'MEMORIZE' && (
          <div className="text-5xl md:text-7xl font-mono font-black tracking-widest text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
            {targetSequence}
          </div>
        )}

        {gameState === 'RECALL' && (
          <div className="w-full animate-fade-in flex flex-col items-center">
            {submitted[player] ? (
              <div className="text-2xl font-bold text-green-400 animate-pulse mt-10">WAITING FOR OPPONENT...</div>
            ) : (
              <>
                {renderInputDisplay(player)}
                {renderNumpad(player)}
              </>
            )}
          </div>
        )}

        {gameState === 'ROUND_OVER' && (
          <div className="w-full animate-slide-up flex flex-col items-center">
            <div className="text-sm text-gray-400 mb-2">TARGET SEQUENCE</div>
            <div className="text-2xl tracking-widest font-mono text-white mb-4">{targetSequence}</div>
            {renderInputDisplay(player)}
            <div className={`text-3xl font-black mt-2 ${isP1 ? 'text-p1-400' : 'text-p2-400'}`}>
              +{roundResults ? roundResults[player].score : 0}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-black font-sans select-none">
      
      {/* Player 1 (Top, rotated) */}
      {renderPlayArea('p1', true)}

      {/* Center Divider / Exit Button */}
      <div className="absolute top-1/2 left-0 w-full h-2 bg-surface-700 -translate-y-1/2 flex items-center justify-center z-50">
        <button 
          onClick={() => navigate('/number-memory')}
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
            <Trophy size={64} className={`mx-auto mb-6 ${scores.p1 > scores.p2 ? 'text-p1-400' : scores.p1 < scores.p2 ? 'text-p2-400' : 'text-yellow-400'}`} />
            <h2 className="text-4xl font-black text-white mb-2">
              {scores.p1 > scores.p2 ? 'PLAYER 1 WINS!' : scores.p1 < scores.p2 ? 'PLAYER 2 WINS!' : 'IT\'S A TIE!'}
            </h2>
            <p className="text-gray-400 mb-8 text-xl">Final Score: {scores.p1} - {scores.p2}</p>
            
            <div className="flex gap-4">
              <button 
                onClick={() => navigate('/number-memory')}
                className="flex-1 py-4 bg-surface-800 hover:bg-surface-700 text-white rounded-xl font-bold transition-colors"
              >
                Exit
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-500 hover:to-green-500 text-white rounded-xl font-bold transition-transform hover:scale-[1.02]"
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
