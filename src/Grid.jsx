import React, { useState, useEffect, useCallback, useRef } from 'react';

const Grid = ({ size, player1Name, player2Name, onBack }) => {
  // --- Grid & Cell State ---
  const [gridData, setGridData] = useState(
    Array.from({ length: size * size }, () => '')
  );
  const [cellOwners, setCellOwners] = useState(
    Array.from({ length: size * size }, () => null) // null | 1 | 2
  );

  // --- Selection State ---
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionDirection, setSelectionDirection] = useState(null);

  // --- Turn & Phase State ---
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [turnPhase, setTurnPhase] = useState('place'); // 'place' | 'claim'
  const [playerScores, setPlayerScores] = useState({ 1: 0, 2: 0 });

  // --- UI State ---
  const [toast, setToast] = useState(null); // { message, type: 'error' | 'success' | 'info' }
  const [lastScoredPlayer, setLastScoredPlayer] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null); // null | 1 | 2 | 'tie'

  const containerRef = useRef(null);
  const toastTimerRef = useRef(null);

  // --- Player names ---
  const playerNames = { 1: player1Name, 2: player2Name };
  const playerColors = {
    1: { bg: 'bg-p1-500', text: 'text-p1-400', border: 'border-p1-500', ring: 'ring-p1-500/50', glow: 'animate-glow-p1' },
    2: { bg: 'bg-p2-500', text: 'text-p2-400', border: 'border-p2-500', ring: 'ring-p2-500/50', glow: 'animate-glow-p2' },
  };

  // --- Toast helper ---
  const showToast = useCallback((message, type = 'error', duration = 2500) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => setToast(null), duration);
  }, []);

  // --- Check game over ---
  useEffect(() => {
    const filledCount = gridData.filter((c) => c !== '').length;
    if (filledCount === size * size && !gameOver) {
      setGameOver(true);
      const s1 = playerScores[1];
      const s2 = playerScores[2];
      if (s1 > s2) setWinner(1);
      else if (s2 > s1) setWinner(2);
      else setWinner('tie');
    }
  }, [gridData, size, gameOver, playerScores]);

  // --- Focus container on mount so key events work ---
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  // --- PLACE PHASE: Handle cell click to place a letter ---
  const handleCellClick = (index) => {
    if (gameOver) return;

    if (turnPhase === 'place') {
      // Can only place in empty cells
      if (gridData[index] !== '') {
        showToast('That cell is already taken! Pick an empty one.');
        return;
      }
      // Focus the input so user can type
      // The actual letter insertion happens in handleInputChange
    } else if (turnPhase === 'claim') {
      // During claim phase, clicking starts a selection
      // Handled by mouseDown
    }
  };

  const handleInputChange = (index, value) => {
    if (gameOver) return;

    // Only allow placement during place phase
    if (turnPhase !== 'place') {
      showToast('Select a word to claim, or skip your claim.');
      return;
    }

    // Can't overwrite existing cells
    if (gridData[index] !== '' && cellOwners[index] !== null) {
      showToast('That cell is already taken!');
      return;
    }

    const letter = value.toUpperCase().replace(/[^A-Z]/g, '').charAt(0);
    if (!letter) return;

    // Place the letter
    const updatedGrid = [...gridData];
    updatedGrid[index] = letter;
    setGridData(updatedGrid);

    // Mark ownership
    const updatedOwners = [...cellOwners];
    updatedOwners[index] = currentPlayer;
    setCellOwners(updatedOwners);

    // Advance to claim phase
    setTurnPhase('claim');
    showToast(`Letter "${letter}" placed! Now select a word to claim, or skip.`, 'info');
  };

  // --- CLAIM PHASE: Mouse drag selection ---
  const handleMouseDown = (index) => {
    if (gameOver || turnPhase !== 'claim') return;

    setSelectedIndices([index]);
    setIsSelecting(true);
    setSelectionDirection(null);
  };

  const handleMouseEnter = (index) => {
    if (!isSelecting || turnPhase !== 'claim') return;

    const startIndex = selectedIndices[0];
    const rowStart = Math.floor(startIndex / size);
    const colStart = startIndex % size;
    const rowCurrent = Math.floor(index / size);
    const colCurrent = index % size;

    let direction = selectionDirection;

    // Detect direction on first move
    if (!direction) {
      if (rowStart === rowCurrent && colStart !== colCurrent) {
        direction = 'horizontal';
        setSelectionDirection('horizontal');
      } else if (colStart === colCurrent && rowStart !== rowCurrent) {
        direction = 'vertical';
        setSelectionDirection('vertical');
      } else {
        return; // Diagonal — ignore
      }
    }

    if (direction === 'horizontal' && rowStart === rowCurrent) {
      const minCol = Math.min(colStart, colCurrent);
      const maxCol = Math.max(colStart, colCurrent);
      const newSelected = Array.from(
        { length: maxCol - minCol + 1 },
        (_, i) => rowStart * size + minCol + i
      );
      setSelectedIndices(newSelected);
    } else if (direction === 'vertical' && colStart === colCurrent) {
      const minRow = Math.min(rowStart, rowCurrent);
      const maxRow = Math.max(rowStart, rowCurrent);
      const newSelected = Array.from(
        { length: maxRow - minRow + 1 },
        (_, i) => (minRow + i) * size + colStart
      );
      setSelectedIndices(newSelected);
    }
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
    setSelectionDirection(null);
  };

  // --- Submit word ---
  const handleSubmitWord = () => {
    if (gameOver) return;

    if (turnPhase !== 'claim') {
      showToast('Place a letter first!');
      return;
    }

    if (selectedIndices.length === 0) {
      showToast('Select cells to form a word first!');
      return;
    }

    if (selectedIndices.length < 2) {
      showToast('Word must be at least 2 letters!');
      return;
    }

    // Check all selected cells are filled
    const selectedChars = selectedIndices.map((i) => gridData[i]);
    if (selectedChars.some((c) => c === '')) {
      showToast('Some selected cells are empty!');
      return;
    }

    const word = selectedChars.join('');
    const points = word.length;

    // Award score
    setPlayerScores((prev) => ({
      ...prev,
      [currentPlayer]: prev[currentPlayer] + points,
    }));

    setLastScoredPlayer(currentPlayer);
    setTimeout(() => setLastScoredPlayer(null), 600);

    showToast(`"${word}" — ${points} points for ${playerNames[currentPlayer]}! 🎉`, 'success');

    // End turn
    endTurn();
  };

  // --- Skip claim ---
  const handleSkipClaim = () => {
    if (gameOver) return;
    if (turnPhase !== 'claim') return;

    showToast(`${playerNames[currentPlayer]} skipped claiming.`, 'info');
    endTurn();
  };

  // --- End turn ---
  const endTurn = () => {
    setSelectedIndices([]);
    setSelectionDirection(null);
    setIsSelecting(false);
    setCurrentPlayer((prev) => (prev === 1 ? 2 : 1));
    setTurnPhase('place');
  };

  // --- Key handler ---
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && turnPhase === 'claim' && selectedIndices.length > 0) {
      e.preventDefault();
      handleSubmitWord();
    }
    if (e.key === 'Escape') {
      setSelectedIndices([]);
      setSelectionDirection(null);
      setIsSelecting(false);
    }
  };

  // --- New game ---
  const handleNewGame = () => {
    setGridData(Array.from({ length: size * size }, () => ''));
    setCellOwners(Array.from({ length: size * size }, () => null));
    setSelectedIndices([]);
    setIsSelecting(false);
    setSelectionDirection(null);
    setCurrentPlayer(1);
    setTurnPhase('place');
    setPlayerScores({ 1: 0, 2: 0 });
    setToast(null);
    setLastScoredPlayer(null);
    setGameOver(false);
    setWinner(null);
  };

  // --- Cell style ---
  const getCellStyle = (index) => {
    const isSelected = selectedIndices.includes(index);
    const owner = cellOwners[index];
    const isEmpty = gridData[index] === '';
    const isClaimPhase = turnPhase === 'claim';

    let bg = 'bg-surface-900';
    let border = 'border-white/10';
    let text = 'text-white';
    let cursor = 'cursor-default';
    let ring = '';
    let extra = '';

    if (owner === 1) {
      bg = 'bg-p1-500/15';
      border = 'border-p1-500/30';
      text = 'text-p1-300';
    } else if (owner === 2) {
      bg = 'bg-p2-500/15';
      border = 'border-p2-500/30';
      text = 'text-p2-300';
    }

    if (isSelected) {
      bg = currentPlayer === 1 ? 'bg-p1-500/30' : 'bg-p2-500/30';
      border = currentPlayer === 1 ? 'border-p1-400' : 'border-p2-400';
      ring = currentPlayer === 1 ? 'ring-2 ring-p1-500/40' : 'ring-2 ring-p2-500/40';
    }

    if (turnPhase === 'place' && isEmpty && !gameOver) {
      cursor = 'cursor-pointer';
      extra = 'hover:border-yellow-400/50 hover:bg-yellow-400/5';
    } else if (isClaimPhase && !isEmpty && !gameOver) {
      cursor = 'cursor-crosshair';
    }

    return `grid-cell ${bg} ${border} ${text} ${cursor} ${ring} ${extra}`;
  };

  // --- Compute cell size based on grid size ---
  const cellSize = size <= 5 ? 56 : size <= 7 ? 48 : 40;
  const gap = size <= 5 ? 6 : 4;

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center min-h-screen px-4 py-6 animate-fade-in no-select"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseUp={handleMouseUp}
    >
      {/* Header: Scores + Back */}
      <div className="flex items-center justify-between w-full max-w-2xl mb-6">
        {/* Player 1 Score */}
        <div
          className={`card-glass px-5 py-3 flex items-center gap-3 transition-all duration-300 ${
            currentPlayer === 1 && !gameOver ? playerColors[1].glow : ''
          }`}
        >
          <span className={`w-3 h-3 rounded-full ${playerColors[1].bg}`} />
          <div>
            <div className={`text-sm font-bold ${currentPlayer === 1 && !gameOver ? playerColors[1].text : 'text-gray-400'}`}>
              {playerNames[1]}
            </div>
            <div className={`text-2xl font-black ${lastScoredPlayer === 1 ? 'score-bump' : ''}`}>
              {playerScores[1]}
            </div>
          </div>
        </div>

        {/* Center: Title + Back */}
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
            ⚔️ Local Duel
          </h1>
          <div className="flex items-center gap-3 mt-1">
            {!gameOver && (
              <button onClick={handleEndGameEarly} className="text-xs font-bold text-yellow-500 hover:text-yellow-400 transition-colors bg-white/5 px-2 py-1 rounded">
                End Game
              </button>
            )}
            <button onClick={onBack} className="text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1">
              Leave
            </button>
          </div>
        </div>

        {/* Player 2 Score */}
        <div
          className={`card-glass px-5 py-3 flex items-center gap-3 transition-all duration-300 ${
            currentPlayer === 2 && !gameOver ? playerColors[2].glow : ''
          }`}
        >
          <span className={`w-3 h-3 rounded-full ${playerColors[2].bg}`} />
          <div>
            <div className={`text-sm font-bold ${currentPlayer === 2 && !gameOver ? playerColors[2].text : 'text-gray-400'}`}>
              {playerNames[2]}
            </div>
            <div className={`text-2xl font-black ${lastScoredPlayer === 2 ? 'score-bump' : ''}`}>
              {playerScores[2]}
            </div>
          </div>
        </div>
      </div>

      {/* Turn / Phase Indicator */}
      {!gameOver && (
        <div className="mb-5 animate-slide-up">
          <div className={`card-glass px-6 py-3 flex items-center gap-3 phase-pulse`}>
            <span className={`w-2.5 h-2.5 rounded-full ${playerColors[currentPlayer].bg} animate-pulse-soft`} />
            <span className="text-sm font-semibold text-gray-200">
              {playerNames[currentPlayer]}
              <span className="text-gray-400 font-normal">
                {turnPhase === 'place'
                  ? ' — place a letter in any empty cell'
                  : ' — drag to select a word, then submit'}
              </span>
            </span>
          </div>
        </div>
      )}

      {/* Game Over Banner */}
      {gameOver && (
        <div className="mb-6 text-center animate-slide-up">
          <div className="card-glass px-8 py-6">
            <div className="text-3xl font-black mb-2 winner-glow text-yellow-400">
              {winner === 'tie'
                ? "🤝 It's a Tie!"
                : `🏆 ${playerNames[winner]} Wins!`}
            </div>
            <div className="text-gray-400 text-sm mb-4">
              {playerNames[1]}: {playerScores[1]} pts — {playerNames[2]}: {playerScores[2]} pts
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleNewGame}
                className="px-5 py-2 rounded-lg font-bold text-sm bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:from-yellow-300 hover:to-orange-400 transition-all"
              >
                🔄 Rematch
              </button>
              <button
                onClick={onBack}
                className="px-5 py-2 rounded-lg font-bold text-sm bg-white/10 text-gray-300 hover:bg-white/20 transition-all"
              >
                ← Lobby
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          className={`toast mb-4 px-5 py-3 rounded-xl text-sm font-medium shadow-lg ${
            toast.type === 'error'
              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
              : toast.type === 'success'
              ? 'bg-green-500/20 text-green-300 border border-green-500/30'
              : 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/20'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Grid */}
      <div
        className="rounded-2xl p-3 card-glass"
        style={{ width: 'fit-content' }}
      >
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${size}, ${cellSize}px)`,
            gap: `${gap}px`,
          }}
        >
          {gridData.map((cell, index) => (
            <input
              key={index}
              type="text"
              maxLength="1"
              value={cell}
              readOnly={
                gameOver ||
                turnPhase === 'claim' ||
                (gridData[index] !== '' && cellOwners[index] !== null)
              }
              onChange={(e) => handleInputChange(index, e.target.value)}
              onClick={() => handleCellClick(index)}
              onMouseDown={() => handleMouseDown(index)}
              onMouseEnter={() => handleMouseEnter(index)}
              className={`${getCellStyle(index)} border rounded-lg text-center uppercase font-bold transition-all duration-150`}
              style={{
                width: `${cellSize}px`,
                height: `${cellSize}px`,
                fontSize: `${cellSize * 0.4}px`,
                caretColor: 'transparent',
              }}
            />
          ))}
        </div>
      </div>

      {/* Action Buttons (Claim Phase) */}
      {!gameOver && turnPhase === 'claim' && (
        <div className="flex gap-3 mt-5 animate-slide-up">
          <button
            onClick={handleSubmitWord}
            disabled={selectedIndices.length < 2}
            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
              selectedIndices.length >= 2
                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:from-yellow-300 hover:to-orange-400 hover:scale-105 active:scale-95 shadow-lg shadow-yellow-500/20'
                : 'bg-white/5 text-gray-600 cursor-not-allowed'
            }`}
          >
            ✓ Submit Word{selectedIndices.length >= 2 && ` (${selectedIndices.map((i) => gridData[i]).join('')})`}
          </button>
          <button
            onClick={handleSkipClaim}
            className="px-5 py-3 rounded-xl font-bold text-sm bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200 transition-all"
          >
            Skip →
          </button>
        </div>
      )}

      {/* Selected word preview */}
      {!gameOver && turnPhase === 'claim' && selectedIndices.length >= 2 && (
        <div className="mt-3 text-sm text-gray-400">
          Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-gray-300 text-xs font-mono">Enter</kbd> to submit
          {' · '}
          <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-gray-300 text-xs font-mono">Esc</kbd> to deselect
        </div>
      )}

      {/* Grid fill progress */}
      <div className="mt-6 w-full max-w-xs">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Progress</span>
          <span>{gridData.filter((c) => c !== '').length} / {size * size}</span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${(gridData.filter((c) => c !== '').length / (size * size)) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default Grid;
