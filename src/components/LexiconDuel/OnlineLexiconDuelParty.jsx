import React, { useState, useEffect, useCallback, useRef } from 'react';
import { updatePartyRoom } from '../../services/roomService';
import { concludeGameAndReturnToLobby } from '../../services/relationshipService';
import { Trophy } from 'lucide-react';

const DEFAULT_GRID_SIZE = 5;

export default function OnlineLexiconDuelParty({ room, roomId, isHost, user }) {
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionDirection, setSelectionDirection] = useState(null);
  const [toast, setToast] = useState(null);
  const [lastScoredPlayer, setLastScoredPlayer] = useState(null);

  const containerRef = useRef(null);
  const toastTimerRef = useRef(null);

  // Initialize game state
  useEffect(() => {
    if (isHost && (!room.gameState || room.gameState === 'initializing')) {
      const gridSize = DEFAULT_GRID_SIZE;
      updatePartyRoom(roomId, {
        gameState: {
          gridSize,
          gridData: Array(gridSize * gridSize).fill('_'), // Use '_' instead of '' so Firebase doesn't drop them
          cellOwners: Array(gridSize * gridSize).fill(0),
          currentPlayer: 1,
          turnPhase: 'place',
          scores: { 1: 0, 2: 0 },
          gameOver: false,
          winner: null,
        }
      });
    }
  }, [isHost, room.gameState, roomId]);

  useEffect(() => {
    containerRef.current?.focus();
  }, [room?.status]);

  if (!room.gameState || typeof room.gameState === 'string') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white text-lg font-bold animate-pulse">Initializing Game...</div>
      </div>
    );
  }

  const { gameState, host, guest } = room;
  const gridSize = gameState.gridSize || DEFAULT_GRID_SIZE;
  const myPlayerNum = isHost ? 1 : 2;
  const isMyTurn = gameState.currentPlayer === myPlayerNum;

  const safeGridData = (gameState.gridData || Array(gridSize * gridSize).fill('_')).map(c => c === '_' ? '' : c);
  const safeCellOwners = gameState.cellOwners || Array(gridSize * gridSize).fill(0);
  const playerNames = { 1: host.displayName, 2: guest?.displayName || 'Opponent' };

  const showToast = (message, type = 'error', duration = 2500) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => setToast(null), duration);
  };

  const playerColors = {
    1: { bg: 'bg-p1-500', text: 'text-p1-400', border: 'border-p1-500', ring: 'ring-p1-500/50', glow: 'animate-glow-p1' },
    2: { bg: 'bg-p2-500', text: 'text-p2-400', border: 'border-p2-500', ring: 'ring-p2-500/50', glow: 'animate-glow-p2' },
  };

  // PLACE PHASE
  const handleInputChange = async (index, value) => {
    if (gameState.gameOver || !isMyTurn || gameState.turnPhase !== 'place') return;
    const currentCell = safeGridData[index] || '';
    const currentOwner = safeCellOwners[index] || 0;
    if (currentCell !== '' && currentOwner !== 0) return;

    const letter = value.toUpperCase().replace(/[^A-Z]/g, '').charAt(0);
    if (!letter) return;

    const newGrid = [...(gameState.gridData || [])];
    newGrid[index] = letter;
    const newOwners = [...safeCellOwners];
    newOwners[index] = myPlayerNum;

    await updatePartyRoom(roomId, {
      gameState: {
        ...gameState,
        gridData: newGrid,
        cellOwners: newOwners,
        turnPhase: 'claim'
      }
    });
  };

  // CLAIM PHASE SELECTION
  const handleMouseDown = (index) => {
    if (gameState.gameOver || !isMyTurn || gameState.turnPhase !== 'claim') return;
    setSelectedIndices([index]);
    setIsSelecting(true);
    setSelectionDirection(null);
  };

  const handleMouseEnter = (index) => {
    if (!isSelecting || !isMyTurn || gameState.turnPhase !== 'claim') return;
    const startIndex = selectedIndices[0];
    const rowStart = Math.floor(startIndex / gridSize);
    const colStart = startIndex % gridSize;
    const rowCurrent = Math.floor(index / gridSize);
    const colCurrent = index % gridSize;

    let direction = selectionDirection;
    if (!direction) {
      if (rowStart === rowCurrent && colStart !== colCurrent) { direction = 'horizontal'; setSelectionDirection('horizontal'); }
      else if (colStart === colCurrent && rowStart !== rowCurrent) { direction = 'vertical'; setSelectionDirection('vertical'); }
      else return;
    }

    if (direction === 'horizontal' && rowStart === rowCurrent) {
      const minCol = Math.min(colStart, colCurrent);
      const maxCol = Math.max(colStart, colCurrent);
      setSelectedIndices(Array.from({ length: maxCol - minCol + 1 }, (_, i) => rowStart * gridSize + minCol + i));
    } else if (direction === 'vertical' && colStart === colCurrent) {
      const minRow = Math.min(rowStart, rowCurrent);
      const maxRow = Math.max(rowStart, rowCurrent);
      setSelectedIndices(Array.from({ length: maxRow - minRow + 1 }, (_, i) => (minRow + i) * gridSize + colStart));
    }
  };

  const handleMouseUp = () => { setIsSelecting(false); setSelectionDirection(null); };

  const checkGameOver = (grid) => grid.filter(c => c !== '' && c !== '_').length === grid.length;

  const handleSubmitWord = async () => {
    if (gameState.gameOver || !isMyTurn || gameState.turnPhase !== 'claim') return;
    if (selectedIndices.length < 2) { showToast('Word must be at least 2 letters!'); return; }

    const selectedChars = selectedIndices.map((i) => safeGridData[i]);
    if (selectedChars.some((c) => !c || c === '')) { showToast('Some selected cells are empty!'); return; }

    const word = selectedChars.join('');
    const points = word.length;
    const newScores = { ...gameState.scores, [myPlayerNum]: gameState.scores[myPlayerNum] + points };
    const gridForCheck = (gameState.gridData || []);
    const isOver = checkGameOver(gridForCheck);
    let winner = null;
    if (isOver) {
      if (newScores[1] > newScores[2]) winner = 1;
      else if (newScores[2] > newScores[1]) winner = 2;
      else winner = 'tie';
    }

    setSelectedIndices([]);
    setLastScoredPlayer(myPlayerNum);
    setTimeout(() => setLastScoredPlayer(null), 600);

    await updatePartyRoom(roomId, {
      gameState: {
        ...gameState,
        scores: newScores,
        currentPlayer: myPlayerNum === 1 ? 2 : 1,
        turnPhase: 'place',
        gameOver: isOver,
        winner: winner
      }
    });
    showToast(`"${word}" — ${points} points!`, 'success');
  };

  const handleSkipClaim = async () => {
    if (gameState.gameOver || !isMyTurn || gameState.turnPhase !== 'claim') return;
    const gridForCheck = (gameState.gridData || []);
    const isOver = checkGameOver(gridForCheck);
    let winner = null;
    if (isOver) {
      if (gameState.scores[1] > gameState.scores[2]) winner = 1;
      else if (gameState.scores[2] > gameState.scores[1]) winner = 2;
      else winner = 'tie';
    }
    setSelectedIndices([]);
    await updatePartyRoom(roomId, {
      gameState: { ...gameState, currentPlayer: myPlayerNum === 1 ? 2 : 1, turnPhase: 'place', gameOver: isOver, winner }
    });
  };

  const handleReturnToLobby = () => {
    concludeGameAndReturnToLobby(roomId, room.host, room.guest, 'lexiconDuel', gameState.scores[1], gameState.scores[2]);
  };

  const getCellStyle = (index) => {
    const isSelected = selectedIndices.includes(index);
    const owner = safeCellOwners[index] || 0;
    const isEmpty = safeGridData[index] === '' || !safeGridData[index];
    const isClaimPhase = gameState.turnPhase === 'claim';

    let bg = 'bg-surface-900'; let border = 'border-white/10'; let text = 'text-white'; let cursor = 'cursor-default'; let ring = '';
    if (owner === 1) { bg = 'bg-p1-500/15'; border = 'border-p1-500/30'; text = 'text-p1-300'; }
    else if (owner === 2) { bg = 'bg-p2-500/15'; border = 'border-p2-500/30'; text = 'text-p2-300'; }
    if (isSelected) {
      bg = myPlayerNum === 1 ? 'bg-p1-500/30' : 'bg-p2-500/30';
      border = myPlayerNum === 1 ? 'border-p1-400' : 'border-p2-400';
      ring = myPlayerNum === 1 ? 'ring-2 ring-p1-500/40' : 'ring-2 ring-p2-500/40';
    }
    if (isMyTurn && gameState.turnPhase === 'place' && isEmpty && !gameState.gameOver) cursor = 'cursor-pointer hover:border-yellow-400/50 hover:bg-yellow-400/5';
    else if (isMyTurn && isClaimPhase && !isEmpty && !gameState.gameOver) cursor = 'cursor-crosshair';
    return `${bg} ${border} ${text} ${cursor} ${ring}`;
  };

  const cellSize = gridSize <= 5 ? 56 : gridSize <= 7 ? 48 : 40;
  const gap = gridSize <= 5 ? 6 : 4;

  // Game Over
  if (gameState.gameOver) {
    const isTie = gameState.winner === 'tie';
    const winnerName = isTie ? null : playerNames[gameState.winner];
    const iWon = gameState.winner === myPlayerNum;
    return (
      <div className="flex flex-col items-center justify-center h-full px-4">
        <div className="bg-surface-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
          <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-3xl font-black text-white mb-2">{isTie ? '🤝 TIE GAME!' : `🏆 ${winnerName} Wins!`}</h2>
          <div className="flex justify-center gap-6 mb-6">
            <div className="text-center">
              <div className="text-p1-400 font-bold text-sm">{playerNames[1]}</div>
              <div className="text-3xl font-black text-white">{gameState.scores[1]}</div>
            </div>
            <div className="text-gray-600 text-2xl font-black self-end">vs</div>
            <div className="text-center">
              <div className="text-p2-400 font-bold text-sm">{playerNames[2]}</div>
              <div className="text-3xl font-black text-white">{gameState.scores[2]}</div>
            </div>
          </div>
          {isHost ? (
            <button onClick={handleReturnToLobby} className="px-6 py-3 bg-surface-800 hover:bg-surface-700 text-white rounded-xl font-bold transition-colors">
              Return to Party Lobby
            </button>
          ) : (
            <p className="text-gray-500 text-sm font-bold">Waiting for host...</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center h-full px-4 py-6 no-select overflow-auto"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && selectedIndices.length > 0) handleSubmitWord();
        if (e.key === 'Escape') setSelectedIndices([]);
      }}
      onMouseUp={handleMouseUp}
    >
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-2xl mb-6">
        <div className={`bg-surface-900/80 border border-white/10 rounded-2xl px-5 py-3 flex items-center gap-3 transition-all duration-300 ${gameState.currentPlayer === 1 && !gameState.gameOver ? playerColors[1].glow : 'opacity-70'}`}>
          <span className={`w-3 h-3 rounded-full ${playerColors[1].bg}`} />
          <div>
            <div className={`text-sm font-bold ${gameState.currentPlayer === 1 ? playerColors[1].text : 'text-gray-400'}`}>{playerNames[1]}</div>
            <div className={`text-2xl font-black ${lastScoredPlayer === 1 ? 'score-bump' : ''}`}>{gameState.scores[1]}</div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            ⚔️ Lexicon Duel
          </div>
        </div>

        <div className={`bg-surface-900/80 border border-white/10 rounded-2xl px-5 py-3 flex items-center gap-3 transition-all duration-300 ${gameState.currentPlayer === 2 && !gameState.gameOver ? playerColors[2].glow : 'opacity-70'}`}>
          <div className="text-right">
            <div className={`text-sm font-bold ${gameState.currentPlayer === 2 ? playerColors[2].text : 'text-gray-400'}`}>{playerNames[2]}</div>
            <div className={`text-2xl font-black ${lastScoredPlayer === 2 ? 'score-bump' : ''}`}>{gameState.scores[2]}</div>
          </div>
          <span className={`w-3 h-3 rounded-full ${playerColors[2].bg}`} />
        </div>
      </div>

      {/* Turn Indicator */}
      {!gameState.gameOver && (
        <div className="mb-5">
          <div className={`bg-surface-900/60 border border-white/10 rounded-full px-6 py-3 flex items-center gap-3 ${isMyTurn ? 'border-yellow-400/30' : ''}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${playerColors[gameState.currentPlayer].bg} animate-pulse`} />
            <span className="text-sm font-semibold text-gray-200">
              {isMyTurn ? (
                <>
                  <span className="text-yellow-400 font-bold">Your Turn</span>
                  <span className="text-gray-400 font-normal">
                    {gameState.turnPhase === 'place' ? ' — place a letter' : ' — drag to select a word'}
                  </span>
                </>
              ) : (
                <>{playerNames[gameState.currentPlayer]} is thinking...</>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`mb-4 px-5 py-3 rounded-xl text-sm font-medium shadow-lg ${toast.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
          {toast.message}
        </div>
      )}

      {/* Grid */}
      <div className="bg-surface-900/60 border border-white/10 rounded-2xl p-3" style={{ width: 'fit-content' }}>
        <div className="grid" style={{ gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`, gap: `${gap}px` }}>
          {safeGridData.map((cell, index) => {
            const currentOwner = safeCellOwners[index] || 0;
            const currentCell = cell || '';
            return (
              <input
                key={index}
                type="text"
                maxLength="1"
                value={currentCell}
                readOnly={!isMyTurn || gameState.gameOver || gameState.turnPhase === 'claim' || (currentCell !== '' && currentOwner !== 0)}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onMouseDown={() => handleMouseDown(index)}
                onMouseEnter={() => handleMouseEnter(index)}
                className={`${getCellStyle(index)} border rounded-lg text-center uppercase font-bold transition-all duration-150 outline-none`}
                style={{ width: `${cellSize}px`, height: `${cellSize}px`, fontSize: `${cellSize * 0.4}px`, caretColor: 'transparent' }}
              />
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      {!gameState.gameOver && isMyTurn && gameState.turnPhase === 'claim' && (
        <div className="flex gap-3 mt-5">
          <button
            onClick={handleSubmitWord}
            disabled={selectedIndices.length < 2}
            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${selectedIndices.length >= 2 ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:scale-105' : 'bg-white/5 text-gray-600 cursor-not-allowed'}`}
          >
            ✓ Submit Word
          </button>
          <button onClick={handleSkipClaim} className="px-5 py-3 rounded-xl font-bold text-sm bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200">
            Skip →
          </button>
        </div>
      )}
    </div>
  );
}
