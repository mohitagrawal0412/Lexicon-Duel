import React, { useState, useEffect } from 'react';
import { updatePartyRoom } from '../../services/roomService';
import { concludeGameAndReturnToLobby } from '../../services/relationshipService';
import { generateTargetRound, evaluateMerge, MAX_SCORE, ROUND_TIME } from '../../config/targetBattle';
import { Trophy, RotateCcw } from 'lucide-react';

export default function OnlineTargetBattle({ room, roomId, isHost }) {
  useEffect(() => {
    if (isHost && (!room.gameState || room.gameState === 'initializing')) {
      const data = generateTargetRound();
      updatePartyRoom(roomId, {
        gameState: {
          scores: { p1: 0, p2: 0 },
          phase: 'PLAYING', // PLAYING, ROUND_OVER, GAME_OVER
          roundData: data,
          p1State: { tiles: data.initialTiles, selectedTile: null, selectedOp: null },
          p2State: { tiles: data.initialTiles, selectedTile: null, selectedOp: null },
          roundWinner: null,
          winReason: '',
          timeLeft: ROUND_TIME,
          lastUpdateTime: Date.now()
        }
      });
    }
  }, [isHost, room.gameState, roomId]);

  if (!room.gameState || typeof room.gameState === 'string') {
    return <div className="text-white text-center pt-20">Initializing Game...</div>;
  }
  return <InnerOnlineTargetBattle room={room} roomId={roomId} isHost={isHost} />;
}

function InnerOnlineTargetBattle({ room, roomId, isHost }) {

  const { scores, phase, roundData, p1State, p2State, roundWinner, winReason, timeLeft, lastUpdateTime } = room.gameState;
  const myPlayerKey = isHost ? 'p1' : 'p2';
  const myState = isHost ? p1State : p2State;

  // Host-driven timer
  useEffect(() => {
    if (!isHost || phase !== 'PLAYING') return;
    
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastUpdateTime) / 1000);
      const newTime = Math.max(0, ROUND_TIME - elapsed);
      
      if (newTime !== timeLeft) {
        updatePartyRoom(roomId, { 'gameState/timeLeft': newTime });
      }

      if (newTime <= 0) {
        clearInterval(interval);
        handleTimeUp();
      }
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, phase, lastUpdateTime, timeLeft]); 
  // Dependency on p1State/p2State removed to prevent continuous resets, handled in handleTimeUp via snapshot or we just use current props

  const handleTimeUp = async () => {
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

    await endRound(winner, reason);
  };

  const endRound = async (winner, reason) => {
    if (!isHost) return;

    let newScores = { ...scores };
    if (winner === 'p1' || winner === 'p2') {
      newScores[winner] += 1;
    }

    await updatePartyRoom(roomId, {
      'gameState/phase': 'ROUND_OVER',
      'gameState/roundWinner': winner,
      'gameState/winReason': reason,
      'gameState/scores': newScores
    });
  };

  const handleTileTap = async (tile) => {
    if (phase !== 'PLAYING') return;

    // If we have a tile AND an operator selected, attempt a merge
    if (myState.selectedTile && myState.selectedOp && myState.selectedTile.id !== tile.id) {
      const result = evaluateMerge(myState.selectedTile.val, myState.selectedOp, tile.val);
      if (result === null) {
        // Invalid merge (e.g. fraction) - just reset selection to new tile
        await updatePartyRoom(roomId, {
          [`gameState/${myPlayerKey}State/selectedTile`]: tile,
          [`gameState/${myPlayerKey}State/selectedOp`]: null
        });
        return;
      }
      
      // Valid merge! Remove both tiles, add new one
      const newTile = { id: `tile-${Date.now()}`, val: result };
      const newTiles = myState.tiles.filter(t => t.id !== myState.selectedTile.id && t.id !== tile.id);
      newTiles.push(newTile);

      let updates = {
        [`gameState/${myPlayerKey}State/tiles`]: newTiles,
        [`gameState/${myPlayerKey}State/selectedTile`]: newTile,
        [`gameState/${myPlayerKey}State/selectedOp`]: null
      };

      await updatePartyRoom(roomId, updates);

      // Check if exact target reached! (Anyone can trigger win if they hit exact)
      if (result === roundData?.target) {
        if (isHost) {
          await endRound(myPlayerKey, 'EXACT MATCH!');
        } else {
           // Tell host to end it (in a real app we'd have a server, here we just let the guest force the end state)
           let newScores = { ...scores };
           newScores[myPlayerKey] += 1;
           await updatePartyRoom(roomId, {
             'gameState/phase': 'ROUND_OVER',
             'gameState/roundWinner': myPlayerKey,
             'gameState/winReason': 'EXACT MATCH!',
             'gameState/scores': newScores
           });
           // Host's effect will catch the ROUND_OVER and schedule next round
        }
      }
      return;
    }
    
    // Otherwise, just select the tile
    const newSelected = myState.selectedTile?.id === tile.id ? null : tile;
    await updatePartyRoom(roomId, {
      [`gameState/${myPlayerKey}State/selectedTile`]: newSelected,
      [`gameState/${myPlayerKey}State/selectedOp`]: null
    });
  };

  const handleOpTap = async (op) => {
    if (phase !== 'PLAYING') return;
    
    if (myState.selectedTile) {
      const newOp = myState.selectedOp === op ? null : op;
      await updatePartyRoom(roomId, {
        [`gameState/${myPlayerKey}State/selectedOp`]: newOp
      });
    }
  };

  const handleReset = async () => {
    if (phase !== 'PLAYING') return;
    await updatePartyRoom(roomId, {
      [`gameState/${myPlayerKey}State`]: {
        tiles: roundData.initialTiles,
        selectedTile: null,
        selectedOp: null
      }
    });
  };

  const hostName = room.host.displayName;
  const guestName = room.guest?.displayName || 'Guest';

  // For next round progression
  useEffect(() => {
    if (isHost && phase === 'ROUND_OVER') {
        const isGameOver = scores.p1 >= MAX_SCORE || scores.p2 >= MAX_SCORE;
        const timeout = setTimeout(() => {
          if (isGameOver) {
            updatePartyRoom(roomId, { 'gameState/phase': 'GAME_OVER' });
          } else {
            const data = generateTargetRound();
            updatePartyRoom(roomId, {
              'gameState/phase': 'PLAYING',
              'gameState/roundWinner': null,
              'gameState/winReason': '',
              'gameState/roundData': data,
              'gameState/p1State': { tiles: data.initialTiles, selectedTile: null, selectedOp: null },
              'gameState/p2State': { tiles: data.initialTiles, selectedTile: null, selectedOp: null },
              'gameState/timeLeft': ROUND_TIME,
              'gameState/lastUpdateTime': Date.now()
            });
          }
        }, isGameOver ? 2000 : 4000);
        return () => clearTimeout(timeout);
    }
  }, [isHost, phase, scores, roomId]);


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
              onClick={() => concludeGameAndReturnToLobby(roomId, room.host, room.guest, 'targetBattle', scores.p1, scores.p2)}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold transition-all hover:scale-[1.02]"
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
  const isLoser = roundWinner && roundWinner !== myPlayerKey && roundWinner !== 'tie';

  return (
    <div className="h-full pt-16 flex flex-col p-4 animate-fade-in relative max-w-4xl mx-auto z-40">
      
      {/* HUD */}
      <div className="flex justify-between items-center mb-8 bg-surface-900 border border-white/10 rounded-2xl p-4">
        <div className="flex flex-col items-center">
          <span className="text-p1-400 font-bold">{hostName}</span>
          <span className="text-4xl font-black text-white">{scores.p1}</span>
        </div>
        
        <div className="flex flex-col items-center text-center px-4">
          <div className={`text-3xl font-black ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
            {timeLeft}s
          </div>
          <div className="text-gray-400 text-sm font-bold">
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
        
        {phase === 'ROUND_OVER' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/60 backdrop-blur-[2px]">
            <div className={`text-5xl md:text-7xl font-black mb-2 ${isWinner ? 'text-green-400 animate-bounce-in' : isLoser ? 'text-red-400' : 'text-yellow-400'}`}>
              {isWinner ? 'WINNER!' : isLoser ? 'DEFEAT' : 'TIE'}
            </div>
            <div className="text-2xl font-bold text-white">{winReason}</div>
          </div>
        )}

        <div className="flex flex-col items-center w-full max-w-lg mt-8">
          
          {/* Target Display */}
          <div className="text-sm font-bold text-gray-400 tracking-widest mb-1">TARGET</div>
          <div className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 mb-12 drop-shadow-md">
            {roundData?.target}
          </div>

          {/* Number Tiles */}
          <div className="flex flex-wrap justify-center gap-3 md:gap-4 mb-8 min-h-[80px]">
            {(myState.tiles || []).map(tile => {
              const isSelected = myState.selectedTile?.id === tile.id;
              const colorClass = isHost ? 'bg-p1-500 ring-p1-400/50' : 'bg-p2-500 ring-p2-400/50';
              return (
                <button
                  key={tile.id}
                  onClick={() => handleTileTap(tile)}
                  className={`min-w-[5rem] h-16 md:min-w-[6rem] md:h-20 px-4 flex items-center justify-center rounded-xl font-black text-3xl md:text-4xl shadow-xl transition-transform active:scale-90
                    ${isSelected ? `${colorClass} text-white ring-4 scale-105` : 'bg-surface-700 text-white border-b-4 border-surface-900 hover:bg-surface-600'}
                  `}
                >
                  {tile.val}
                </button>
              );
            })}
          </div>

          {/* Controls Area: Operators + Reset */}
          <div className="flex w-full max-w-md gap-4 justify-between items-center bg-surface-800 p-3 md:p-4 rounded-3xl border border-white/5 shadow-inner">
            <button onClick={handleReset} className="p-4 text-gray-400 hover:text-white transition-colors active:scale-90 bg-surface-700 rounded-xl hover:bg-surface-600">
              <RotateCcw size={28} />
            </button>
            <div className="flex gap-3">
              {['+', '−', '×', '÷'].map(op => {
                const isSelected = myState.selectedOp === op;
                return (
                  <button
                    key={op}
                    onClick={() => handleOpTap(op)}
                    className={`w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center font-black text-3xl transition-transform active:scale-90
                      ${isSelected ? 'bg-yellow-500 text-white ring-4 ring-yellow-400/50 scale-110 shadow-lg' : 'bg-surface-700 text-gray-300 hover:bg-surface-600 shadow-md'}
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
    </div>
  );
}
