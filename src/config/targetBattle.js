export const MAX_SCORE = 3;
export const ROUND_TIME = 60; // 60 seconds per round

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

export const generateTargetRound = () => {
  const target = randInt(100, 999);
  
  // Classic number pool rules
  const largePool = [25, 50, 75, 100];
  const smallPool = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10];
  
  const large = [...largePool].sort(() => Math.random() - 0.5).slice(0, 2);
  const small = [...smallPool].sort(() => Math.random() - 0.5).slice(0, 4);
  
  const numbers = [...large, ...small].sort(() => Math.random() - 0.5);
  
  const tiles = numbers.map((n, i) => ({
    id: `tile-init-${i}`,
    val: n
  }));

  return { target, initialTiles: tiles };
};

export const evaluateMerge = (val1, op, val2) => {
  if (op === '+') return val1 + val2;
  if (op === '−') return val1 - val2;
  if (op === '×') return val1 * val2;
  if (op === '÷') {
    if (val2 === 0 || val1 % val2 !== 0) return null; // Must be clean division
    return val1 / val2;
  }
  return null;
};
