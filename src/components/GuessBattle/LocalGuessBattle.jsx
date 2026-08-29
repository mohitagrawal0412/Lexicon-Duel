import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  TOTAL_ROUNDS, ROUND_RANGES, TIMER_MODES, POWER_UP_DEFAULTS,
  generateSecret, getBotGuess, calculateRoundResult, getHint
} from '../../config/guessBattle';
import { ArrowLeft, Zap, Lightbulb, RefreshCw, Trophy, Target, TrendingUp, X } from 'lucide-react';

const PASS_DEVICE_TIME = 2; // seconds to show pass device screen
const REVEAL_TIME = 5; // seconds to show round result

export default function LocalGuessBattle() {
  const location = useLocation();
  const navigate = useNavigate();
  const { mode = 'local', timerMode = 'standard', botDiff = 'easy' } = location.state || {};

  const [phase, setPhase] = useState('p1_guess'); // p1_guess, pass_device, p2_guess, bot_thinking, reveal, game_over
  const [round, setRound] = useState(1);
  const [secret, setSecret] = useState(0);
  
  const [p1State, setP1State] = useState({ guess: '', powerUps: { ...POWER_UP_DEFAULTS }, dblPts: false, stats: { score: 0, exact: 0, diff: 0, bestDiff: Infinity, streak: 0, maxStreak: 0 } });
  const [p2State, setP2State] = useState({ guess: '', powerUps: { ...POWER_UP_DEFAULTS }, dblPts: false, stats: { score: 0, exact: 0, diff: 0, bestDiff: Infinity, streak: 0, maxStreak: 0 } });
  
  const [timeLeft, setTimeLeft] = useState(TIMER_MODES[timerMode].seconds);
  const [activeHint, setActiveHint] = useState(null);
  const [roundResult, setRoundResult] = useState(null); // { winner, p1Diff, p2Diff, p1Points, p2Points, p1Exact, p2Exact }

  const inputRef = useRef(null);

  // Initialize round
  useEffect(() => {
    setSecret(generateSecret(round));
    setTimeLeft(TIMER_MODES[timerMode].seconds);
    setActiveHint(null);
    setP1State(s => ({ ...s, guess: '', dblPts: false }));
    setP2State(s => ({ ...s, guess: '', dblPts: false }));
    setPhase('p1_guess');
  }, [round, timerMode]);

  // Timer logic
  useEffect(() => {
    if (phase !== 'p1_guess' && phase !== 'p2_guess') return;
    
    if (timeLeft <= 0) {
      handleTimeUp();
      return;
    }
    
    const timer = setInterval(() => setTimeLeft(l => l - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, phase]);

  // Focus input
  useEffect(() => {
    if ((phase === 'p1_guess' || phase === 'p2_guess') && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [phase]);

  // Bot logic
  useEffect(() => {
    if (phase === 'bot_thinking') {
      const thinkTime = 1000 + Math.random() * 2000;
      const botTimer = setTimeout(() => {
        const guess = getBotGuess(secret, round, botDiff);
        setP2State(s => ({ ...s, guess: guess.toString() }));
        handleReveal(p1State.guess, guess.toString());
      }, thinkTime);
      return () => clearTimeout(botTimer);
    }
  }, [phase]);

  const handleTimeUp = () => {
    if (phase === 'p1_guess') {
      if (mode === 'bot') setPhase('bot_thinking');
      else {
        setPhase('pass_device');
        setTimeout(() => {
          setPhase('p2_guess');
          setTimeLeft(TIMER_MODES[timerMode].seconds);
        }, PASS_DEVICE_TIME * 1000);
      }
    } else if (phase === 'p2_guess') {
      handleReveal(p1State.guess, p2State.guess);
    }
  };

  const handleGuessSubmit = (e) => {
    e.preventDefault();
    const currentVal = phase === 'p1_guess' ? p1State.guess : p2State.guess;
    if (currentVal === '') return;

    if (phase === 'p1_guess') {
      if (mode === 'bot') {
        setPhase('bot_thinking');
      } else {
        setPhase('pass_device');
        setTimeout(() => {
          setPhase('p2_guess');
          setTimeLeft(TIMER_MODES[timerMode].seconds);
        }, PASS_DEVICE_TIME * 1000);
      }
    } else if (phase === 'p2_guess') {
      handleReveal(p1State.guess, p2State.guess);
    }
  };

  const handleReveal = (p1g, p2g) => {
    const p1Num = parseInt(p1g, 10) || 0; // Default to 0 if no guess (time up)
    const p2Num = parseInt(p2g, 10) || 0;
    
    const result = calculateRoundResult(secret, p1Num, p2Num, p1State.dblPts, p2State.dblPts);
    setRoundResult(result);
    
    // Update Stats
    setP1State(s => ({
      ...s,
      stats: {
        score: s.stats.score + result.p1Points,
        exact: s.stats.exact + (result.p1Exact ? 1 : 0),
        diff: s.stats.diff + result.p1Diff,
        bestDiff: Math.min(s.stats.bestDiff, result.p1Diff),
        streak: result.winner === 'p1' ? s.stats.streak + 1 : 0,
        maxStreak: Math.max(s.stats.maxStreak, result.winner === 'p1' ? s.stats.streak + 1 : s.stats.streak),
      }
    }));
    
    setP2State(s => ({
      ...s,
      stats: {
        score: s.stats.score + result.p2Points,
        exact: s.stats.exact + (result.p2Exact ? 1 : 0),
        diff: s.stats.diff + result.p2Diff,
        bestDiff: Math.min(s.stats.bestDiff, result.p2Diff),
        streak: result.winner === 'p2' ? s.stats.streak + 1 : 0,
        maxStreak: Math.max(s.stats.maxStreak, result.winner === 'p2' ? s.stats.streak + 1 : s.stats.streak),
      }
    }));

    setPhase('reveal');

    setTimeout(() => {
      if (round >= TOTAL_ROUNDS) {
        setPhase('game_over');
      } else {
        setRound(r => r + 1);
      }
    }, REVEAL_TIME * 1000);
  };

  const usePowerUp = (type) => {
    const isP1 = phase === 'p1_guess';
    const state = isP1 ? p1State : p2State;
    const setState = isP1 ? setP1State : setP2State;

    if (state.powerUps[type] <= 0) return;

    setState(s => ({ ...s, powerUps: { ...s.powerUps, [type]: s.powerUps[type] - 1 } }));

    if (type === 'hints') {
      const hintsUsed = POWER_UP_DEFAULTS.hints - state.powerUps.hints; // how many they used before this one
      setActiveHint(getHint(secret, round, hintsUsed));
    } else if (type === 'doublePoints') {
      setState(s => ({ ...s, dblPts: true }));
    } else if (type === 'reGuess') {
      setState(s => ({ ...s, guess: '' }));
      if (inputRef.current) inputRef.current.focus();
    }
  };

  const handleEndGameEarly = () => {
    if (window.confirm('End game early?')) {
      setPhase('game_over');
    }
  };

  const { min, max } = ROUND_RANGES[round - 1] || ROUND_RANGES[TOTAL_ROUNDS - 1];
  const isP1 = phase === 'p1_guess';
  const currentPlayerName = isP1 ? 'Player 1' : mode === 'bot' ? 'Bot' : 'Player 2';
  const currentState = isP1 ? p1State : p2State;
  const setGuess = (val) => isP1 ? setP1State(s => ({ ...s, guess: val })) : setP2State(s => ({ ...s, guess: val }));
  const playerColor = isP1 ? 'text-p1-400' : 'text-p2-400';
  const playerBg = isP1 ? 'bg-p1-500/20 border-p1-500' : 'bg-p2-500/20 border-p2-500';

  if (phase === 'game_over') {
    const p1Win = p1State.stats.score > p2State.stats.score;
    const tie = p1State.stats.score === p2State.stats.score;
    return (
      <div className="min-h-screen game-bg flex items-center justify-center p-4">
        <div className="w-full max-w-3xl bg-surface-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          {p1Win && <div className="absolute top-0 left-0 w-full h-2 bg-p1-500 glow-p1" />}
          {!p1Win && !tie && <div className="absolute top-0 left-0 w-full h-2 bg-p2-500 glow-p2" />}
          {tie && <div className="absolute top-0 left-0 w-full h-2 bg-gray-500" />}
          
          <h1 className="text-4xl font-black text-center text-white mb-2">GAME OVER</h1>
          <p className="text-center text-xl text-gray-400 mb-8">
            {tie ? "IT'S A TIE!" : `${p1Win ? 'PLAYER 1' : mode === 'bot' ? 'BOT' : 'PLAYER 2'} WINS!`}
          </p>

          <div className="grid grid-cols-2 gap-8 mb-8">
            {/* P1 Stats */}
            <div className="space-y-4">
              <div className="text-center p-4 bg-surface-800 rounded-2xl border border-p1-500/30">
                <h3 className="text-p1-400 font-bold mb-1">Player 1</h3>
                <div className="text-4xl font-black text-white">{p1State.stats.score} <span className="text-sm text-gray-500">pts</span></div>
              </div>
              <div className="bg-surface-800/50 rounded-xl p-4 text-sm text-gray-300 space-y-2">
                <div className="flex justify-between"><span>Exact Guesses</span> <span>{p1State.stats.exact}</span></div>
                <div className="flex justify-between"><span>Avg Off By</span> <span>{Math.round(p1State.stats.diff / round)}</span></div>
                <div className="flex justify-between"><span>Best Diff</span> <span>{p1State.stats.bestDiff}</span></div>
                <div className="flex justify-between"><span>Max Streak</span> <span>{p1State.stats.maxStreak} 🔥</span></div>
              </div>
            </div>
            {/* P2 Stats */}
            <div className="space-y-4">
              <div className="text-center p-4 bg-surface-800 rounded-2xl border border-p2-500/30">
                <h3 className="text-p2-400 font-bold mb-1">{mode === 'bot' ? 'Bot' : 'Player 2'}</h3>
                <div className="text-4xl font-black text-white">{p2State.stats.score} <span className="text-sm text-gray-500">pts</span></div>
              </div>
              <div className="bg-surface-800/50 rounded-xl p-4 text-sm text-gray-300 space-y-2">
                <div className="flex justify-between"><span>Exact Guesses</span> <span>{p2State.stats.exact}</span></div>
                <div className="flex justify-between"><span>Avg Off By</span> <span>{Math.round(p2State.stats.diff / round)}</span></div>
                <div className="flex justify-between"><span>Best Diff</span> <span>{p2State.stats.bestDiff}</span></div>
                <div className="flex justify-between"><span>Max Streak</span> <span>{p2State.stats.maxStreak} 🔥</span></div>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <button onClick={() => navigate('/guess-battle')} className="px-6 py-3 bg-surface-800 hover:bg-surface-700 text-white rounded-xl font-bold transition-colors">
              Back to Setup
            </button>
            <button onClick={() => window.location.reload()} className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-bold transition-transform hover:scale-105 active:scale-95">
              Play Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'pass_device') {
    return (
      <div className="min-h-screen game-bg flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <h2 className="text-4xl font-black text-white mb-4">Pass the Device!</h2>
        <p className="text-xl text-p2-400 font-bold">Player 2's turn to guess</p>
      </div>
    );
  }

  if (phase === 'bot_thinking') {
     return (
      <div className="min-h-screen game-bg flex flex-col items-center justify-center p-6 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-p2-500 mb-6"></div>
        <h2 className="text-3xl font-black text-white">Bot is thinking...</h2>
      </div>
    );
  }

  if (phase === 'reveal' && roundResult) {
    const isP1Win = roundResult.winner === 'p1';
    const isP2Win = roundResult.winner === 'p2';
    const tie = roundResult.winner === 'tie';

    return (
      <div className="min-h-screen game-bg flex flex-col items-center justify-center p-6 text-center">
        <h3 className="text-gray-400 font-bold uppercase tracking-widest mb-2">The Secret Number Was</h3>
        <div className="text-6xl md:text-8xl font-black text-white mb-12 animate-score-pop">{secret.toLocaleString()}</div>
        
        <div className="w-full max-w-4xl grid grid-cols-2 gap-4 md:gap-8 mb-12">
          {/* P1 Reveal */}
          <div className={`p-6 rounded-3xl border-2 transition-all ${isP1Win ? 'bg-p1-500/20 border-p1-500 scale-105 glow-p1' : 'bg-surface-900/50 border-surface-800'}`}>
            <h4 className="text-p1-400 font-bold mb-2">Player 1</h4>
            <div className="text-3xl md:text-4xl font-black text-white mb-2">{p1State.guess || 'No Guess'}</div>
            <div className="text-gray-400 text-sm">Off by {roundResult.p1Diff.toLocaleString()}</div>
            {roundResult.p1Exact && <div className="text-yellow-400 font-bold mt-2 text-sm animate-pulse">🎯 EXACT MATCH!</div>}
            {roundResult.p1Points > 0 && (
              <div className="text-green-400 font-black text-xl mt-4 animate-slide-up">+{roundResult.p1Points}</div>
            )}
          </div>
          {/* P2 Reveal */}
          <div className={`p-6 rounded-3xl border-2 transition-all ${isP2Win ? 'bg-p2-500/20 border-p2-500 scale-105 glow-p2' : 'bg-surface-900/50 border-surface-800'}`}>
            <h4 className="text-p2-400 font-bold mb-2">{mode === 'bot' ? 'Bot' : 'Player 2'}</h4>
            <div className="text-3xl md:text-4xl font-black text-white mb-2">{p2State.guess || 'No Guess'}</div>
            <div className="text-gray-400 text-sm">Off by {roundResult.p2Diff.toLocaleString()}</div>
            {roundResult.p2Exact && <div className="text-yellow-400 font-bold mt-2 text-sm animate-pulse">🎯 EXACT MATCH!</div>}
            {roundResult.p2Points > 0 && (
              <div className="text-green-400 font-black text-xl mt-4 animate-slide-up">+{roundResult.p2Points}</div>
            )}
          </div>
        </div>
        <div className="text-gray-500 animate-pulse-soft">Next round starting soon...</div>
      </div>
    );
  }

  // Active Guessing Phase
  return (
    <div className="min-h-screen game-bg flex flex-col p-4 md:p-8">
      {/* Header Info */}
      <div className="flex justify-between items-center mb-8">
        <button onClick={handleEndGameEarly} className="p-2 hover:bg-surface-800 text-gray-400 hover:text-white rounded-full transition-colors border border-transparent hover:border-white/10">
          <X size={24} />
        </button>
        <div className="text-center">
          <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Round {round} of {TOTAL_ROUNDS}</div>
          <div className="text-2xl font-black text-white bg-surface-800/80 px-6 py-2 rounded-full border border-white/10">
            {min.toLocaleString()} — {max.toLocaleString()}
          </div>
        </div>
        <div className={`text-3xl font-black ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-gray-300'}`}>
          {timeLeft}
        </div>
      </div>

      {/* Top Scores */}
      <div className="grid grid-cols-2 gap-4 mb-8 max-w-2xl mx-auto w-full">
        <div className="bg-surface-900/50 rounded-xl p-3 flex justify-between items-center border border-p1-500/20">
          <span className="text-p1-400 font-bold">P1 Score</span>
          <span className="text-white font-black text-xl">{p1State.stats.score}</span>
        </div>
        <div className="bg-surface-900/50 rounded-xl p-3 flex justify-between items-center border border-p2-500/20">
          <span className="text-p2-400 font-bold">{mode === 'bot' ? 'Bot' : 'P2'} Score</span>
          <span className="text-white font-black text-xl">{p2State.stats.score}</span>
        </div>
      </div>

      {/* Main Guess Area */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-xl mx-auto w-full">
        <h2 className={`text-2xl font-black ${playerColor} mb-6`}>{currentPlayerName}'s Turn</h2>
        
        {activeHint && (
          <div className="mb-6 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-xl text-yellow-200 font-medium animate-slide-up w-full text-center">
            {activeHint}
          </div>
        )}

        <form onSubmit={handleGuessSubmit} className="w-full">
          <div className={`relative p-1 rounded-3xl ${playerBg} transition-all`}>
            <input
              ref={inputRef}
              type="number"
              value={currentState.guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder="Enter your guess"
              className="w-full bg-surface-900 rounded-2xl px-6 py-8 text-center text-4xl md:text-5xl font-black text-white focus:outline-none placeholder-gray-700"
              min={min}
              max={max}
            />
          </div>
          <button 
            type="submit" 
            className="mt-6 w-full py-5 bg-white text-black hover:bg-gray-200 rounded-2xl font-black text-xl transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            SUBMIT GUESS
          </button>
        </form>

        {/* Power Ups */}
        <div className="w-full mt-12 grid grid-cols-3 gap-4">
          <button 
            onClick={() => usePowerUp('hints')}
            disabled={currentState.powerUps.hints <= 0}
            className={`flex flex-col items-center p-3 rounded-xl border ${currentState.powerUps.hints > 0 ? 'bg-surface-800 border-yellow-500/30 text-yellow-400 hover:bg-surface-700' : 'bg-surface-900/50 border-white/5 text-gray-600 cursor-not-allowed'}`}
          >
            <Lightbulb size={24} className="mb-1" />
            <span className="text-xs font-bold uppercase">Hint ({currentState.powerUps.hints})</span>
          </button>
          <button 
            onClick={() => usePowerUp('doublePoints')}
            disabled={currentState.powerUps.doublePoints <= 0 || currentState.dblPts}
            className={`flex flex-col items-center p-3 rounded-xl border ${currentState.powerUps.doublePoints > 0 && !currentState.dblPts ? 'bg-surface-800 border-purple-500/30 text-purple-400 hover:bg-surface-700' : currentState.dblPts ? 'bg-purple-600 border-purple-400 text-white' : 'bg-surface-900/50 border-white/5 text-gray-600 cursor-not-allowed'}`}
          >
            <Zap size={24} className="mb-1" />
            <span className="text-xs font-bold uppercase">2x Pts ({currentState.powerUps.doublePoints})</span>
          </button>
          <button 
            onClick={() => usePowerUp('reGuess')}
            disabled={currentState.powerUps.reGuess <= 0}
            className={`flex flex-col items-center p-3 rounded-xl border ${currentState.powerUps.reGuess > 0 ? 'bg-surface-800 border-blue-500/30 text-blue-400 hover:bg-surface-700' : 'bg-surface-900/50 border-white/5 text-gray-600 cursor-not-allowed'}`}
          >
            <RefreshCw size={24} className="mb-1" />
            <span className="text-xs font-bold uppercase">Reset ({currentState.powerUps.reGuess})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
