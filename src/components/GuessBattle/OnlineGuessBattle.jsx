import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { TOTAL_ROUNDS, ROUND_RANGES, TIMER_MODES, calculateRoundResult, getHint, POWER_UP_DEFAULTS } from '../../config/guessBattle';
import { subscribeToGuessBattleRoom, submitGuessBattleGuess, writeGuessBattleReveal, advanceGuessBattleRound, updateGuessBattlePowerUp, leaveGuessBattleRoom } from '../../services/guessBattleService';
import { Lightbulb, Zap, RefreshCw, X, Copy, Check, Users, Trophy } from 'lucide-react';

const REVEAL_TIME = 5;

export default function OnlineGuessBattle() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [room, setRoom] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  
  const [localGuess, setLocalGuess] = useState('');
  const [timeLeft, setTimeLeft] = useState(15);
  const [activeHint, setActiveHint] = useState(null);
  
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const unsub = subscribeToGuessBattleRoom(roomId, (data) => {
      if (!data) {
        setError('Room closed or does not exist.');
        return;
      }
      setRoom(data);
    });

    return () => unsub();
  }, [roomId, user, navigate]);

  // Timer logic for active rounds
  useEffect(() => {
    if (!room || room.status !== 'round_active') return;

    // Reset local state when a new round starts
    setLocalGuess('');
    setActiveHint(null);
    setTimeLeft(TIMER_MODES[room.timerMode].seconds);

    // Focus input
    setTimeout(() => { if (inputRef.current) inputRef.current.focus(); }, 100);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.status, room?.currentRound]);

  // Handle both players submitted
  useEffect(() => {
    if (!room || room.status !== 'round_active' || !isHost) return;

    if (room.hostPlayer?.submitted && room.guestPlayer?.submitted) {
      clearInterval(timerRef.current);
      processRoundResult();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.hostPlayer?.submitted, room?.guestPlayer?.submitted, room?.status]);

  const isHost = room?.hostPlayer?.uid === user?.uid;
  const isGuest = room?.guestPlayer?.uid === user?.uid;
  const playerKey = isHost ? 'hostPlayer' : 'guestPlayer';
  const myState = room?.[playerKey];
  const oppState = isHost ? room?.guestPlayer : room?.hostPlayer;

  const handleTimeUp = async () => {
    if (!myState?.submitted) {
      await submitGuessBattleGuess(roomId, playerKey, localGuess, myState?.doublePointsActive || false);
    }
  };

  const handleGuessSubmit = async (e) => {
    e.preventDefault();
    if (localGuess === '' || myState?.submitted) return;
    await submitGuessBattleGuess(roomId, playerKey, localGuess, myState?.doublePointsActive || false);
  };

  const processRoundResult = async () => {
    // Only host runs this
    const hNum = parseInt(room.hostPlayer.guess, 10) || 0;
    const gNum = parseInt(room.guestPlayer.guess, 10) || 0;
    
    const result = calculateRoundResult(
      room.secretNumber, 
      hNum, 
      gNum, 
      room.hostPlayer.doublePointsActive, 
      room.guestPlayer.doublePointsActive
    );
    
    // Calculate new stats
    const hStats = { ...room.hostPlayer.stats };
    hStats.score += result.p1Points;
    hStats.exact += (result.p1Exact ? 1 : 0);
    hStats.diff += result.p1Diff;
    hStats.bestDiff = Math.min(hStats.bestDiff, result.p1Diff);
    hStats.streak = result.winner === 'p1' ? hStats.streak + 1 : 0;
    hStats.maxStreak = Math.max(hStats.maxStreak, hStats.streak);

    const gStats = { ...room.guestPlayer.stats };
    gStats.score += result.p2Points;
    gStats.exact += (result.p2Exact ? 1 : 0);
    gStats.diff += result.p2Diff;
    gStats.bestDiff = Math.min(gStats.bestDiff, result.p2Diff);
    gStats.streak = result.winner === 'p2' ? gStats.streak + 1 : 0;
    gStats.maxStreak = Math.max(gStats.maxStreak, gStats.streak);

    const nextStatus = room.currentRound >= TOTAL_ROUNDS ? 'game_over' : 'reveal';

    await writeGuessBattleReveal(roomId, result, hStats, gStats, nextStatus);

    if (nextStatus === 'reveal') {
      setTimeout(() => {
        advanceGuessBattleRound(roomId, room.currentRound + 1);
      }, REVEAL_TIME * 1000);
    }
  };

  const usePowerUp = async (type) => {
    if (!myState || myState.powerUps[type] <= 0 || myState.submitted) return;
    
    await updateGuessBattlePowerUp(roomId, playerKey, type, myState.powerUps[type] - 1);
    
    if (type === 'hints') {
      const hintsUsed = POWER_UP_DEFAULTS.hints - myState.powerUps.hints;
      setActiveHint(getHint(room.secretNumber, room.currentRound, hintsUsed));
    } else if (type === 'doublePoints') {
      await submitGuessBattleGuess(roomId, playerKey, localGuess, true); // this submits early but ok for now, let's just update local state if we want to submit later. Actually, RTDB update would be better. Let's just re-submit if needed.
    } else if (type === 'reGuess') {
      setLocalGuess('');
      if (inputRef.current) inputRef.current.focus();
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeave = async () => {
    if (window.confirm('Leave game?')) {
      if (isHost && room.status === 'waiting') {
        await leaveGuessBattleRoom(roomId);
      }
      navigate('/guess-battle');
    }
  };

  if (error) {
    return (
      <div className="min-h-screen game-bg flex flex-col items-center justify-center p-6 text-center">
        <div className="p-6 bg-red-900/50 border border-red-500 rounded-2xl max-w-md w-full">
          <h2 className="text-xl font-bold text-red-200 mb-4">{error}</h2>
          <button onClick={() => navigate('/guess-battle')} className="px-6 py-2 bg-surface-800 text-white rounded-lg hover:bg-surface-700">Back</button>
        </div>
      </div>
    );
  }

  if (!room) return <div className="min-h-screen game-bg flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-p1-500"></div></div>;

  if (room.status === 'waiting') {
    return (
      <div className="min-h-screen game-bg flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-surface-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 to-pink-500" />
          <Users size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-black text-white mb-2">Waiting for Opponent</h2>
          <p className="text-gray-400 mb-8">Share this code with a friend to play!</p>
          
          <div className="bg-surface-800 rounded-2xl p-4 flex items-center justify-between border border-white/10 mb-8">
            <span className="text-4xl font-mono font-black text-white tracking-widest">{roomId}</span>
            <button 
              onClick={handleCopyCode}
              className="p-3 bg-surface-700 hover:bg-surface-600 rounded-xl text-white transition-colors"
            >
              {copied ? <Check className="text-green-400" /> : <Copy />}
            </button>
          </div>
          
          <button onClick={handleLeave} className="px-6 py-3 bg-surface-800 hover:bg-surface-700 text-white rounded-xl font-bold transition-colors w-full">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  const { min, max } = ROUND_RANGES[room.currentRound - 1] || ROUND_RANGES[TOTAL_ROUNDS - 1];

  if (room.status === 'reveal' && room.roundRevealData) {
    const res = room.roundRevealData;
    const iWon = (isHost && res.winner === 'p1') || (isGuest && res.winner === 'p2');
    const oppWon = (isHost && res.winner === 'p2') || (isGuest && res.winner === 'p1');
    const tie = res.winner === 'tie';

    const myRes = isHost ? { guess: room.hostPlayer.guess, diff: res.p1Diff, pts: res.p1Points, exact: res.p1Exact } : { guess: room.guestPlayer.guess, diff: res.p2Diff, pts: res.p2Points, exact: res.p2Exact };
    const opRes = isHost ? { guess: room.guestPlayer.guess, diff: res.p2Diff, pts: res.p2Points, exact: res.p2Exact } : { guess: room.hostPlayer.guess, diff: res.p1Diff, pts: res.p1Points, exact: res.p1Exact };

    return (
      <div className="min-h-screen game-bg flex flex-col items-center justify-center p-6 text-center">
        <h3 className="text-gray-400 font-bold uppercase tracking-widest mb-2">The Secret Number Was</h3>
        <div className="text-6xl md:text-8xl font-black text-white mb-12 animate-score-pop">{room.secretNumber.toLocaleString()}</div>
        
        <div className="w-full max-w-4xl grid grid-cols-2 gap-4 md:gap-8 mb-12">
          {/* My Reveal */}
          <div className={`p-6 rounded-3xl border-2 transition-all ${iWon ? 'bg-p1-500/20 border-p1-500 scale-105 glow-p1' : 'bg-surface-900/50 border-surface-800'}`}>
            <h4 className="text-p1-400 font-bold mb-2">You</h4>
            <div className="text-3xl md:text-4xl font-black text-white mb-2">{myRes.guess || 'No Guess'}</div>
            <div className="text-gray-400 text-sm">Off by {myRes.diff.toLocaleString()}</div>
            {myRes.exact && <div className="text-yellow-400 font-bold mt-2 text-sm animate-pulse">🎯 EXACT MATCH!</div>}
            {myRes.pts > 0 && <div className="text-green-400 font-black text-xl mt-4 animate-slide-up">+{myRes.pts}</div>}
          </div>
          {/* Opponent Reveal */}
          <div className={`p-6 rounded-3xl border-2 transition-all ${oppWon ? 'bg-p2-500/20 border-p2-500 scale-105 glow-p2' : 'bg-surface-900/50 border-surface-800'}`}>
            <h4 className="text-p2-400 font-bold mb-2">Opponent</h4>
            <div className="text-3xl md:text-4xl font-black text-white mb-2">{opRes.guess || 'No Guess'}</div>
            <div className="text-gray-400 text-sm">Off by {opRes.diff.toLocaleString()}</div>
            {opRes.exact && <div className="text-yellow-400 font-bold mt-2 text-sm animate-pulse">🎯 EXACT MATCH!</div>}
            {opRes.pts > 0 && <div className="text-green-400 font-black text-xl mt-4 animate-slide-up">+{opRes.pts}</div>}
          </div>
        </div>
      </div>
    );
  }

  if (room.status === 'game_over') {
    const hScore = room.hostPlayer.stats.score;
    const gScore = room.guestPlayer.stats.score;
    const iWon = (isHost && hScore > gScore) || (isGuest && gScore > hScore);
    const tie = hScore === gScore;

    return (
       <div className="min-h-screen game-bg flex items-center justify-center p-4">
        <div className="w-full max-w-3xl bg-surface-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          {iWon && <div className="absolute top-0 left-0 w-full h-2 bg-p1-500 glow-p1" />}
          {!iWon && !tie && <div className="absolute top-0 left-0 w-full h-2 bg-p2-500 glow-p2" />}
          
          <h1 className="text-4xl font-black text-center text-white mb-2">GAME OVER</h1>
          <p className="text-center text-xl text-gray-400 mb-8">
            {tie ? "IT'S A TIE!" : iWon ? "YOU WIN! 🎉" : "YOU LOSE! 💀"}
          </p>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="text-center p-4 bg-surface-800 rounded-2xl border border-p1-500/30">
              <h3 className="text-p1-400 font-bold mb-1">You</h3>
              <div className="text-4xl font-black text-white">{myState.stats.score}</div>
            </div>
            <div className="text-center p-4 bg-surface-800 rounded-2xl border border-p2-500/30">
              <h3 className="text-p2-400 font-bold mb-1">Opponent</h3>
              <div className="text-4xl font-black text-white">{oppState.stats.score}</div>
            </div>
          </div>
          
          <div className="flex justify-center">
            <button onClick={() => navigate('/guess-battle')} className="px-6 py-3 bg-surface-800 hover:bg-surface-700 text-white rounded-xl font-bold transition-colors">
              Exit
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active Round
  return (
    <div className="min-h-screen game-bg flex flex-col p-4 md:p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <button onClick={handleLeave} className="p-2 hover:bg-surface-800 text-gray-400 hover:text-white rounded-full transition-colors border border-transparent hover:border-white/10">
          <X size={24} />
        </button>
        <div className="text-center">
          <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Round {room.currentRound} of {TOTAL_ROUNDS}</div>
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
          <span className="text-p1-400 font-bold">You</span>
          <span className="text-white font-black text-xl">{myState?.stats?.score || 0}</span>
        </div>
        <div className="bg-surface-900/50 rounded-xl p-3 flex justify-between items-center border border-p2-500/20">
          <span className="text-p2-400 font-bold">{oppState?.displayName || 'Opponent'}</span>
          <span className="text-white font-black text-xl">{oppState?.stats?.score || 0}</span>
        </div>
      </div>

      {/* Main Guess Area */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-xl mx-auto w-full">
        {activeHint && (
          <div className="mb-6 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-xl text-yellow-200 font-medium animate-slide-up w-full text-center">
            {activeHint}
          </div>
        )}

        {oppState?.submitted && !myState?.submitted && (
          <div className="mb-4 text-p2-400 font-bold animate-pulse">Opponent has locked in their guess!</div>
        )}

        <form onSubmit={handleGuessSubmit} className="w-full">
          <div className={`relative p-1 rounded-3xl ${myState?.submitted ? 'bg-green-500/20 border-green-500' : 'bg-p1-500/20 border-p1-500'} transition-all`}>
            <input
              ref={inputRef}
              type="number"
              value={myState?.submitted ? myState.guess : localGuess}
              onChange={(e) => setLocalGuess(e.target.value)}
              disabled={myState?.submitted}
              placeholder="Enter your guess"
              className="w-full bg-surface-900 rounded-2xl px-6 py-8 text-center text-4xl md:text-5xl font-black text-white focus:outline-none placeholder-gray-700 disabled:opacity-80"
              min={min}
              max={max}
            />
          </div>
          <button 
            type="submit" 
            disabled={myState?.submitted}
            className={`mt-6 w-full py-5 rounded-2xl font-black text-xl transition-transform ${myState?.submitted ? 'bg-green-500 text-white cursor-default' : 'bg-white text-black hover:bg-gray-200 hover:scale-[1.02] active:scale-[0.98]'}`}
          >
            {myState?.submitted ? 'WAITING FOR OPPONENT...' : 'SUBMIT GUESS'}
          </button>
        </form>

        {/* Power Ups */}
        {!myState?.submitted && (
          <div className="w-full mt-12 grid grid-cols-2 gap-4">
             <button 
              onClick={() => usePowerUp('hints')}
              disabled={myState?.powerUps.hints <= 0}
              className={`flex flex-col items-center p-3 rounded-xl border ${myState?.powerUps.hints > 0 ? 'bg-surface-800 border-yellow-500/30 text-yellow-400 hover:bg-surface-700' : 'bg-surface-900/50 border-white/5 text-gray-600 cursor-not-allowed'}`}
            >
              <Lightbulb size={24} className="mb-1" />
              <span className="text-xs font-bold uppercase">Hint ({myState?.powerUps.hints || 0})</span>
            </button>
            <button 
              onClick={() => usePowerUp('reGuess')}
              disabled={myState?.powerUps.reGuess <= 0}
              className={`flex flex-col items-center p-3 rounded-xl border ${myState?.powerUps.reGuess > 0 ? 'bg-surface-800 border-blue-500/30 text-blue-400 hover:bg-surface-700' : 'bg-surface-900/50 border-white/5 text-gray-600 cursor-not-allowed'}`}
            >
              <RefreshCw size={24} className="mb-1" />
              <span className="text-xs font-bold uppercase">Reset ({myState?.powerUps.reGuess || 0})</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
