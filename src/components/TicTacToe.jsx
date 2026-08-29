import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const TicTacToe = () => {
  const navigate = useNavigate();
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState(null);

  const checkWinner = (squares) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
      [0, 4, 8], [2, 4, 6]             // diagonals
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    if (!squares.includes(null)) return 'Tie';
    return null;
  };

  const handleClick = (index) => {
    if (board[index] || winner) return;
    
    const newBoard = [...board];
    newBoard[index] = isXNext ? 'X' : 'O';
    setBoard(newBoard);
    
    const newWinner = checkWinner(newBoard);
    if (newWinner) {
      setWinner(newWinner);
    } else {
      setIsXNext(!isXNext);
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setWinner(null);
    setIsXNext(true);
  };

  const getCellColor = (value) => {
    if (value === 'X') return 'text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-purple-500';
    if (value === 'O') return 'text-transparent bg-clip-text bg-gradient-to-br from-green-400 to-teal-500';
    return '';
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] px-4 py-8 animate-fade-in no-select">
      
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black mb-2">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
            ⭕ Tic Tac Toe ❌
          </span>
        </h1>
        <button
          onClick={() => navigate('/tictactoe')}
          className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          ← Back
        </button>
      </div>

      {/* Game Status */}
      <div className="card-glass px-8 py-4 mb-8 text-center animate-slide-up">
        {winner ? (
          <div className="text-2xl font-black winner-glow">
            {winner === 'Tie' ? (
              <span className="text-yellow-400">🤝 It's a Tie!</span>
            ) : (
              <span>
                🏆 <span className={getCellColor(winner)}>{winner}</span> Wins!
              </span>
            )}
          </div>
        ) : (
          <div className="text-lg font-bold text-gray-300">
            Current Turn: <span className={`text-2xl ml-2 ${getCellColor(isXNext ? 'X' : 'O')}`}>{isXNext ? 'X' : 'O'}</span>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="card-glass p-4 rounded-2xl mb-8 animate-slide-up">
        <div className="grid grid-cols-3 gap-3" style={{ width: 'fit-content' }}>
          {board.map((cell, index) => (
            <button
              key={index}
              onClick={() => handleClick(index)}
              disabled={!!winner || !!cell}
              className={`w-24 h-24 rounded-xl text-5xl font-black bg-surface-900 border border-white/10 transition-all duration-200 flex items-center justify-center ${
                !cell && !winner ? 'hover:bg-white/5 hover:border-white/30 cursor-pointer' : ''
              }`}
            >
              <span className={`${getCellColor(cell)} transform transition-transform ${cell ? 'scale-100' : 'scale-0'}`}>
                {cell}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 animate-slide-up">
        <button
          onClick={resetGame}
          className="px-6 py-3 rounded-xl font-bold text-sm bg-white/10 text-white hover:bg-white/20 transition-all"
        >
          Restart Game
        </button>
      </div>

    </div>
  );
};

export default TicTacToe;
