import { ADJACENCY_LIST, JUMP_MAP } from '../config/bisGutiyaGraph';

// board is an array of 25 integers: 1 (p1), -1 (p2), 0 (empty)
// player is 1 or -1

export const getValidMoves = (board, player) => {
  const stepMoves = [];
  const jumpMoves = [];

  for (let i = 0; i < 25; i++) {
    if (board[i] !== player) continue;

    const neighbors = ADJACENCY_LIST[i];

    neighbors.forEach(mid => {
      if (board[mid] === 0) {
        // Step Move
        stepMoves.push({
          piece: i,
          target: mid,
          isJump: false,
          captured: null
        });
      } else if (board[mid] === -player) {
        // Potential Jump
        const target = JUMP_MAP[i][mid];
        if (target !== undefined && board[target] === 0) {
          jumpMoves.push({
            piece: i,
            target: target,
            isJump: true,
            captured: mid
          });
        }
      }
    });
  }

  // Return both step moves and jump moves, making captures optional.
  return [...stepMoves, ...jumpMoves];
};

export const getValidMovesForPiece = (board, player, pieceIndex, mustJump = false) => {
  const allMoves = getValidMoves(board, player);
  const pieceMoves = allMoves.filter(m => m.piece === pieceIndex);

  if (mustJump) {
    return pieceMoves.filter(m => m.isJump);
  }
  
  return pieceMoves;
};

// Applies a move and returns new board and if a multi-jump is possible
export const applyMove = (board, move) => {
  const newBoard = [...board];
  const player = newBoard[move.piece];
  
  newBoard[move.piece] = 0;
  newBoard[move.target] = player;

  if (move.isJump && move.captured !== null) {
    newBoard[move.captured] = 0;
  }

  let multiJumpAvailable = false;
  if (move.isJump) {
    // Check if the piece can jump again from the new target position
    const followUpMoves = getValidMovesForPiece(newBoard, player, move.target, true);
    if (followUpMoves.length > 0) {
      multiJumpAvailable = true;
    }
  }

  return { newBoard, multiJumpAvailable, newActivePiece: move.target };
};

// Checks win conditions. Returns 1 (p1 wins), -1 (p2 wins), or 0 (ongoing)
export const checkWinCondition = (board, currentPlayer) => {
  let p1Count = 0;
  let p2Count = 0;

  for (let i = 0; i < 25; i++) {
    if (board[i] === 1) p1Count++;
    if (board[i] === -1) p2Count++;
  }

  if (p1Count === 0) return -1;
  if (p2Count === 0) return 1;

  // Blockade check for current player
  const moves = getValidMoves(board, currentPlayer);
  if (moves.length === 0) {
    // Current player cannot move, so the OTHER player wins
    return -currentPlayer;
  }

  return 0;
};
