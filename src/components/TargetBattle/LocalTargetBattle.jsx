import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateTargetRound, evaluateMerge, MAX_SCORE, ROUND_TIME } from '../../config/targetBattle';
import { ArrowLeft, Trophy, RotateCcw } from 'lucide-react';

export default function LocalTargetBattle() {
  const navigate = useNavigate();

  const [scores, setScores] = useState({ p1: 0, p2: 0 }); // p1 top, p2 bottom
  const [gameState, setGameState] = useState('PLAYING'); // PLAYING, ROUND_OVER, GAME_OVER
  
  const [roundData, setRoundData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  
  // Player states
  const [p1State, setP1State] = useState({ tiles: [], selectedTile: null, selectedOp: null });
  const [p2State, setP2State] = useState({ tiles: [], selectedTile: null, selectedOp: null });
  
  const [roundWinner, setRoundWinner] = useState(null);
  const [winReason, setWinReason] = useState('');

  const startRound = () => {
    setGameState('PLAYING');
    setRoundWinner(null);
    setTimeLeft(ROUND_TIME);
    
    const data = generateTargetRound();
    setRoundData(data);
    
    setP1State({ tiles: [...data.initialTiles], selectedTile: null, selectedOp: null });
    setP2State({ tiles: [...data.initialTiles], selectedTile: null, selectedOp: null });
  };

  useEffect(() => {
    startRound();
  }, []);

  // Timer logic
  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, p1State, p2State]); // Re-bind on state changes so timeUp uses latest state

  const handleTimeUp = () => {
    // Find closest tiles
    if (!roundData) return;
    const target = roundData.target;
    
    const getBest = (tiles) => {
      if (!tiles || tiles.length === 0) return 0;
      let closest = tiles[0].val;
      let minDiff = Math.abs(target - closest);
      tiles.forEach(t => {
        const diff = Math.abs(target - t.val);
        if (diff < minDiff) {
          minDiff = diff;
          closest = t.val;
        }
      });
      return closest;
    };

    const p1Best = getBest(p1State.tiles);
    const p2Best = getBest(p2State.tiles);
    
    const p1Diff = Math.abs(target - p1Best);
    const p2Diff = Math.abs(target - p2Best);

    let winner = null;
    let reason = '';

    if (p1Diff < p2Diff) { winner = 'p1'; reason = `P1 closest (${p1Best})`; }
    else if (p2Diff < p1Diff) { winner = 'p2'; reason = `P2 closest (${p2Best})`; }
    else { winner = 'tie'; reason = `Tie! Both got ${p1Best}`; }

    endRound(winner, reason);
  };

  const endRound = (winner, reason) => {
    setGameState('ROUND_OVER');
    setRoundWinner(winner);
    setWinReason(reason);

    let newScores = { ...scores };
    if (winner === 'p1' || winner === 'p2') {
      newScores[winner] += 1;
      setScores(newScores);
    }

    if (newScores.p1 >= MAX_SCORE || newScores.p2 >= MAX_SCORE) {
      setTimeout(() => setGameState('GAME_OVER'), 2000);
    } else {
      setTimeout(() => startRound(), 3500);
    }
  };

  const handleTileTap = (player, tile) => {
    if (gameState !== 'PLAYING') return;

    const setState = player === 'p1' ? setP1State : setP2State;

    setState(prev => {
      // If we have a tile AND an operator selected, attempt a merge
      if (prev.selectedTile && prev.selectedOp && prev.selectedTile.id !== tile.id) {
        const result = evaluateMerge(prev.selectedTile.val, prev.selectedOp, tile.val);
        if (result === null) {
          // Invalid merge (e.g. fraction) - just reset selection to new tile
          return { ...prev, selectedTile: tile, selectedOp: null };
        }
        
        // Valid merge! Remove both tiles, add new one
        const newTile = { id: `tile-${Date.now()}`, val: result };
        const newTiles = prev.tiles.filter(t => t.id !== prev.selectedTile.id && t.id !== tile.id);
        newTiles.push(newTile);

        // Check if exact target reached!
        if (result === roundData?.target) {
          setTimeout(() => endRound(player, 'EXACT MATCH!'), 100);
        }

        return { tiles: newTiles, selectedTile: newTile, selectedOp: null };
      }
      
      // Otherwise, just select the tile
      return { ...prev, selectedTile: prev.selectedTile?.id === tile.id ? null : tile, selectedOp: null };
    });
  };

  const handleOpTap = (player, op) => {
    if (gameState !== 'PLAYING') return;
    const setState = player === 'p1' ? setP1State : setP2State;
    
    setState(prev => {
      if (prev.selectedTile) {
        // Toggle or set op
        return { ...prev, selectedOp: prev.selectedOp === op ? null : op };
      }
      return prev;
    });
  };

  const handleReset = (player) => {
    if (gameState !== 'PLAYING') return;
    const setState = player === 'p1' ? setP1State : setP2State;
    setState({ tiles: [...roundData.initialTiles], selectedTile: null, selectedOp: null });
  };

  const renderPlayArea = (player, isTop) => {
    const isP1 = player === 'p1';
    const state = isP1 ? p1State : p2State;
    const isWinner = roundWinner === player;
    const isLoser = roundWinner && roundWinner !== player && roundWinner !== 'tie';
    
    return (
      <div 
        className={`relative flex-1 flex flex-col items-center justify-center p-4 transition-colors duration-300
          ${isTop ? 'rotate-180 bg-surface-900 border-b-4 border-p1-500/30' : 'bg-surface-800 border-t-4 border-p2-500/30'}
          ${isWinner ? (isTop ? 'bg-p1-500/20' : 'bg-p2-500/20') : ''}
          ${isLoser ? 'bg-red-500/10' : ''}
        `}
      >
        {/* Score & Time */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center opacity-50">
          <div className="text-3xl font-black">{scores[player]} <span className="text-sm">PTS</span></div>
          <div className={`text-2xl font-black ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
            {timeLeft}s
          </div>
        </div>

        {gameState === 'ROUND_OVER' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/60 backdrop-blur-[2px]">
            <div className={`text-5xl font-black mb-2 ${isWinner ? 'text-green-400 animate-bounce-in' : isLoser ? 'text-red-400' : 'text-yellow-400'}`}>
              {isWinner ? 'WINNER!' : isLoser ? 'DEFEAT' : 'TIE'}
            </div>
            <div className="text-xl font-bold text-white">{winReason}</div>
          </div>
        )}

        <div className="flex flex-col items-center w-full max-w-lg mt-8">
          
          {/* Target Display */}
          <div className="text-sm font-bold text-gray-400 tracking-widest mb-1">TARGET</div>
          <div className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 mb-8 drop-shadow-md">
            {roundData?.target}
          </div>

          {/* Number Tiles */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-6 min-h-[64px]">
            {state.tiles.map(tile => {
              const isSelected = state.selectedTile?.id === tile.id;
              return (
                <button
                  key={tile.id}
                  onClick={() => handleTileTap(player, tile)}
                  className={`min-w-[4rem] h-14 md:min-w-[5rem] md:h-16 px-3 flex items-center justify-center rounded-xl font-black text-2xl md:text-3xl shadow-lg transition-transform active:scale-90
                    ${isSelected ? (isP1 ? 'bg-p1-500 text-white ring-4 ring-p1-400/50 scale-105' : 'bg-p2-500 text-white ring-4 ring-p2-400/50 scale-105') : 'bg-surface-700 text-white border-b-4 border-surface-900'}
                  `}
                >
                  {tile.val}
                </button>
              );
            })}
          </div>

          {/* Controls Area: Operators + Reset */}
          <div className="flex w-full max-w-xs gap-2 md:gap-4 justify-between items-center bg-surface-800 p-2 md:p-3 rounded-2xl border border-white/5 shadow-inner">
            <button onClick={() => handleReset(player)} className="p-3 text-gray-400 hover:text-white transition-colors active:scale-90">
              <RotateCcw size={24} />
            </button>
            <div className="flex gap-2">
              {['+', '−', '×', '÷'].map(op => {
                const isSelected = state.selectedOp === op;
                return (
                  <button
                    key={op}
                    onClick={() => handleOpTap(player, op)}
                    className={`w-12 h-12 md:w-14 md:h-14 rounded-lg flex items-center justify-center font-black text-2xl transition-transform active:scale-90
                      ${isSelected ? 'bg-yellow-500 text-white ring-4 ring-yellow-400/50 scale-110' : 'bg-surface-700 text-gray-300 hover:bg-surface-600'}
                    `}
                  >
                    {op}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    );
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-black font-sans select-none">
      
      {/* Player 1 */}
      {renderPlayArea('p1', true)}

      {/* Divider */}
      <div className="absolute top-1/2 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600 -translate-y-1/2 flex items-center justify-center z-50">
        <button 
          onClick={() => navigate('/target-battle')}
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
                onClick={() => navigate('/target-battle')}
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
