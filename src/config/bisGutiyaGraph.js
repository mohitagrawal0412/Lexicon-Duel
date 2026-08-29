// ─── Graph Topology for Bis gutiya (5x5 Alquerque board) ────────────────

const SIZE = 5;
const TOTAL_NODES = SIZE * SIZE;

// Helper to get coordinates
const getCoords = (index) => ({ x: index % SIZE, y: Math.floor(index / SIZE) });
const getIndex = (x, y) => {
  if (x < 0 || x >= SIZE || y < 0 || y >= SIZE) return -1;
  return y * SIZE + x;
};

// Generate Adjacency List
const generateAdjacencyList = () => {
  const list = Array(TOTAL_NODES).fill(null).map(() => []);
  
  for (let i = 0; i < TOTAL_NODES; i++) {
    const { x, y } = getCoords(i);
    const hasDiagonals = (x + y) % 2 === 0;

    // Check all 8 directions
    const directions = [
      { dx: 0, dy: -1 }, // Up
      { dx: 0, dy: 1 },  // Down
      { dx: -1, dy: 0 }, // Left
      { dx: 1, dy: 0 },  // Right
    ];

    if (hasDiagonals) {
      directions.push(
        { dx: -1, dy: -1 }, // Up-Left
        { dx: 1, dy: -1 },  // Up-Right
        { dx: -1, dy: 1 },  // Down-Left
        { dx: 1, dy: 1 }    // Down-Right
      );
    }

    directions.forEach(({ dx, dy }) => {
      const neighborIndex = getIndex(x + dx, y + dy);
      if (neighborIndex !== -1) {
        list[i].push(neighborIndex);
      }
    });
  }
  return list;
};

// Generate Jump Map: JUMP_MAP[start][mid] = target
const generateJumpMap = (adjList) => {
  const map = {};
  for (let i = 0; i < TOTAL_NODES; i++) {
    map[i] = {};
    const { x, y } = getCoords(i);
    const hasDiagonals = (x + y) % 2 === 0;

    const directions = [
      { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
      { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
    ];
    if (hasDiagonals) {
      directions.push(
        { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
        { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
      );
    }

    directions.forEach(({ dx, dy }) => {
      const mid = getIndex(x + dx, y + dy);
      const target = getIndex(x + dx * 2, y + dy * 2);
      
      if (mid !== -1 && target !== -1) {
        // Double check that mid actually connects to target (should be true by geometry)
        map[i][mid] = target;
      }
    });
  }
  return map;
};

export const ADJACENCY_LIST = generateAdjacencyList();
export const JUMP_MAP = generateJumpMap(ADJACENCY_LIST);

// Initial Board State
// 1 = Player 1 (Red/P1), -1 = Player 2 (Blue/P2), 0 = Empty
export const getInitialBoard = () => {
  const board = Array(TOTAL_NODES).fill(0);
  for (let i = 0; i < 12; i++) board[i] = 1;
  for (let i = 13; i < 25; i++) board[i] = -1;
  return board;
};
