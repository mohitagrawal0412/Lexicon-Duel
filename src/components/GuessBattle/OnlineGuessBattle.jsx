import React, { useState, useEffect, useRef } from 'react';
import { updatePartyRoom } from '../../services/roomService';
import { concludeGameAndReturnToLobby } from '../../services/relationshipService';
import { 
  TOTAL_ROUNDS, ROUND_RANGES, TIMER_MODES, POWER_UP_DEFAULTS,
  generateSecret, calculateRoundResult, getHint
} from '../../config/guessBattle';
import { Lightbulb, Zap, RefreshCw, X, Trophy } from 'lucide-react';

const REVEAL_TIME = 5;

export default function OnlineGuessBattle({ room, roomId, isHost, user }) {
  useEffect(() => {
    if (isHost && (!room.gameState || room.gameState === 'initializing')) {
      updatePartyRoom(roomId, {
        gameState: {
          round: 1,
          secret: generateSecret(1),
          phase: 'guessing', // guessing, reveal, game_over
          p1State: { guess: '', powerUps: { ...POWER_UP_DEFAULTS }, dblPts: false, stats: { score: 0, exact: 0, diff: 0, bestDiff: Infinity, streak: 0, maxStreak: 0 }, submitted: false },
          p2State: { guess: '', powerUps: { ...POWER_UP_DEFAULTS }, dblPts: false, stats: { score: 0, exact: 0, diff: 0, bestDiff: Infinity, streak: 0, maxStreak: 0 }, submitted: false },
          timeLeft: TIMER_MODES['standard'].seconds,
          roundResult: null,
          lastUpdateTime: Date.now()
        }
      });
    }
  }, [isHost, room.gameState, roomId]);

  if (!room.gameState || typeof room.gameState === 'string') return <div className="text-white text-center pt-20">Initializing Game...</div>;
  return <InnerOnlineGuessBattle room={room} roomId={roomId} isHost={isHost} user={user} />;
}

function InnerOnlineGuessBattle({ room, roomId, isHost, user }) {

  const { round, secret, phase, p1State, p2State, timeLeft, roundResult, lastUpdateTime } = room.gameState;
  const myStateKey = isHost ? 'p1State' : 'p2State';
  const myState = isHost ? p1State : p2State;
  const oppState = isHost ? p2State : p1State;

  // Local state for UI only
  const [localGuess, setLocalGuess] = useState('');
  const [activeHint, setActiveHint] = useState(null);
  const inputRef = useRef(null);

  // Focus input when guessing phase starts
  useEffect(() => {
    if (phase === 'guessing' && !myState.submitted) {
      setLocalGuess('');
      setActiveHint(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [phase, myState.submitted]);

  // Host-driven timer (handles both guessing countdown and reveal-to-next-round transition)
  useEffect(() => {
    if (!isHost) return;

    if (phase === 'guessing') {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - lastUpdateTime) / 1000);
        const newTime = Math.max(0, TIMER_MODES['standard'].seconds - elapsed);
        
        if (newTime !== timeLeft) {
          updatePartyRoom(roomId, { 'gameState/timeLeft': newTime });
        }

        if (newTime <= 0) {
          clearInterval(interval);
          handleTimeUpAsHost();
        }
      }, 1000);
      return () => clearInterval(interval);
    } else if (phase === 'reveal') {
      // Poll-based reveal timer — survives host refreshes
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - lastUpdateTime) / 1000);
        if (elapsed >= REVEAL_TIME) {
          clearInterval(interval);
          if (round >= TOTAL_ROUNDS) {
            updatePartyRoom(roomId, { 'gameState/phase': 'game_over' });
          } else {
            updatePartyRoom(roomId, {
              'gameState/phase': 'guessing',
              'gameState/round': round + 1,
              'gameState/secret': generateSecret(round + 1),
              'gameState/timeLeft': TIMER_MODES['standard'].seconds,
              'gameState/lastUpdateTime': Date.now(),
              'gameState/p1State/guess': '',
              'gameState/p1State/submitted': false,
              'gameState/p1State/dblPts': false,
              'gameState/p2State/guess': '',
              'gameState/p2State/submitted': false,
              'gameState/p2State/dblPts': false,
            });
          }
        }
      }, 1000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, phase, lastUpdateTime, timeLeft, round]);

  // Host processes round when both submit or time is up
  useEffect(() => {
    if (isHost && phase === 'guessing' && p1State.submitted && p2State.submitted) {
      processReveal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, phase, p1State.submitted, p2State.submitted]);

  const handleTimeUpAsHost = async () => {
    if (!isHost || phase !== 'guessing') return;
    // Auto-submit for anyone who hasn't
    const updates = {};
    if (!p1State.submitted) {
      updates['gameState/p1State/submitted'] = true;
      updates['gameState/p1State/guess'] = p1State.guess || '0';
    }
    if (!p2State.submitted) {
      updates['gameState/p2State/submitted'] = true;
      updates['gameState/p2State/guess'] = p2State.guess || '0';
    }
    await updatePartyRoom(roomId, updates);
    processReveal();
  };

  const processReveal = async () => {
    if (!isHost) return;

    const p1Num = parseInt(p1State.guess || '0', 10);
    const p2Num = parseInt(p2State.guess || '0', 10);
    
    const result = calculateRoundResult(secret, p1Num, p2Num, p1State.dblPts, p2State.dblPts);
    
    // Update stats
    const updateStats = (state, pPoints, pExact, pDiff, pWinner) => ({
      ...state.stats,
      score: state.stats.score + pPoints,
      exact: state.stats.exact + (pExact ? 1 : 0),
      diff: state.stats.diff + pDiff,
      bestDiff: Math.min(state.stats.bestDiff, pDiff),
      streak: pWinner ? state.stats.streak + 1 : 0,
      maxStreak: Math.max(state.stats.maxStreak, pWinner ? state.stats.streak + 1 : state.stats.streak),
    });

    const newP1Stats = updateStats(p1State, result.p1Points, result.p1Exact, result.p1Diff, result.winner === 'p1');
    const newP2Stats = updateStats(p2State, result.p2Points, result.p2Exact, result.p2Diff, result.winner === 'p2');

    await updatePartyRoom(roomId, {
      'gameState/phase': 'reveal',
      'gameState/roundResult': result,
      'gameState/p1State/stats': newP1Stats,
      'gameState/p2State/stats': newP2Stats,
      'gameState/lastUpdateTime': Date.now(),
    });
  };

  const handleGuessSubmit = async (e) => {
    e.preventDefault();
    if (localGuess === '' || myState.submitted || phase !== 'guessing') return;
    
    await updatePartyRoom(roomId, {
      [`gameState/${myStateKey}/guess`]: localGuess,
      [`gameState/${myStateKey}/submitted`]: true,
      [`gameState/${myStateKey}/guesses`]: [...(myState.guesses || []), localGuess]
    });
  };

  const usePowerUp = async (type) => {
    if (myState.powerUps[type] <= 0 || myState.submitted) return;

    const updates = {
      [`gameState/${myStateKey}/powerUps/${type}`]: myState.powerUps[type] - 1
    };

    if (type === 'hints') {
      const hintsUsed = POWER_UP_DEFAULTS.hints - myState.powerUps.hints;
      setActiveHint(getHint(secret, round, hintsUsed));
    } else if (type === 'doublePoints') {
      updates[`gameState/${myStateKey}/dblPts`] = true;
    } else if (type === 'reGuess') {
      setLocalGuess('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }

    await updatePartyRoom(roomId, updates);
  };

  const { min, max } = ROUND_RANGES[round - 1] || ROUND_RANGES[TOTAL_ROUNDS - 1];
  const hostName = room.host.displayName;
  const guestName = room.guest?.displayName || 'Guest';

  if (phase === 'game_over') {
    const p1Win = p1State.stats.score > p2State.stats.score;
    const tie = p1State.stats.score === p2State.stats.score;
    return (
      <div className="h-full pt-16 flex items-center justify-center p-4 z-50">
        <div className="w-full max-w-2xl bg-surface-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden text-center">
          <Trophy className={`w-20 h-20 mx-auto mb-4 ${p1Win ? 'text-p1-400' : tie ? 'text-gray-400' : 'text-p2-400'}`} />
          <h1 className="text-4xl font-black text-white mb-2">GAME OVER</h1>
          <p className="text-xl text-gray-400 mb-8 font-bold">
            {tie ? "IT'S A TIE!" : `${p1Win ? hostName : guestName} WINS!`}
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="text-center p-4 bg-surface-800 rounded-2xl border border-p1-500/30">
              <h3 className="text-p1-400 font-bold mb-1">{hostName}</h3>
              <div className="text-4xl font-black text-white">{p1State.stats.score}</div>
            </div>
            <div className="text-center p-4 bg-surface-800 rounded-2xl border border-p2-500/30">
              <h3 className="text-p2-400 font-bold mb-1">{guestName}</h3>
              <div className="text-4xl font-black text-white">{p2State.stats.score}</div>
            </div>
          </div>

          {isHost ? (
            <button 
              onClick={() => concludeGameAndReturnToLobby(roomId, room.host, room.guest, 'guessBattle', p1State.stats.score, p2State.stats.score)}
              className="w-full py-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white rounded-xl font-bold transition-all hover:scale-[1.02]"
            >
              Return to Party Lobby
            </button>
          ) : (
             <div className="text-gray-400 font-bold animate-pulse">Waiting for host to return...</div>
          )}
        </div>
      </div>
    );
  }

  if (phase === 'reveal' && roundResult) {
    const isP1Win = roundResult.winner === 'p1';
    const isP2Win = roundResult.winner === 'p2';
    return (
      <div className="h-full pt-16 flex flex-col items-center justify-center p-6 text-center animate-fade-in z-40 relative">
        <h3 className="text-gray-400 font-bold uppercase tracking-widest mb-2">The Secret Number Was</h3>
        <div className="text-6xl md:text-8xl font-black text-white mb-12 animate-score-pop">{secret.toLocaleString()}</div>
        
        <div className="w-full max-w-4xl grid grid-cols-2 gap-4 md:gap-8 mb-12">
          {/* P1 Reveal */}
          <div className={`p-6 rounded-3xl border-2 transition-all ${isP1Win ? 'bg-p1-500/20 border-p1-500 glow-p1 scale-105' : 'bg-surface-900/50 border-surface-800'}`}>
            <h4 className="text-p1-400 font-bold mb-2">{hostName}</h4>
            <div className="text-3xl font-black text-white mb-2">{p1State.guess || '0'}</div>
            <div className="text-gray-400 text-sm">Off by {roundResult.p1Diff.toLocaleString()}</div>
            {roundResult.p1Exact && <div className="text-yellow-400 font-bold mt-2 text-sm animate-pulse">🎯 EXACT MATCH!</div>}
            {roundResult.p1Points > 0 && <div className="text-green-400 font-black text-xl mt-4">+{roundResult.p1Points}</div>}
          </div>
          {/* P2 Reveal */}
          <div className={`p-6 rounded-3xl border-2 transition-all ${isP2Win ? 'bg-p2-500/20 border-p2-500 glow-p2 scale-105' : 'bg-surface-900/50 border-surface-800'}`}>
            <h4 className="text-p2-400 font-bold mb-2">{guestName}</h4>
            <div className="text-3xl font-black text-white mb-2">{p2State.guess || '0'}</div>
            <div className="text-gray-400 text-sm">Off by {roundResult.p2Diff.toLocaleString()}</div>
            {roundResult.p2Exact && <div className="text-yellow-400 font-bold mt-2 text-sm animate-pulse">🎯 EXACT MATCH!</div>}
            {roundResult.p2Points > 0 && <div className="text-green-400 font-black text-xl mt-4">+{roundResult.p2Points}</div>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full pt-16 flex flex-col p-4 animate-fade-in relative max-w-2xl mx-auto z-40">
      {/* Header Info */}
      <div className="flex justify-between items-center mb-8">
        <div className="text-3xl font-black text-gray-300 w-16"></div>
        <div className="text-center">
          <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Round {round} of {TOTAL_ROUNDS}</div>
          <div className="text-xl font-black text-white bg-surface-800/80 px-6 py-2 rounded-full border border-white/10 shadow-lg">
            {min.toLocaleString()} — {max.toLocaleString()}
          </div>
        </div>
        <div className={`text-3xl font-black w-16 text-right ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
          {timeLeft}
        </div>
      </div>

      {/* Top Scores */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-surface-900/50 rounded-xl p-3 flex justify-between items-center border border-p1-500/20 shadow-md">
          <span className="text-p1-400 font-bold text-sm truncate pr-2">{hostName}</span>
          <span className="text-white font-black text-xl">{p1State.stats.score}</span>
        </div>
        <div className="bg-surface-900/50 rounded-xl p-3 flex justify-between items-center border border-p2-500/20 shadow-md">
          <span className="text-p2-400 font-bold text-sm truncate pr-2">{guestName}</span>
          <span className="text-white font-black text-xl">{p2State.stats.score}</span>
        </div>
      </div>

      {/* Main Guess Area */}
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        {myState.submitted ? (
          <div className="text-center p-8 bg-surface-900/60 rounded-3xl border border-white/10 backdrop-blur-xl animate-fade-in shadow-2xl">
            <div className="text-3xl font-bold text-emerald-400 mb-2">Guess Locked!</div>
            <div className="text-gray-400 font-bold">Waiting for opponent...</div>
            <div className="mt-6 flex justify-center">
               <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
            </div>
          </div>
        ) : (
          <div className="w-full animate-slide-up">
            {activeHint && (
              <div className="mb-6 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-xl text-yellow-200 font-medium w-full text-center shadow-lg">
                {activeHint}
              </div>
            )}
            
            {oppState?.submitted && !myState?.submitted && (
              <div className="mb-4 text-center">
                 <span className="bg-p2-500/20 text-p2-400 px-4 py-1 rounded-full font-bold text-sm border border-p2-500/50 shadow-[0_0_15px_rgba(236,72,153,0.3)] animate-pulse">Opponent locked in!</span>
              </div>
            )}

            <form onSubmit={handleGuessSubmit} className="w-full">
              <div className={`relative p-1 rounded-3xl ${isHost ? 'bg-p1-500/20 border-p1-500' : 'bg-p2-500/20 border-p2-500'} transition-all shadow-2xl`}>
                <input
                  ref={inputRef}
                  type="number"
                  value={localGuess}
                  onChange={(e) => setLocalGuess(e.target.value)}
                  placeholder="Enter your guess"
                  className="w-full bg-surface-900 rounded-2xl px-6 py-8 text-center text-4xl md:text-5xl font-black text-white focus:outline-none"
                  min={min}
                  max={max}
                />
              </div>
              <button 
                type="submit" 
                className="mt-6 w-full py-5 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-black shadow-lg rounded-2xl font-black text-xl transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                SUBMIT GUESS
              </button>
            </form>

            <div className="w-full mt-8 grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
              <button onClick={() => usePowerUp('hints')} disabled={myState.powerUps.hints <= 0} className="flex flex-col items-center p-3 rounded-xl border bg-surface-800 border-yellow-500/30 text-yellow-400 hover:bg-surface-700 hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100">
                <Lightbulb size={24} className="mb-1" />
                <span className="text-[10px] font-bold uppercase">Hint ({myState.powerUps.hints})</span>
              </button>
              <button onClick={() => usePowerUp('reGuess')} disabled={myState.powerUps.reGuess <= 0} className="flex flex-col items-center p-3 rounded-xl border bg-surface-800 border-blue-500/30 text-blue-400 hover:bg-surface-700 hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100">
                <RefreshCw size={24} className="mb-1" />
                <span className="text-[10px] font-bold uppercase">Reset ({myState.powerUps.reGuess})</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
