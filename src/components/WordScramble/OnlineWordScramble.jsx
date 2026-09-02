import React, { useState, useEffect } from 'react';
import { updatePartyRoom } from '../../services/roomService';
import { concludeGameAndReturnToLobby } from '../../services/relationshipService';
import { generateScramble, MAX_SCORE } from '../../config/wordScramble';
import { Trophy } from 'lucide-react';

export default function OnlineWordScramble({ room, roomId, isHost }) {
  useEffect(() => {
    if (isHost && (!room.gameState || room.gameState === 'initializing')) {
      const scramble = generateScramble('MEDIUM');
      updatePartyRoom(roomId, {
        gameState: {
          scores: { p1: 0, p2: 0 },
          phase: 'PLAYING', // PLAYING, ROUND_OVER, GAME_OVER
          targetWord: scramble.word,
          originalLetters: scramble.letters, // keep the array of objects to reset
          roundWinner: null,
          p1State: { placed: [], available: scramble.letters },
          p2State: { placed: [], available: scramble.letters },
          errorState: { p1: false, p2: false },
          lastUpdateTime: Date.now(),
          timeLeft: 60
        }
      });
    }
  }, [isHost, room.gameState, roomId]);

  if (!room.gameState || typeof room.gameState === 'string') {
    return <div className="text-white text-center pt-20">Initializing Game...</div>;
  }
  return <InnerOnlineWordScramble room={room} roomId={roomId} isHost={isHost} />;
}

function InnerOnlineWordScramble({ room, roomId, isHost }) {

  const { scores, phase, targetWord, roundWinner, p1State, p2State, errorState } = room.gameState;
  const myPlayerKey = isHost ? 'p1' : 'p2';
  const oppPlayerKey = isHost ? 'p2' : 'p1';
  const myState = isHost ? p1State : p2State;

  const handleTapAvailable = async (letterObj) => {
    if (phase !== 'PLAYING') return;

    const currentAvailable = myState.available || [];
    const currentPlaced = myState.placed || [];

    const newAvailable = currentAvailable.filter(l => l.id !== letterObj.id);
    const newPlaced = [...currentPlaced, letterObj];

    const updates = {
      [`gameState/${myPlayerKey}State/available`]: newAvailable,
      [`gameState/${myPlayerKey}State/placed`]: newPlaced
    };

    // Auto-check if word is fully formed
    if (newPlaced.length === targetWord.length) {
      const formedWord = newPlaced.map(l => l.char).join('');
      if (formedWord === targetWord) {
        // WIN ROUND
        updates['gameState/phase'] = 'ROUND_OVER';
        updates['gameState/roundWinner'] = myPlayerKey;
        updates[`gameState/scores/${myPlayerKey}`] = scores[myPlayerKey] + 1;
        
        // Host will trigger next round logic but anyone can trigger the win
      } else {
        // INCORRECT
        updates[`gameState/errorState/${myPlayerKey}`] = true;
      }
    }

    await updatePartyRoom(roomId, updates);

  };

  const handleTapPlaced = async (letterObj) => {
    if (phase !== 'PLAYING') return;

    const currentPlaced = myState.placed || [];
    const currentAvailable = myState.available || [];

    const newPlaced = currentPlaced.filter(l => l.id !== letterObj.id);
    const newAvailable = [...currentAvailable, letterObj];

    await updatePartyRoom(roomId, {
      [`gameState/${myPlayerKey}State/placed`]: newPlaced,
      [`gameState/${myPlayerKey}State/available`]: newAvailable,
      [`gameState/errorState/${myPlayerKey}`]: false
    });
  };

  useEffect(() => {
    let t;
    if (errorState?.[myPlayerKey]) {
      t = setTimeout(() => {
        updatePartyRoom(roomId, { [`gameState/errorState/${myPlayerKey}`]: false });
      }, 500);
    }
    return () => clearTimeout(t);
  }, [errorState?.[myPlayerKey], myPlayerKey, roomId]);

  // Next round progression
  useEffect(() => {
    if (isHost && phase === 'ROUND_OVER' && roundWinner) {
      const timeoutId = setTimeout(() => {
        const scramble = generateScramble('MEDIUM');
        updatePartyRoom(roomId, {
          'gameState/phase': 'PLAYING',
          'gameState/roundWinner': null,
          'gameState/targetWord': scramble.word,
          'gameState/originalLetters': scramble.letters,
          'gameState/p1State': { placed: [], available: scramble.letters },
          'gameState/p2State': { placed: [], available: scramble.letters },
          'gameState/errorState': { p1: false, p2: false }
        });
      }, 1500);
      return () => clearTimeout(timeoutId);
    }
  }, [isHost, phase, roundWinner, roomId]);


  const hostName = room.host.displayName;
  const guestName = room.guest?.displayName || 'Guest';

  // Host-driven timer
  useEffect(() => {
    if (!isHost || phase !== 'PLAYING') return;
    
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - (room.gameState.lastUpdateTime || Date.now())) / 1000);
      const newTime = Math.max(0, 60 - elapsed); // 60 second timer
      
      if (newTime !== room.gameState.timeLeft) {
        updatePartyRoom(roomId, { 'gameState/timeLeft': newTime });
      }

      if (newTime <= 0) {
        clearInterval(interval);
        updatePartyRoom(roomId, { 'gameState/phase': 'GAME_OVER' });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isHost, phase, room.gameState.lastUpdateTime, room.gameState.timeLeft, roomId]);

  if (phase === 'GAME_OVER') {
    const p1Win = scores.p1 > scores.p2;
    const tie = scores.p1 === scores.p2;
    return (
       <div className="h-full pt-16 flex items-center justify-center p-4 z-50">
        <div className="w-full max-w-2xl bg-surface-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden text-center">
          <Trophy className={`w-20 h-20 mx-auto mb-4 ${p1Win ? 'text-p1-400' : tie ? 'text-gray-400' : 'text-p2-400'}`} />
          <h1 className="text-4xl font-black text-white mb-2">TIME'S UP!</h1>
          <p className="text-xl text-gray-400 mb-8 font-bold">
            {tie ? "IT'S A TIE!" : `${p1Win ? hostName : guestName} WINS!`}
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="text-center p-4 bg-surface-800 rounded-2xl border border-p1-500/30">
              <h3 className="text-p1-400 font-bold mb-1">{hostName}</h3>
              <div className="text-4xl font-black text-white">{scores.p1}</div>
            </div>
            <div className="text-center p-4 bg-surface-800 rounded-2xl border border-p2-500/30">
              <h3 className="text-p2-400 font-bold mb-1">{guestName}</h3>
              <div className="text-4xl font-black text-white">{scores.p2}</div>
            </div>
          </div>

          {isHost ? (
            <button 
              onClick={() => concludeGameAndReturnToLobby(roomId, room.host, room.guest, 'wordScramble', scores.p1, scores.p2)}
              className="w-full py-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 text-white rounded-xl font-bold transition-all hover:scale-[1.02]"
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

  const isWinner = roundWinner === myPlayerKey;
  const isLoser = roundWinner && roundWinner !== myPlayerKey;
  const hasError = errorState[myPlayerKey];
  const emptySlotsCount = targetWord.length - (myState.placed?.length || 0);

  return (
    <div className="h-full pt-16 flex flex-col p-4 animate-fade-in relative max-w-4xl mx-auto z-40">
      
      {/* HUD */}
      <div className="flex justify-between items-center mb-8 bg-surface-900 border border-white/10 rounded-2xl p-4">
        <div className="flex flex-col items-center">
          <span className="text-p1-400 font-bold">{hostName}</span>
          <span className="text-4xl font-black text-white">{scores.p1}</span>
        </div>
        
        <div className="flex flex-col items-center text-center px-4">
          <div className={`text-3xl font-black ${(room.gameState.timeLeft || 60) <= 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
            {room.gameState.timeLeft ?? 60}s
          </div>
          <div className="text-gray-400 text-sm font-bold">
            Most words wins!
          </div>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-p2-400 font-bold">{guestName}</span>
          <span className="text-4xl font-black text-white">{scores.p2}</span>
        </div>
      </div>

      {/* Main Play Area */}
      <div className={`flex-1 flex flex-col items-center justify-center relative w-full ${hasError ? 'animate-shake' : ''}`}>
        
        {phase === 'ROUND_OVER' && (
          <div className="absolute inset-[-20px] flex flex-col items-center justify-center z-20 bg-black/60 backdrop-blur-[4px] rounded-3xl pointer-events-none">
            <div className={`text-5xl md:text-7xl font-black mb-4 ${isWinner ? 'text-green-400 animate-bounce-in drop-shadow-[0_0_20px_rgba(74,222,128,0.5)]' : 'text-red-400 opacity-80'}`}>
              {isWinner ? '+1 POINT' : 'TOO SLOW'}
            </div>
            <div className="text-2xl font-bold text-white drop-shadow-md">
              {isWinner ? 'Great job!' : `${roundWinner === 'p1' ? hostName : guestName} got it first`}
            </div>
          </div>
        )}

        <div className={`w-full max-w-xl flex flex-col items-center gap-10 ${phase === 'ROUND_OVER' && isLoser ? 'opacity-30 blur-sm' : ''}`}>
          
          {/* Answer Slots */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-4 w-full">
            {(myState.placed || []).map((l, idx) => (
              <button
                key={l.id}
                onClick={() => handleTapPlaced(l)}
                disabled={phase !== 'PLAYING'}
                className={`w-14 h-16 md:w-20 md:h-24 flex items-center justify-center rounded-2xl font-black text-3xl md:text-5xl text-white shadow-xl transition-transform active:scale-90
                  ${hasError ? 'bg-red-500 border-b-4 border-red-700' : 
                    isWinner ? 'bg-green-500 border-b-4 border-green-700' : 
                    isHost ? 'bg-p1-500 border-b-4 border-p1-700' : 'bg-p2-500 border-b-4 border-p2-700'
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
                className="w-14 h-16 md:w-20 md:h-24 rounded-2xl border-2 border-dashed border-white/20 bg-surface-700/50 shadow-inner"
              />
            ))}
          </div>

          <div className="w-full h-1 bg-white/5 rounded-full" />

          {/* Available Letters Pool */}
          <div className="flex flex-wrap justify-center gap-3 md:gap-4 w-full">
            {(myState.available || []).map(l => (
              <button
                key={l.id}
                onClick={() => handleTapAvailable(l)}
                disabled={phase !== 'PLAYING'}
                className="w-14 h-16 md:w-20 md:h-24 flex items-center justify-center rounded-2xl bg-surface-700 border-b-4 border-surface-900 font-black text-3xl md:text-5xl text-gray-200 shadow-lg hover:bg-surface-600 transition-transform active:scale-90"
              >
                {l.char}
              </button>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
