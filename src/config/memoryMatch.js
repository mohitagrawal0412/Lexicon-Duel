export const MAX_SCORE = 3;

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffle = (array) => [...array].sort(() => Math.random() - 0.5);

export const generateBoard = (difficulty) => {
  const allEmojis = [
    '🍎', '🐶', '🚀', '💎', '🎲', '🍔', '🎸', '👑', 
    '🔥', '❄️', '⚽', '🚗', '☀️', '🌙', '🍕', '🎉'
  ];
  
  // EASY: 4x3 grid = 12 cards = 6 pairs
  // HARD: 4x4 grid = 16 cards = 8 pairs
  const numPairs = difficulty === 'EASY' ? 6 : 8;
  
  // Pick random emojis for this round
  const selectedEmojis = shuffle(allEmojis).slice(0, numPairs);
  
  // Duplicate them to create pairs
  const pairedEmojis = [...selectedEmojis, ...selectedEmojis];
  
  // Shuffle them into the board
  const shuffledBoard = shuffle(pairedEmojis);
  
  return shuffledBoard.map((emoji, index) => ({
    id: `card-${index}`,
    emoji: emoji
  }));
};
