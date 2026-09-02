import React, { useState, useEffect } from 'react';
import { updatePartyRoom } from '../../services/roomService';
import { concludeGameAndReturnToLobby } from '../../services/relationshipService';
import { generateBoard, MAX_SCORE } from '../../config/memoryMatch';
import { Trophy } from 'lucide-react';

export default function OnlineMemoryMatch({ room, roomId, isHost }) {
  useEffect(() => {
    if (isHost && (!room.gameState || room.gameState === 'initializing')) {
      const board = generateBoard('HARD'); // Standardize on hard for online or let host pick later
      updatePartyRoom(roomId, {
        gameState: {
          scores: { p1: 0, p2: 0 },
          phase: 'MEMORIZE', // MEMORIZE, PLAYING, ROUND_OVER, GAME_OVER
          boardData: board,
          p1State: { flipped: [], matched: [], locked: false },
          p2State: { flipped: [], matched: [], locked: false },
          roundWinner: null,
          phaseStartTime: Date.now()
        }
      });
    }
  }, [isHost, room.gameState, roomId]);

  if (!room.gameState || typeof room.gameState === 'string') {
    return <div className="text-white text-center pt-20">Initializing Game...</div>;
  }
  return <InnerOnlineMemoryMatch room={room} roomId={roomId} isHost={isHost} />;
}

function InnerOnlineMemoryMatch({ room, roomId, isHost }) {

  const { scores, phase, boardData, p1State, p2State, roundWinner, phaseStartTime } = room.gameState;
  const myPlayerKey = isHost ? 'p1' : 'p2';
  const myState = isHost ? p1State : p2State;

  // Host-driven phase progression (MEMORIZE -> PLAYING)
  useEffect(() => {
    if (!isHost || phase !== 'MEMORIZE') return;
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - phaseStartTime;
      if (elapsed >= 4000) {
        updatePartyRoom(roomId, { 'gameState/phase': 'PLAYING' });
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isHost, phase, phaseStartTime, roomId]);

  const endRound = async (winner) => {
    if (!isHost) return;
    
    let newScores = { ...scores };
    newScores[winner] += 1;

    await updatePartyRoom(roomId, {
      'gameState/phase': 'ROUND_OVER',
      'gameState/roundWinner': winner,
      'gameState/scores': newScores
    });
  };

  const handleCardTap = async (cardIdx) => {
    if (phase !== 'PLAYING') return;
    
    // Ignore if locked, already matched, or already flipped
    const currentFlipped = myState.flipped || [];
    const currentMatched = myState.matched || [];
    
    if (myState.locked || currentMatched.includes(cardIdx) || currentFlipped.includes(cardIdx)) return;

    const newFlipped = [...currentFlipped, cardIdx];
    
    let updates = {
      [`gameState/${myPlayerKey}State/flipped`]: newFlipped
    };

    if (newFlipped.length === 2) {
      updates[`gameState/${myPlayerKey}State/locked`] = true;
      
      const [firstIdx, secondIdx] = newFlipped;
      const isMatch = boardData[firstIdx].emoji === boardData[secondIdx].emoji;

      if (isMatch) {
        const newMatched = [...currentMatched, firstIdx, secondIdx];
        updates[`gameState/${myPlayerKey}State/matched`] = newMatched;
        
        if (newMatched.length === boardData.length) {
           // Round win!
           if (isHost) {
             await endRound(myPlayerKey);
             // We don't need to unlock/clear flipped if the round ends
           } else {
              // Guest triggers win
              let newScores = { ...scores };
              newScores[myPlayerKey] += 1;
              updates['gameState/phase'] = 'ROUND_OVER';
              updates['gameState/roundWinner'] = myPlayerKey;
              updates['gameState/scores'] = newScores;
              // Host's effect will catch the ROUND_OVER and schedule next round
           }
        } else {
          // Clear flipped to allow next move
          updates[`gameState/${myPlayerKey}State/flipped`] = [];
          updates[`gameState/${myPlayerKey}State/locked`] = false;
        }
        await updatePartyRoom(roomId, updates);
      } else {
        // Mismatch
        await updatePartyRoom(roomId, updates);
        
        // Timeout to flip back
        setTimeout(() => {
          updatePartyRoom(roomId, {
            [`gameState/${myPlayerKey}State/flipped`]: [],
            [`gameState/${myPlayerKey}State/locked`]: false
          });
        }, 800);
      }
    } else {
      await updatePartyRoom(roomId, updates);
    }
  };


  // Consolidated round progression for ALL wins (host and guest)
  useEffect(() => {
    if (!isHost || phase !== 'ROUND_OVER' || !roundWinner) return;

    const winnerScore = scores[roundWinner];
    let timeoutId;

    if (winnerScore >= MAX_SCORE) {
      timeoutId = setTimeout(() => {
        updatePartyRoom(roomId, { 'gameState/phase': 'GAME_OVER' });
      }, 2000);
    } else {
      timeoutId = setTimeout(() => {
        const board = generateBoard('HARD');
        updatePartyRoom(roomId, {
          'gameState/phase': 'MEMORIZE',
          'gameState/roundWinner': null,
          'gameState/boardData': board,
          'gameState/p1State': { flipped: [], matched: [], locked: false },
          'gameState/p2State': { flipped: [], matched: [], locked: false },
          'gameState/phaseStartTime': Date.now()
        });
      }, 3000);
    }

    return () => clearTimeout(timeoutId);
  }, [isHost, phase, roundWinner, scores, roomId]);

  const renderCard = (card, idx) => {
    const currentFlipped = myState.flipped || [];
    const currentMatched = myState.matched || [];
    const isFlipped = phase === 'MEMORIZE' || currentFlipped.includes(idx) || currentMatched.includes(idx);
    const isMatched = currentMatched.includes(idx);

    return (
      <button
        key={card.id}
        onClick={() => handleCardTap(idx)}
        className="relative w-16 h-24 md:w-20 md:h-28 active:scale-95 transition-transform"
        style={{ perspective: '1000px' }}
      >
        <div 
          className="w-full h-full duration-500 relative"
          style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
        >
          {/* Back */}
          <div 
            className="absolute w-full h-full bg-surface-800 border-2 border-surface-600 rounded-xl shadow-lg flex items-center justify-center"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="w-1/2 h-1/2 bg-surface-700 rounded-full opacity-50"></div>
          </div>
          
          {/* Front */}
          <div 
            className={`absolute w-full h-full rounded-xl shadow-lg flex items-center justify-center text-4xl md:text-5xl border-2
              ${isMatched ? 'bg-surface-700/50 border-green-500/50 opacity-50' : 'bg-surface-700 border-surface-500'}
            `}
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            {card.emoji}
          </div>
        </div>
      </button>
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
              onClick={() => concludeGameAndReturnToLobby(roomId, room.host, room.guest, 'memoryMatch', scores.p1, scores.p2)}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white rounded-xl font-bold transition-all hover:scale-[1.02]"
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

  const gridCols = 'grid-cols-4';
  const gridRows = 'grid-rows-4';

  return (
    <div className="h-full pt-16 flex flex-col p-4 animate-fade-in relative max-w-4xl mx-auto z-40">
      
      {/* HUD */}
      <div className="flex justify-between items-center mb-8 bg-surface-900 border border-white/10 rounded-2xl p-4">
        <div className="flex flex-col items-center">
          <span className="text-p1-400 font-bold">{hostName}</span>
          <span className="text-4xl font-black text-white">{scores.p1}</span>
        </div>
        
        <div className="flex flex-col items-center text-center px-4">
          <div className="text-purple-400 font-black tracking-widest uppercase mb-1">
            Memory Match
          </div>
          <div className="text-gray-400 text-sm font-bold border border-white/20 px-3 py-1 rounded-full">
            First to {MAX_SCORE}
          </div>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-p2-400 font-bold">{guestName}</span>
          <span className="text-4xl font-black text-white">{scores.p2}</span>
        </div>
      </div>

      {/* Main Play Area */}
      <div className={`flex-1 flex flex-col items-center justify-center relative w-full`}>
        
        {phase === 'MEMORIZE' && (
          <div className="absolute top-0 flex flex-col items-center justify-center z-20 pointer-events-none">
            <div className={`text-4xl font-black text-yellow-400 animate-pulse`}>
              MEMORIZE!
            </div>
          </div>
        )}

        {phase === 'ROUND_OVER' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/40 backdrop-blur-[2px]">
            <div className={`text-5xl md:text-7xl font-black mb-2 ${isWinner ? 'text-green-400 animate-bounce-in drop-shadow-lg' : 'text-red-400 opacity-80'}`}>
              {isWinner ? 'BOARD CLEARED!' : 'TOO SLOW'}
            </div>
          </div>
        )}

        <div className={`grid ${gridCols} ${gridRows} gap-2 md:gap-3 ${phase === 'ROUND_OVER' && isLoser ? 'opacity-30 blur-sm' : ''}`}>
          {(boardData || []).map((card, idx) => renderCard(card, idx))}
        </div>
      </div>
    </div>
  );
}
