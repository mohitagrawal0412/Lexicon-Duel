import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToRoom, updateGameState, leaveRoom } from '../services/roomService';
import { Loader2, Copy, Check } from 'lucide-react';

const OnlineGrid = () => {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [error, setError] = useState('');
  
  // Local interaction state
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionDirection, setSelectionDirection] = useState(null);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
  const [lastScoredPlayer, setLastScoredPlayer] = useState(null);

  const containerRef = useRef(null);
  const toastTimerRef = useRef(null);

  useEffect(() => {
    // Subscribe to Firebase RTDB
    const unsubscribe = subscribeToRoom(roomId, (roomData) => {
      if (!roomData) {
        setError('This room no longer exists.');
        setRoom(null);
        return;
      }
      setRoom(roomData);
    });

    return () => unsubscribe();
  }, [roomId]);

  useEffect(() => {
    containerRef.current?.focus();
  }, [room?.status]);

  const showToast = useCallback((message, type = 'error', duration = 2500) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => setToast(null), duration);
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeave = async () => {
    if (window.confirm('Are you sure you want to leave the room?')) {
      await leaveRoom(roomId);
      navigate('/');
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] px-4">
        <div className="card-glass p-8 max-w-md w-full text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={() => navigate('/')} className="px-4 py-2 bg-white/10 rounded-lg text-sm font-bold">
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-56px)]">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (room.status === 'waiting') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] px-4 animate-fade-in">
        <div className="card-glass p-8 max-w-md w-full text-center">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-6" />
          <h2 className="text-xl font-bold text-white mb-2">Waiting for opponent...</h2>
          <p className="text-gray-400 text-sm mb-6">Ask your friend to enter this code:</p>
          
          <div className="bg-surface-900 border border-white/10 rounded-xl p-4 mb-6 flex items-center justify-between">
            <span className="text-3xl font-mono font-bold tracking-widest text-yellow-400">
              {roomId}
            </span>
            <button onClick={copyToClipboard} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-gray-400" />}
            </button>
          </div>
          
          <button onClick={handleLeave} className="text-xs text-red-400 hover:text-red-300">
            Cancel and leave
          </button>
        </div>
      </div>
    );
  }

  // --- GAME LOGIC ---
  const { gameState, host, guest, gridSize } = room;
  const isHost = user.uid === host.uid;
  const isGuest = guest && user.uid === guest.uid;
  const myPlayerNum = isHost ? 1 : 2;
  const isMyTurn = gameState.currentPlayer === myPlayerNum;

  const safeGridData = gameState.gridData || Array(gridSize * gridSize).fill('');
  const safeCellOwners = gameState.cellOwners || Array(gridSize * gridSize).fill(0);

  const playerNames = { 1: host.displayName, 2: guest?.displayName || 'Opponent' };
  const playerColors = {
    1: { bg: 'bg-p1-500', text: 'text-p1-400', border: 'border-p1-500', ring: 'ring-p1-500/50', glow: 'animate-glow-p1' },
    2: { bg: 'bg-p2-500', text: 'text-p2-400', border: 'border-p2-500', ring: 'ring-p2-500/50', glow: 'animate-glow-p2' },
  };

  // 1. PLACE PHASE
  const handleInputChange = async (index, value) => {
    if (gameState.gameOver || !isMyTurn || gameState.turnPhase !== 'place') return;
    
    const currentCell = safeGridData[index] || '';
    const currentOwner = safeCellOwners[index] || 0;
    
    if (currentCell !== '' && currentOwner !== 0) return;

    const letter = value.toUpperCase().replace(/[^A-Z]/g, '').charAt(0);
    if (!letter) return;

    const newGrid = [...safeGridData];
    newGrid[index] = letter;
    const newOwners = [...safeCellOwners];
    newOwners[index] = myPlayerNum;

    await updateGameState(roomId, {
      ...gameState,
      gridData: newGrid,
      cellOwners: newOwners,
      turnPhase: 'claim'
    });
  };

  // 2. CLAIM PHASE SELECTION
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
      if (rowStart === rowCurrent && colStart !== colCurrent) {
        direction = 'horizontal';
        setSelectionDirection('horizontal');
      } else if (colStart === colCurrent && rowStart !== rowCurrent) {
        direction = 'vertical';
        setSelectionDirection('vertical');
      } else return;
    }

    if (direction === 'horizontal' && rowStart === rowCurrent) {
      const minCol = Math.min(colStart, colCurrent);
      const maxCol = Math.max(colStart, colCurrent);
      const newSelected = Array.from({ length: maxCol - minCol + 1 }, (_, i) => rowStart * gridSize + minCol + i);
      setSelectedIndices(newSelected);
    } else if (direction === 'vertical' && colStart === colCurrent) {
      const minRow = Math.min(rowStart, rowCurrent);
      const maxRow = Math.max(rowStart, rowCurrent);
      const newSelected = Array.from({ length: maxRow - minRow + 1 }, (_, i) => (minRow + i) * gridSize + colStart);
      setSelectedIndices(newSelected);
    }
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
    setSelectionDirection(null);
  };

  const checkGameOver = (grid) => {
    const isFull = grid.filter(c => c !== '').length === grid.length;
    return isFull;
  };

  const handleSubmitWord = async () => {
    if (gameState.gameOver || !isMyTurn || gameState.turnPhase !== 'claim') return;
    if (selectedIndices.length < 2) {
      showToast('Word must be at least 2 letters!');
      return;
    }

    const selectedChars = selectedIndices.map((i) => safeGridData[i]);
    if (selectedChars.some((c) => !c || c === '')) {
      showToast('Some selected cells are empty!');
      return;
    }

    const word = selectedChars.join('');
    const points = word.length;

    const newScores = { ...gameState.scores, [myPlayerNum]: gameState.scores[myPlayerNum] + points };
    
    const isOver = checkGameOver(safeGridData);
    let winner = null;
    if (isOver) {
      if (newScores[1] > newScores[2]) winner = 1;
      else if (newScores[2] > newScores[1]) winner = 2;
      else winner = 'tie';
    }

    setSelectedIndices([]);
    setLastScoredPlayer(myPlayerNum);
    setTimeout(() => setLastScoredPlayer(null), 600);

    await updateGameState(roomId, {
      ...gameState,
      scores: newScores,
      currentPlayer: myPlayerNum === 1 ? 2 : 1,
      turnPhase: 'place',
      gameOver: isOver,
      winner: winner
    });
    
    showToast(`"${word}" — ${points} points!`, 'success');
  };

  const handleSkipClaim = async () => {
    if (gameState.gameOver || !isMyTurn || gameState.turnPhase !== 'claim') return;
    
    const isOver = checkGameOver(safeGridData);
    let winner = null;
    if (isOver) {
      if (gameState.scores[1] > gameState.scores[2]) winner = 1;
      else if (gameState.scores[2] > gameState.scores[1]) winner = 2;
      else winner = 'tie';
    }

    setSelectedIndices([]);
    await updateGameState(roomId, {
      ...gameState,
      currentPlayer: myPlayerNum === 1 ? 2 : 1,
      turnPhase: 'place',
      gameOver: isOver,
      winner: winner
    });
  };

  const handleEndGameEarly = async () => {
    if (gameState.gameOver) return;
    if (window.confirm('Are you sure you want to end the game early? The player with the most points will win.')) {
      let winner = null;
      if (gameState.scores[1] > gameState.scores[2]) winner = 1;
      else if (gameState.scores[2] > gameState.scores[1]) winner = 2;
      else winner = 'tie';

      setSelectedIndices([]);
      await updateGameState(roomId, {
        ...gameState,
        gameOver: true,
        winner: winner
      });
    }
  };

  const getCellStyle = (index) => {
    const isSelected = selectedIndices.includes(index);
    const owner = (gameState.cellOwners || [])[index] || 0;
    const isEmpty = (gameState.gridData || [])[index] === '' || !(gameState.gridData || [])[index];
    const isClaimPhase = gameState.turnPhase === 'claim';

    let bg = 'bg-surface-900';
    let border = 'border-white/10';
    let text = 'text-white';
    let cursor = 'cursor-default';
    let ring = '';

    if (owner === 1) { bg = 'bg-p1-500/15'; border = 'border-p1-500/30'; text = 'text-p1-300'; } 
    else if (owner === 2) { bg = 'bg-p2-500/15'; border = 'border-p2-500/30'; text = 'text-p2-300'; }

    if (isSelected) {
      bg = myPlayerNum === 1 ? 'bg-p1-500/30' : 'bg-p2-500/30';
      border = myPlayerNum === 1 ? 'border-p1-400' : 'border-p2-400';
      ring = myPlayerNum === 1 ? 'ring-2 ring-p1-500/40' : 'ring-2 ring-p2-500/40';
    }

    if (isMyTurn && gameState.turnPhase === 'place' && isEmpty && !gameState.gameOver) {
      cursor = 'cursor-pointer hover:border-yellow-400/50 hover:bg-yellow-400/5';
    } else if (isMyTurn && isClaimPhase && !isEmpty && !gameState.gameOver) {
      cursor = 'cursor-crosshair';
    }

    return `grid-cell ${bg} ${border} ${text} ${cursor} ${ring}`;
  };

  const cellSize = gridSize <= 5 ? 56 : gridSize <= 7 ? 48 : 40;
  const gap = gridSize <= 5 ? 6 : 4;

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center min-h-[calc(100vh-56px)] px-4 py-6 animate-fade-in no-select"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && selectedIndices.length > 0) handleSubmitWord();
        if (e.key === 'Escape') setSelectedIndices([]);
      }}
      onMouseUp={handleMouseUp}
    >
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-2xl mb-6">
        <div className={`card-glass px-5 py-3 flex items-center gap-3 transition-all duration-300 ${gameState.currentPlayer === 1 && !gameState.gameOver ? playerColors[1].glow : 'opacity-70'}`}>
          <span className={`w-3 h-3 rounded-full ${playerColors[1].bg}`} />
          <div>
            <div className={`text-sm font-bold ${gameState.currentPlayer === 1 ? playerColors[1].text : 'text-gray-400'}`}>{playerNames[1]}</div>
            <div className={`text-2xl font-black ${lastScoredPlayer === 1 ? 'score-bump' : ''}`}>{gameState.scores[1]}</div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            🌐 Room: {roomId}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            {!gameState.gameOver && (
              <button onClick={handleEndGameEarly} className="text-xs font-bold text-yellow-500 hover:text-yellow-400 transition-colors bg-white/5 px-2 py-1 rounded">
                End Game
              </button>
            )}
            <button onClick={handleLeave} className="text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1">
              Leave
            </button>
          </div>
        </div>

        <div className={`card-glass px-5 py-3 flex items-center gap-3 transition-all duration-300 ${gameState.currentPlayer === 2 && !gameState.gameOver ? playerColors[2].glow : 'opacity-70'}`}>
          <div className="text-right">
            <div className={`text-sm font-bold ${gameState.currentPlayer === 2 ? playerColors[2].text : 'text-gray-400'}`}>{playerNames[2]}</div>
            <div className={`text-2xl font-black ${lastScoredPlayer === 2 ? 'score-bump' : ''}`}>{gameState.scores[2]}</div>
          </div>
          <span className={`w-3 h-3 rounded-full ${playerColors[2].bg}`} />
        </div>
      </div>

      {/* Turn Indicator */}
      {!gameState.gameOver && (
        <div className="mb-5 animate-slide-up">
          <div className={`card-glass px-6 py-3 flex items-center gap-3 phase-pulse ${isMyTurn ? 'border-yellow-400/30' : ''}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${playerColors[gameState.currentPlayer].bg} animate-pulse-soft`} />
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

      {/* Game Over */}
      {gameState.gameOver && (
        <div className="mb-6 text-center animate-slide-up">
          <div className="card-glass px-8 py-6">
            <div className="text-3xl font-black mb-2 winner-glow text-yellow-400">
              {gameState.winner === 'tie' ? "🤝 It's a Tie!" : `🏆 ${playerNames[gameState.winner]} Wins!`}
            </div>
            <button onClick={handleLeave} className="mt-4 px-5 py-2 rounded-lg font-bold text-sm bg-white/10 text-gray-300 hover:bg-white/20">
              Leave Room
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast mb-4 px-5 py-3 rounded-xl text-sm font-medium shadow-lg ${toast.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
          {toast.message}
        </div>
      )}

      {/* Grid */}
      <div className="rounded-2xl p-3 card-glass" style={{ width: 'fit-content' }}>
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
        <div className="flex gap-3 mt-5 animate-slide-up">
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
};

export default OnlineGrid;
