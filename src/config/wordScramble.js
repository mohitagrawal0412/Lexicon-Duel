export const WORD_LISTS = {
  EASY: [
    'APPLE', 'HOUSE', 'TRAIN', 'WATER', 'SMILE', 'BREAD', 'CHAIR', 
    'PLANT', 'MOUSE', 'CLOCK', 'DREAM', 'HEART', 'LIGHT', 'MONEY', 'PARTY'
  ],
  MEDIUM: [
    'TEACHER', 'JOURNAL', 'DIAMOND', 'GUITAR', 'PICTURE', 'MORNING', 
    'SCIENCE', 'HISTORY', 'WEATHER', 'MACHINE', 'COUNTRY', 'BICYCLE', 'STATION'
  ],
  HARD: [
    'BEAUTIFUL', 'CHALLENGE', 'KNOWLEDGE', 'ADVENTURE', 'IMPORTANT', 
    'DIFFERENT', 'EDUCATION', 'RESTAURANT', 'TELEVISION', 'APARTMENT', 'CHOCOLATE'
  ]
};

export const MAX_SCORE = 5;

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

export const generateScramble = (difficulty) => {
  const list = WORD_LISTS[difficulty] || WORD_LISTS.MEDIUM;
  const word = list[randInt(0, list.length - 1)];
  
  // Convert word to array of letters and shuffle until it's not the original word
  let scrambled;
  do {
    scrambled = [...word].sort(() => Math.random() - 0.5);
  } while (scrambled.join('') === word);

  // We assign a unique ID to each letter to handle duplicate letters correctly in UI
  const letters = scrambled.map((char, index) => ({
    id: `letter-${index}`,
    char: char
  }));

  return {
    word,
    letters
  };
};
