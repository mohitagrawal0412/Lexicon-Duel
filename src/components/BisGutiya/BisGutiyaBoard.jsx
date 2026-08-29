import React from 'react';
import { ADJACENCY_LIST } from '../../config/bisGutiyaGraph';

const BOARD_SIZE = 5;
const CELL_SIZE = 100; // SVG internal coordinate units
const PADDING = 40;
const TOTAL_SIZE = (BOARD_SIZE - 1) * CELL_SIZE + PADDING * 2;

const getCoords = (index) => {
  const x = index % BOARD_SIZE;
  const y = Math.floor(index / BOARD_SIZE);
  return { cx: PADDING + x * CELL_SIZE, cy: PADDING + y * CELL_SIZE };
};

export default function BisGutiyaBoard({ 
  board, 
  activePlayer, 
  selectedPiece, 
  validMoves, 
  onPieceClick, 
  onMoveClick 
}) {
  
  // Render Lines
  const renderLines = () => {
    const lines = [];
    const drawn = new Set();

    for (let i = 0; i < 25; i++) {
      ADJACENCY_LIST[i].forEach(neighbor => {
        const key = i < neighbor ? `${i}-${neighbor}` : `${neighbor}-${i}`;
        if (!drawn.has(key)) {
          drawn.add(key);
          const p1 = getCoords(i);
          const p2 = getCoords(neighbor);
          lines.push(
            <line 
              key={key} 
              x1={p1.cx} y1={p1.cy} 
              x2={p2.cx} y2={p2.cy} 
              stroke="#ffffff" 
              strokeOpacity="0.2" 
              strokeWidth="4"
              strokeLinecap="round"
            />
          );
        }
      });
    }
    return lines;
  };

  const renderNodes = () => {
    const nodes = [];
    for (let i = 0; i < 25; i++) {
      const { cx, cy } = getCoords(i);
      nodes.push(
        <circle 
          key={`node-${i}`} 
          cx={cx} cy={cy} 
          r="8" 
          fill="#334155" // surface-700
        />
      );
    }
    return nodes;
  };

  const renderPieces = () => {
    const pieces = [];
    for (let i = 0; i < 25; i++) {
      const player = board[i];
      if (player === 0) continue;

      const { cx, cy } = getCoords(i);
      const isSelected = selectedPiece === i;
      const isMine = player === activePlayer;
      
      const isSelectable = isMine && validMoves.some(m => m.piece === i);

      let fillClass = player === 1 ? 'fill-p1-500' : 'fill-p2-500';
      let strokeClass = player === 1 ? 'stroke-p1-400' : 'stroke-p2-400';

      pieces.push(
        <g 
          key={`piece-${i}`} 
          transform={`translate(${cx}, ${cy})`}
        >
          <g
            onClick={() => isSelectable ? onPieceClick(i) : null}
            className={`${isSelectable ? 'cursor-pointer hover:scale-110' : ''} transition-transform duration-200`}
            style={{ transformOrigin: '0 0' }}
          >
            {isSelected && (
              <circle r="26" fill="none" className={`stroke-white animate-pulse opacity-50`} strokeWidth="4" />
            )}
            <circle 
              r="20" 
              className={`${fillClass} ${isSelected ? strokeClass : 'stroke-surface-900'}`}
              strokeWidth="4"
              style={{ filter: isSelected ? `drop-shadow(0 0 10px ${player === 1 ? '#3b82f6' : '#10b981'})` : 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' }}
            />
          </g>
        </g>
      );
    }
    return pieces;
  };

  const renderHighlights = () => {
    if (selectedPiece === null) return null;

    const availableTargets = validMoves.filter(m => m.piece === selectedPiece);

    return availableTargets.map((move, idx) => {
      const { cx, cy } = getCoords(move.target);
      return (
        <g 
          key={`highlight-${idx}`}
          transform={`translate(${cx}, ${cy})`}
        >
          <g
            onClick={() => onMoveClick(move)}
            className="cursor-pointer hover:scale-110 transition-transform"
            style={{ transformOrigin: '0 0' }}
          >
            <circle 
              r="16" 
              fill="none" 
              className="stroke-green-400 animate-pulse" 
              strokeWidth="6" 
            />
            <circle 
              r="24" 
              fill="rgba(74, 222, 128, 0.2)" 
            />
          </g>
        </g>
      );
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto aspect-square bg-surface-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-4 md:p-8 shadow-2xl">
      <svg 
        viewBox={`0 0 ${TOTAL_SIZE} ${TOTAL_SIZE}`} 
        className="w-full h-full drop-shadow-2xl"
      >
        {renderLines()}
        {renderNodes()}
        {renderPieces()}
        {renderHighlights()}
      </svg>
    </div>
  );
}
