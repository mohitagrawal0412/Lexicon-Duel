export const ROUND_LENGTHS = [4, 6, 8, 10]; // Digits per round
export const MEMORY_TIME_MS = 3000; // 3 seconds to memorize

export const generateSequence = (length) => {
  let sequence = '';
  for (let i = 0; i < length; i++) {
    sequence += Math.floor(Math.random() * 10).toString(); // 0-9
  }
  return sequence;
};

// Compares input to target by exact index matching.
// Returns an object with the score and an array of boolean matches for rendering.
export const calculateScore = (target, input) => {
  let score = 0;
  const matches = [];

  for (let i = 0; i < target.length; i++) {
    const isMatch = input[i] === target[i];
    matches.push(isMatch);
    if (isMatch) score++;
  }

  return { score, matches };
};
