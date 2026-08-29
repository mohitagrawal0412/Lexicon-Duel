export const MAX_SCORE = 5;

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffle = (array) => [...array].sort(() => Math.random() - 0.5);

export const generateOddOneOut = (difficulty) => {
  let size, baseItem, oddItem, type;

  if (difficulty === 'EASY') {
    // 4x4 Grid - Obvious Emojis
    size = 4;
    type = 'EMOJI';
    const pairs = [
      ['🐶', '🐱'], ['🍎', '🍅'], ['🚗', '🚕'], ['😀', '😎'],
      ['☀️', '🌙'], ['⭐', '🌟'], ['🟢', '🔴'], ['⚽', '🏀']
    ];
    const pair = pairs[randInt(0, pairs.length - 1)];
    const isFirstBase = Math.random() > 0.5;
    baseItem = isFirstBase ? pair[0] : pair[1];
    oddItem = isFirstBase ? pair[1] : pair[0];
  } 
  else if (difficulty === 'MEDIUM') {
    // 5x5 Grid - Lookalike Characters
    size = 5;
    type = 'TEXT';
    const pairs = [
      ['O', '0'], ['I', 'l'], ['C', 'G'], ['Q', 'O'], 
      ['B', '8'], ['Z', '2'], ['S', '5'], ['V', 'U'],
      ['p', 'q'], ['b', 'd'], ['n', 'm'], ['v', 'w']
    ];
    const pair = pairs[randInt(0, pairs.length - 1)];
    const isFirstBase = Math.random() > 0.5;
    baseItem = isFirstBase ? pair[0] : pair[1];
    oddItem = isFirstBase ? pair[1] : pair[0];
  } 
  else {
    // HARD - 6x6 Grid - Subtle Colors or Shapes
    size = 6;
    type = 'COLOR';
    const pairs = [
      ['bg-blue-500', 'bg-blue-600'],
      ['bg-red-500', 'bg-red-600'],
      ['bg-green-400', 'bg-green-500'],
      ['bg-yellow-400', 'bg-yellow-500'],
      ['bg-purple-500', 'bg-purple-600'],
      ['bg-pink-400', 'bg-pink-500'],
      ['bg-surface-600', 'bg-surface-700']
    ];
    const pair = pairs[randInt(0, pairs.length - 1)];
    const isFirstBase = Math.random() > 0.5;
    baseItem = isFirstBase ? pair[0] : pair[1];
    oddItem = isFirstBase ? pair[1] : pair[0];
  }

  const totalItems = size * size;
  const targetIndex = randInt(0, totalItems - 1);
  
  let grid = [];
  for (let i = 0; i < totalItems; i++) {
    grid.push({
      id: `item-${i}`,
      isTarget: i === targetIndex,
      content: i === targetIndex ? oddItem : baseItem,
      type: type // EMOJI, TEXT, COLOR
    });
  }

  return {
    size,
    grid
  };
};
