// ─── Round Configuration ───────────────────────────────────────────────────
export const TOTAL_ROUNDS = 10;

export const ROUND_RANGES = [
  { round: 1,  min: 1,     max: 10      },
  { round: 2,  min: 10,    max: 20      },
  { round: 3,  min: 20,    max: 50      },
  { round: 4,  min: 50,    max: 100     },
  { round: 5,  min: 100,   max: 200     },
  { round: 6,  min: 200,   max: 500     },
  { round: 7,  min: 500,   max: 1000    },
  { round: 8,  min: 1000,  max: 5000    },
  { round: 9,  min: 5000,  max: 10000   },
  { round: 10, min: 10000, max: 100000  },
];

// ─── Timer Modes ──────────────────────────────────────────────────────────────
export const TIMER_MODES = {
  casual:   { label: 'Casual',   seconds: 30, color: 'text-green-400'  },
  standard: { label: 'Standard', seconds: 15, color: 'text-yellow-400' },
  blitz:    { label: 'Blitz',    seconds: 5,  color: 'text-red-400'    },
};

// ─── Bot Difficulties ─────────────────────────────────────────────────────────
export const BOT_DIFFICULTIES = {
  easy:   { label: 'Easy 🐢',    spread: 1.00, description: 'Completely random guesses'  },
  medium: { label: 'Medium 🦊',  spread: 0.40, description: 'Roughly in the right area'  },
  hard:   { label: 'Hard 🧠',    spread: 0.20, description: 'Usually dangerously close'  },
  insane: { label: 'Insane 🤖',  spread: 0.06, description: 'Unnervingly accurate'       },
};

// ─── Power-Up Limits ──────────────────────────────────────────────────────────
export const POWER_UP_DEFAULTS = { hints: 2, doublePoints: 1, reGuess: 1 };

// ─── Game Logic Functions ─────────────────────────────────────────────────────

export const generateSecret = (round) => {
  const { min, max } = ROUND_RANGES[(round - 1)] || ROUND_RANGES[9];
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const getBotGuess = (secret, round, difficulty) => {
  const { min, max } = ROUND_RANGES[(round - 1)] || ROUND_RANGES[9];
  const { spread } = BOT_DIFFICULTIES[difficulty] || BOT_DIFFICULTIES.easy;
  const rangeSize = max - min;

  if (spread >= 1.0) {
    return Math.floor(Math.random() * rangeSize) + min;
  }

  const deviation = Math.floor(rangeSize * spread);
  const offset = Math.floor((Math.random() * 2 - 1) * deviation);
  return Math.max(min, Math.min(max, secret + offset));
};

// Returns: { winner, p1Points, p2Points, p1Diff, p2Diff, p1Exact, p2Exact }
export const calculateRoundResult = (secret, p1g, p2g, p1Dbl = false, p2Dbl = false) => {
  const p1Diff  = Math.abs(secret - p1g);
  const p2Diff  = Math.abs(secret - p2g);
  const p1Exact = p1Diff === 0;
  const p2Exact = p2Diff === 0;

  let winner = 'tie', p1Points = 0, p2Points = 0;

  if (p1Diff < p2Diff) {
    winner   = 'p1';
    p1Points = p1Exact ? 3 : 1;
    if (p1Dbl) p1Points *= 2;
  } else if (p2Diff < p1Diff) {
    winner   = 'p2';
    p2Points = p2Exact ? 3 : 1;
    if (p2Dbl) p2Points *= 2;
  }

  return { winner, p1Points, p2Points, p1Diff, p2Diff, p1Exact, p2Exact };
};

export const getHint = (secret, round, hintUsed) => {
  const { min, max } = ROUND_RANGES[(round - 1)] || ROUND_RANGES[9];
  const size = max - min;
  const mid  = min + Math.floor(size / 2);
  const q1   = min + Math.floor(size / 4);
  const q3   = min + Math.floor(size * 3 / 4);

  const hints = [
    secret > mid
      ? `📊 The number is greater than ${mid.toLocaleString()}`
      : `📊 The number is less than or equal to ${mid.toLocaleString()}`,
    `📊 The number is ${secret % 2 === 0 ? 'even' : 'odd'}`,
    secret <= q1
      ? `📊 Lower quarter: between ${min.toLocaleString()} and ${q1.toLocaleString()}`
      : secret <= mid
      ? `📊 Second quarter: between ${q1.toLocaleString()} and ${mid.toLocaleString()}`
      : secret <= q3
      ? `📊 Third quarter: between ${mid.toLocaleString()} and ${q3.toLocaleString()}`
      : `📊 Upper quarter: between ${q3.toLocaleString()} and ${max.toLocaleString()}`,
  ];

  return hints[hintUsed % hints.length];
};
