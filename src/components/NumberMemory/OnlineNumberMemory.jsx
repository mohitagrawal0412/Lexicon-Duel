import React, { useState, useEffect, useRef } from 'react';
import { updatePartyRoom } from '../../services/roomService';
import { concludeGameAndReturnToLobby } from '../../services/relationshipService';
import { ROUND_LENGTHS, MEMORY_TIME_MS, generateSequence, calculateScore } from '../../config/numberMemory';
import { Trophy, Check, Delete } from 'lucide-react';

export default function OnlineNumberMemory({ room, roomId, isHost }) {
  useEffect(() => {
    if (isHost && (!room.gameState || room.gameState === 'initializing')) {
      updatePartyRoom(roomId, {
        gameState: {
          currentRoundIndex: 0,
          scores: { p1: 0, p2: 0 },
          phase: 'READY', // READY, MEMORIZE, RECALL, ROUND_OVER, GAME_OVER
          targetSequence: generateSequence(ROUND_LENGTHS[0]),
          inputs: { p1: '', p2: '' },
          submitted: { p1: false, p2: false },
          roundResults: null,
          phaseStartTime: Date.now()
        }
      });
    }
  }, [isHost, room.gameState, roomId]);

  if (!room.gameState || typeof room.gameState === 'string') {
    return <div className="text-white text-center pt-20">Initializing Game...</div>;
  }
  return <InnerOnlineNumberMemory room={room} roomId={roomId} isHost={isHost} />;
}

function InnerOnlineNumberMemory({ room, roomId, isHost }) {

  const { currentRoundIndex, scores, phase, targetSequence, inputs, submitted, roundResults, phaseStartTime } = room.gameState;
  const myPlayerKey = isHost ? 'p1' : 'p2';
  const oppPlayerKey = isHost ? 'p2' : 'p1';

  // Host-driven phase progression
  useEffect(() => {
    if (!isHost) return;

    const checkPhases = () => {
      const now = Date.now();
      const elapsed = now - phaseStartTime;

      if (phase === 'READY' && elapsed >= 1500) {
        updatePartyRoom(roomId, {
          'gameState/phase': 'MEMORIZE',
          'gameState/phaseStartTime': now
        });
      } else if (phase === 'MEMORIZE' && elapsed >= MEMORY_TIME_MS) {
        updatePartyRoom(roomId, {
          'gameState/phase': 'RECALL',
          'gameState/phaseStartTime': now
        });
      } else if (phase === 'RECALL' && ( (submitted.p1 && submitted.p2) || elapsed >= 30000 )) {
        // Both submitted or timed out
        const p1Result = calculateScore(targetSequence, inputs.p1);
        const p2Result = calculateScore(targetSequence, inputs.p2);

        updatePartyRoom(roomId, {
          'gameState/phase': 'ROUND_OVER',
          'gameState/phaseStartTime': now,
          'gameState/roundResults': { p1: p1Result, p2: p2Result },
          'gameState/scores/p1': scores.p1 + p1Result.score,
          'gameState/scores/p2': scores.p2 + p2Result.score
        });
      } else if (phase === 'ROUND_OVER' && elapsed >= 5000) {
        if (currentRoundIndex + 1 < ROUND_LENGTHS.length) {
          updatePartyRoom(roomId, {
            'gameState/currentRoundIndex': currentRoundIndex + 1,
            'gameState/phase': 'READY',
            'gameState/targetSequence': generateSequence(ROUND_LENGTHS[currentRoundIndex + 1]),
            'gameState/inputs': { p1: '', p2: '' },
            'gameState/submitted': { p1: false, p2: false },
            'gameState/roundResults': null,
            'gameState/phaseStartTime': now
          });
        } else {
          updatePartyRoom(roomId, {
            'gameState/phase': 'GAME_OVER',
            'gameState/phaseStartTime': now
          });
        }
      }
    };

    const interval = setInterval(checkPhases, 500);
    return () => clearInterval(interval);
  }, [isHost, phase, phaseStartTime, submitted, currentRoundIndex, targetSequence, inputs, scores, roomId]);

  const handleKeyPress = async (key) => {
    if (phase !== 'RECALL' || submitted[myPlayerKey]) return;

    let currentInput = inputs[myPlayerKey];
    if (key === 'DEL') {
      currentInput = currentInput.slice(0, -1);
    } else if (currentInput.length < targetSequence.length) {
      currentInput += key;
    } else {
      return;
    }

    await updatePartyRoom(roomId, {
      [`gameState/inputs/${myPlayerKey}`]: currentInput
    });
  };

  const handleSubmit = async () => {
    if (phase !== 'RECALL' || submitted[myPlayerKey]) return;
    await updatePartyRoom(roomId, {
      [`gameState/submitted/${myPlayerKey}`]: true
    });
  };

  const renderNumpad = () => {
    const numbers = ['1','2','3','4','5','6','7','8','9','DEL','0','GO'];
    const myInput = inputs[myPlayerKey];
    const isSubmitted = submitted[myPlayerKey];
    const colorClass = isHost ? 'bg-p1-500' : 'bg-p2-500';

    return (
      <div className="grid grid-cols-3 gap-3 w-full max-w-[280px] mx-auto mt-8">
        {numbers.map(num => (
          <button
            key={num}
            onClick={() => {
              if (num === 'GO') handleSubmit();
              else handleKeyPress(num);
            }}
            disabled={isSubmitted}
            className={`
              h-16 rounded-xl font-bold text-2xl transition-transform active:scale-90 shadow-lg
              ${num === 'GO' 
                ? (myInput.length === targetSequence.length ? `${colorClass} text-white` : 'bg-surface-700 text-gray-500') 
                : num === 'DEL' 
                  ? 'bg-red-500/20 text-red-400' 
                  : 'bg-surface-800 text-white hover:bg-surface-700 border border-white/5'}
              ${isSubmitted ? 'opacity-50 grayscale cursor-not-allowed' : ''}
            `}
          >
            {num === 'DEL' ? <Delete className="mx-auto" size={24} /> : num === 'GO' ? <Check className="mx-auto" size={28} /> : num}
          </button>
        ))}
      </div>
    );
  };

  const renderInputDisplay = (playerKey) => {
    const input = inputs[playerKey];
    const isMe = playerKey === myPlayerKey;
    const colorClass = playerKey === 'p1' ? 'text-p1-400 border-p1-500/50 bg-p1-500/20' : 'text-p2-400 border-p2-500/50 bg-p2-500/20';
    
    // Mask with asterisks unless ROUND_OVER
    const displayChars = Array(targetSequence.length).fill('_');
    for (let i = 0; i < targetSequence.length; i++) {
      if (i < input.length) {
        displayChars[i] = phase === 'ROUND_OVER' ? input[i] : (isMe ? input[i] : '*'); // I can see my own input during typing, but opp sees *
      }
    }

    return (
      <div className="flex gap-2 justify-center mb-6 flex-wrap">
        {displayChars.map((char, idx) => {
          let bgColor = 'bg-surface-900';
          let textColor = 'text-gray-400';
          let borderColor = 'border-white/10';

          if (phase === 'ROUND_OVER' && roundResults) {
            const result = roundResults[playerKey];
            if (char !== '_' && char !== '*') {
              const isMatch = result.matches[idx];
              bgColor = isMatch ? colorClass.split(' ')[2] : 'bg-red-500/20';
              textColor = isMatch ? colorClass.split(' ')[0] : 'text-red-400';
              borderColor = isMatch ? colorClass.split(' ')[1] : 'border-red-500/50';
            }
          } else if (char !== '_' && char !== '*') {
             textColor = 'text-white';
             borderColor = 'border-white/30';
          }

          return (
            <div 
              key={idx}
              className={`w-10 h-12 md:w-12 md:h-14 flex items-center justify-center rounded-xl border-2 ${bgColor} ${borderColor} ${textColor} text-2xl font-black shadow-inner`}
            >
              {char}
            </div>
          );
        })}
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
              onClick={() => concludeGameAndReturnToLobby(roomId, room.host, room.guest, 'numberMemory', scores.p1, scores.p2)}
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

  return (
    <div className="h-full pt-16 flex flex-col p-4 animate-fade-in relative max-w-4xl mx-auto z-40">
      {/* HUD */}
      <div className="flex justify-between items-center mb-8 bg-surface-900 border border-white/10 rounded-2xl p-4">
        <div className="flex flex-col items-center">
          <span className="text-p1-400 font-bold">{hostName}</span>
          <span className="text-4xl font-black text-white">{scores.p1}</span>
        </div>
        
        <div className="flex flex-col items-center text-center px-4">
          <div className="text-indigo-400 font-black tracking-widest uppercase mb-1">
            ROUND {currentRoundIndex + 1}/{ROUND_LENGTHS.length}
          </div>
          <div className="text-gray-400 text-sm font-bold">
            {ROUND_LENGTHS[currentRoundIndex]} Digits
          </div>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-p2-400 font-bold">{guestName}</span>
          <span className="text-4xl font-black text-white">{scores.p2}</span>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        {phase === 'READY' && (
          <div className="text-5xl font-black animate-pulse text-white text-center">GET READY</div>
        )}
        
        {phase === 'MEMORIZE' && (
          <div className="text-center animate-pop-in">
            <div className="text-gray-400 font-bold mb-4 uppercase tracking-widest">Memorize This</div>
            <div className="text-5xl md:text-8xl font-mono font-black tracking-widest text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">
              {targetSequence}
            </div>
          </div>
        )}

        {phase === 'RECALL' && (
          <div className="w-full max-w-lg mx-auto animate-fade-in bg-surface-900/50 p-6 md:p-8 rounded-3xl border border-white/5">
            {submitted[myPlayerKey] ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-6"></div>
                <div className="text-2xl font-bold text-emerald-400 animate-pulse">WAITING FOR OPPONENT...</div>
              </div>
            ) : (
              <>
                <div className="text-center text-gray-400 font-bold mb-6 uppercase tracking-widest">Enter Sequence</div>
                {renderInputDisplay(myPlayerKey)}
                {renderNumpad()}
              </>
            )}
          </div>
        )}

        {phase === 'ROUND_OVER' && (
          <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 animate-slide-up">
            <div className="bg-surface-900 p-6 rounded-3xl border border-p1-500/20 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-p1-500"></div>
              <h3 className="text-p1-400 font-bold mb-4">{hostName}</h3>
              {renderInputDisplay('p1')}
              <div className="text-3xl font-black text-p1-400 mt-4">+{roundResults?.p1?.score || 0} PTS</div>
            </div>

            <div className="bg-surface-900 p-6 rounded-3xl border border-p2-500/20 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-p2-500"></div>
              <h3 className="text-p2-400 font-bold mb-4">{guestName}</h3>
              {renderInputDisplay('p2')}
              <div className="text-3xl font-black text-p2-400 mt-4">+{roundResults?.p2?.score || 0} PTS</div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
