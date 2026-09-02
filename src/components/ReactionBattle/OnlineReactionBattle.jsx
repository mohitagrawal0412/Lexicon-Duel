import React, { useState, useEffect, useRef } from 'react';
import { updatePartyRoom } from '../../services/roomService';
import { concludeGameAndReturnToLobby } from '../../services/relationshipService';
import { Loader2, Zap } from 'lucide-react';
import { generateRound } from '../../config/reactionBattle';

const ROUNDS = 5;

// Randomly pick an item from an array
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

export default function OnlineReactionBattle({ room, roomId, isHost, user }) {
  useEffect(() => {
    if (isHost && (!room.gameState || room.gameState === 'initializing')) {
      const roundInfo = generateRound();
      const targetItem = roundInfo.items.find(item => item.isTarget);

      updatePartyRoom(roomId, {
        gameState: {
          currentRound: 1,
          p1Score: 0,
          p2Score: 0,
          roundActive: false, // true during actual play
          roundData: {
            mode: roundInfo.type,
            items: roundInfo.items,
            target: targetItem
          },
          winner: null,
          roundStartTime: Date.now() + 3000 // 3 seconds "Get Ready" buffer
        }
      });
    }
  }, [isHost, room.gameState, roomId]);

  if (!room.gameState || typeof room.gameState === 'string') {
    return <div className="text-white text-center pt-20">Initializing Game...</div>;
  }
  return <InnerOnlineReactionBattle room={room} roomId={roomId} isHost={isHost} user={user} />;
}

function InnerOnlineReactionBattle({ room, roomId, isHost, user }) {

  const { currentRound, p1Score, p2Score, roundActive, roundData, winner, roundStartTime } = room.gameState;
  const myPlayerNum = isHost ? 1 : 2;

  // Local state for the "Get Ready" countdown
  const [countdown, setCountdown] = useState(3);
  const progressingRef = useRef(false);

  useEffect(() => {
    if (!roundActive && winner === null) {
      const interval = setInterval(() => {
        const remaining = Math.ceil((roundStartTime - Date.now()) / 1000);
        if (remaining <= 0) {
          setCountdown(0);
          if (isHost) {
            // Start the round
            updatePartyRoom(roomId, { 'gameState/roundActive': true });
          }
        } else {
          setCountdown(remaining);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [roundActive, winner, roundStartTime, isHost, roomId]);

  const handleCorrectClick = async () => {
    if (!roundActive || winner !== null) return;
    
    // The first one to write to the DB wins the round
    // We update atomically if possible, but standard update is fine for this prototype
    if (isHost) {
      await progressToNextRound(p1Score + 1, p2Score);
    } else {
      await updatePartyRoom(roomId, {
        'gameState/p2Score': p2Score + 1,
        'gameState/roundActive': false
      });
      // Host will notice roundActive=false and progress the round
    }
  };

  // Host observes guest scoring to generate next round
  useEffect(() => {
    if (isHost && winner === null && (p1Score + p2Score === currentRound)) {
      // Guest won the round, generate next round
      if (!progressingRef.current) {
        progressingRef.current = true;
        progressToNextRound(p1Score, p2Score).finally(() => {
          progressingRef.current = false;
        });
      }
    }
  }, [isHost, p1Score, p2Score, currentRound, winner]);

  const progressToNextRound = async (newP1Score, newP2Score) => {
    if (!isHost) return;

    if (currentRound >= ROUNDS) {
      let finalWinner = 0;
      if (newP1Score > newP2Score) finalWinner = 1;
      else if (newP2Score > newP1Score) finalWinner = 2;
      
      await updatePartyRoom(roomId, {
        'gameState/p1Score': newP1Score,
        'gameState/p2Score': newP2Score,
        'gameState/winner': finalWinner,
        'gameState/roundActive': false
      });
    } else {
      const nextRoundInfo = generateRound();
      const nextTargetItem = nextRoundInfo.items.find(item => item.isTarget);

      await updatePartyRoom(roomId, {
        'gameState/currentRound': currentRound + 1,
        'gameState/p1Score': newP1Score,
        'gameState/p2Score': newP2Score,
        'gameState/roundActive': false,
        'gameState/roundData': { mode: nextRoundInfo.type, items: nextRoundInfo.items, target: nextTargetItem },
        'gameState/roundStartTime': Date.now() + 2000 // 2 seconds between rounds
      });
    }
  };

  const handleWrongClick = () => {
    // Penalty could be implemented here (e.g. timeout)
    // For now, no strict penalty
  };

  const hostName = room.host.displayName;
  const guestName = room.guest?.displayName || 'Guest';

  return (
    <div className="h-full pt-16 flex flex-col p-4 animate-fade-in relative max-w-4xl mx-auto">
      
      {/* HUD */}
      <div className="flex justify-between items-center mb-8 bg-surface-900 border border-white/10 rounded-2xl p-4">
        <div className="flex flex-col items-center">
          <span className="text-p1-400 font-bold">{hostName}</span>
          <span className="text-4xl font-black text-white">{p1Score}</span>
        </div>
        
        <div className="flex flex-col items-center text-center px-4">
          <div className="text-yellow-400 font-black tracking-widest uppercase flex items-center gap-2">
            <Zap size={20} /> ROUND {Math.min(currentRound, ROUNDS)}/{ROUNDS}
          </div>
          {roundActive && (
            <div className="text-xl font-bold text-white mt-1">
              Find: <span className="text-teal-400">Target</span>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center">
          <span className="text-p2-400 font-bold">{guestName}</span>
          <span className="text-4xl font-black text-white">{p2Score}</span>
        </div>
      </div>

      {/* Main Play Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        {winner !== null ? (
          <div className="text-center animate-slide-up z-10 bg-surface-900/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl">
            <h2 className="text-5xl font-black text-white mb-2">
              {winner === 1 ? hostName : winner === 2 ? guestName : "TIE GAME"} {winner !== 0 && "WINS!"}
            </h2>
            <p className="text-gray-400 mb-8">Reflex Battle Complete</p>
            {isHost ? (
              <button 
                onClick={() => concludeGameAndReturnToLobby(roomId, room.host, room.guest, 'reactionBattle', p1Score, p2Score)}
                className="w-full py-4 bg-teal-500 hover:bg-teal-400 text-white rounded-xl font-bold transition-all"
              >
                Return to Lobby
              </button>
            ) : (
              <div className="text-gray-400 text-sm font-bold animate-pulse">Waiting for host to return...</div>
            )}
          </div>
        ) : !roundActive ? (
          <div className="text-center animate-fade-in z-10">
            <div className="text-2xl text-gray-400 font-bold mb-2">Get Ready...</div>
            <div className="text-8xl font-black text-white">{countdown > 0 ? countdown : 'GO!'}</div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-6 max-w-sm mx-auto z-10 animate-pop-in">
            {(roundData?.items || []).map((item, idx) => (
              <div 
                key={`item-${idx}`}
                className={item.className + " hover:scale-110 active:scale-95 cursor-pointer shadow-lg"}
                onClick={() => {
                  if (item.isTarget) {
                    handleCorrectClick();
                  } else {
                    handleWrongClick();
                  }
                }}
              >
                {item.content}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
