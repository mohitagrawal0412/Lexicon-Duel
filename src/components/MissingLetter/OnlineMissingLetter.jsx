import React, { useState, useEffect } from 'react';
import { updatePartyRoom } from '../../services/roomService';
import { concludeGameAndReturnToLobby } from '../../services/relationshipService';
import { generateMissingLetter, MAX_SCORE } from '../../config/missingLetter';
import { Trophy } from 'lucide-react';

export default function OnlineMissingLetter({ room, roomId, isHost }) {
  useEffect(() => {
    if (isHost && (!room.gameState || room.gameState === 'initializing')) {
      updatePartyRoom(roomId, {
        gameState: {
          scores: { p1: 0, p2: 0 },
          phase: 'PLAYING', // PLAYING, ROUND_OVER, GAME_OVER
          roundData: generateMissingLetter('RANDOM'),
          roundWinner: null,
          errorState: { p1: false, p2: false }
        }
      });
    }
  }, [isHost, room.gameState, roomId]);

  if (!room.gameState || typeof room.gameState === 'string') {
    return <div className="text-white text-center pt-20">Initializing Game...</div>;
  }
  return <InnerOnlineMissingLetter room={room} roomId={roomId} isHost={isHost} />;
}

function InnerOnlineMissingLetter({ room, roomId, isHost }) {

  const { scores, phase, roundData, roundWinner, errorState } = room.gameState;
  const myPlayerKey = isHost ? 'p1' : 'p2';
  const oppPlayerKey = isHost ? 'p2' : 'p1';

  const handleKeyPress = async (key) => {
    if (phase !== 'PLAYING' || errorState[myPlayerKey]) return;

    if (key === roundData.missingLetter) {
      // WIN ROUND
      const updates = {
        'gameState/phase': 'ROUND_OVER',
        'gameState/roundWinner': myPlayerKey,
        [`gameState/scores/${myPlayerKey}`]: scores[myPlayerKey] + 1
      };
      await updatePartyRoom(roomId, updates);
    } else {
      // INCORRECT
      await updatePartyRoom(roomId, { [`gameState/errorState/${myPlayerKey}`]: true });
    }
  };

  useEffect(() => {
    let t;
    if (errorState?.[myPlayerKey]) {
      t = setTimeout(() => {
        updatePartyRoom(roomId, { [`gameState/errorState/${myPlayerKey}`]: false });
      }, 800);
    }
    return () => clearTimeout(t);
  }, [errorState?.[myPlayerKey], myPlayerKey, roomId]);

  // Next round progression
  useEffect(() => {
    if (isHost && phase === 'ROUND_OVER' && roundWinner) {
      const winnerScore = scores[roundWinner];
      
      let timeoutId;
      if (winnerScore >= MAX_SCORE) {
        timeoutId = setTimeout(() => {
          updatePartyRoom(roomId, { 'gameState/phase': 'GAME_OVER' });
        }, 1500);
      } else {
        timeoutId = setTimeout(() => {
          updatePartyRoom(roomId, {
            'gameState/phase': 'PLAYING',
            'gameState/roundWinner': null,
            'gameState/roundData': generateMissingLetter('RANDOM'),
            'gameState/errorState': { p1: false, p2: false }
          });
        }, 2000);
      }
      return () => clearTimeout(timeoutId);
    }
  }, [isHost, phase, roundWinner, scores, roomId]);

  const renderKeyboard = () => {
    const rows = [
      ['Q','W','E','R','T','Y','U','I','O','P'],
      ['A','S','D','F','G','H','J','K','L'],
      ['Z','X','C','V','B','N','M']
    ];

    return (
      <div className="flex flex-col gap-2 items-center w-full max-w-2xl mx-auto mt-12">
        {rows.map((row, rowIdx) => (
          <div key={rowIdx} className="flex gap-2 justify-center w-full">
            {row.map(key => (
              <button
                key={key}
                onClick={() => handleKeyPress(key)}
                disabled={phase !== 'PLAYING' || errorState[myPlayerKey]}
                className="flex-1 max-w-[60px] h-14 md:h-16 bg-surface-700 hover:bg-surface-600 rounded-xl text-white font-bold text-xl md:text-2xl shadow-lg transition-transform active:scale-90 disabled:opacity-50"
              >
                {key}
              </button>
            ))}
          </div>
        ))}
      </div>
    );
  };

  const hostName = room.host.displayName;
  const guestName = room.guest?.displayName || 'Guest';

  if (phase === 'GAME_OVER') {
    const p1Win = scores.p1 > scores.p2;
    const tie = scores.p1 === scores.p2;
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
              <div className="text-4xl font-black text-white">{scores.p1}</div>
            </div>
            <div className="text-center p-4 bg-surface-800 rounded-2xl border border-p2-500/30">
              <h3 className="text-p2-400 font-bold mb-1">{guestName}</h3>
              <div className="text-4xl font-black text-white">{scores.p2}</div>
            </div>
          </div>

          {isHost ? (
            <button 
              onClick={() => concludeGameAndReturnToLobby(roomId, room.host, room.guest, 'missingLetter', scores.p1, scores.p2)}
              className="w-full py-4 bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-400 hover:to-blue-400 text-white rounded-xl font-bold transition-all hover:scale-[1.02]"
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

  return (
    <div className="h-full pt-16 flex flex-col p-4 animate-fade-in relative max-w-4xl mx-auto z-40">
      
      {/* HUD */}
      <div className="flex justify-between items-center mb-8 bg-surface-900 border border-white/10 rounded-2xl p-4">
        <div className="flex flex-col items-center">
          <span className="text-p1-400 font-bold">{hostName}</span>
          <span className="text-4xl font-black text-white">{scores.p1}</span>
        </div>
        
        <div className="flex flex-col items-center text-center px-4">
          <div className="text-teal-400 font-black tracking-widest uppercase mb-1">
            Missing Letter
          </div>
          <div className="text-gray-400 text-sm font-bold border border-white/20 px-3 py-1 rounded-full">
            {roundData.categoryName}
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
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <div className={`text-5xl md:text-7xl font-black ${isWinner ? 'text-green-400 animate-bounce-in drop-shadow-lg' : 'text-red-400 opacity-50'}`}>
              {isWinner ? '+1 POINT' : 'TOO SLOW'}
            </div>
          </div>
        )}

        <div className={`w-full flex flex-col items-center gap-6 ${phase === 'ROUND_OVER' && isLoser ? 'opacity-30 blur-sm' : ''}`}>
          
          {/* Word Display */}
          <div className="flex gap-2 md:gap-4 justify-center">
            {(roundData?.displayArray || []).map((char, idx) => (
              <div 
                key={idx}
                className={`w-12 h-16 md:w-16 md:h-20 flex items-center justify-center text-4xl md:text-5xl font-black rounded-xl border-b-4 shadow-lg
                  ${char === '_' 
                    ? (phase === 'ROUND_OVER' ? 'text-green-400 border-green-500' : 'text-yellow-400 border-yellow-500 animate-pulse bg-yellow-500/10') 
                    : 'text-white border-surface-600 bg-surface-700'
                  }
                `}
              >
                {char === '_' && phase === 'ROUND_OVER' ? roundData.missingLetter : char}
              </div>
            ))}
          </div>

          {/* Error Message */}
          <div className="h-6 mt-4">
            {hasError && <span className="text-red-400 font-bold px-4 py-2 bg-red-500/20 rounded-full">Wrong letter! Time penalty...</span>}
          </div>

          {/* Keyboard */}
          {renderKeyboard()}

        </div>
      </div>
    </div>
  );
}
