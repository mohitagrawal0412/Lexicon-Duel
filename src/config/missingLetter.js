export const CATEGORIES = {
  TECHNOLOGY: [
    'COMPUTER', 'DEVELOPER', 'SOFTWARE', 'HARDWARE', 'INTERNET', 
    'KEYBOARD', 'DATABASE', 'NETWORK', 'MONITOR', 'LAPTOP', 'BROWSER'
  ],
  MOVIES: [
    'TITANIC', 'AVATAR', 'INCEPTION', 'GLADIATOR', 'MATRIX', 
    'JURASSIC', 'BATMAN', 'SUPERMAN', 'MARVEL', 'CINEMA', 'DIRECTOR'
  ],
  COUNTRIES: [
    'BRAZIL', 'JAPAN', 'CANADA', 'GERMANY', 'FRANCE', 
    'MEXICO', 'ITALY', 'SPAIN', 'AUSTRALIA', 'INDIA', 'EGYPT'
  ],
  ANIMALS: [
    'ELEPHANT', 'GIRAFFE', 'PENGUIN', 'KANGAROO', 'DOLPHIN', 
    'CHEETAH', 'GORILLA', 'MONKEY', 'TIGER', 'ZEBRA', 'PANTHER'
  ],
  SPORTS: [
    'FOOTBALL', 'TENNIS', 'CRICKET', 'BASEBALL', 'BASKETBALL', 
    'HOCKEY', 'SOCCER', 'VOLLEYBALL', 'RUGBY', 'GOLF', 'BOXING'
  ],
  GENERAL: [
    'BEAUTIFUL', 'JOURNEY', 'KNOWLEDGE', 'MYSTERY', 'CHALLENGE', 
    'LANGUAGE', 'NATURE', 'HISTORY', 'SCIENCE', 'LIBRARY', 'HOSPITAL'
  ]
};

export const MAX_SCORE = 5;

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

export const generateMissingLetter = (category) => {
  let list = CATEGORIES[category];
  
  if (!list || category === 'RANDOM') {
    const keys = Object.keys(CATEGORIES);
    const randomKey = keys[randInt(0, keys.length - 1)];
    list = CATEGORIES[randomKey];
  }

  const word = list[randInt(0, list.length - 1)];
  
  // Pick a random letter index to hide
  const missingIndex = randInt(0, word.length - 1);
  const missingLetter = word[missingIndex];
  
  // Create display array
  const displayArray = word.split('').map((char, index) => 
    index === missingIndex ? '_' : char
  );

  return {
    word,
    missingLetter,
    displayArray,
    categoryName: category === 'RANDOM' ? 'MIXED' : category
  };
};
