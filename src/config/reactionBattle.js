export const ROUND_TYPES = ['COLOR', 'SHAPE', 'NUMBER', 'SYMBOL', 'EMOJI', 'LETTER', 'SIZE'];
export const MAX_SCORE = 5;

// Random utility
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffle = (array) => [...array].sort(() => Math.random() - 0.5);

export const generateRound = () => {
  const type = ROUND_TYPES[randInt(0, ROUND_TYPES.length - 1)];
  const numItems = randInt(4, 9); // Random number of items on screen (including 1 target)
  
  let items = [];
  let targetIndex = randInt(0, numItems - 1);

  if (type === 'COLOR') {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
      'bg-purple-500', 'bg-pink-500', 'bg-orange-500', 'bg-teal-500', 
      'bg-indigo-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-rose-500', 'bg-slate-300'
    ];
    const distractorColor = colors[randInt(0, colors.length - 1)];
    let targetColor;
    do { targetColor = colors[randInt(0, colors.length - 1)]; } while (targetColor === distractorColor);

    for (let i = 0; i < numItems; i++) {
      items.push({
        id: i, isTarget: i === targetIndex,
        className: `w-16 h-16 rounded-full shadow-lg transition-transform active:scale-95 ${i === targetIndex ? targetColor : distractorColor}`,
        content: null
      });
    }
  } else if (type === 'SHAPE') {
    const shapes = ['rounded-full', 'rounded-none', 'rounded-lg rotate-45', 'rounded-t-full', 'rounded-bl-full', 'skew-x-12', 'scale-y-75 rounded-full'];
    const distractorShape = shapes[randInt(0, shapes.length - 1)];
    let targetShape;
    do { targetShape = shapes[randInt(0, shapes.length - 1)]; } while (targetShape === distractorShape);

    for (let i = 0; i < numItems; i++) {
      items.push({
        id: i, isTarget: i === targetIndex,
        className: `w-16 h-16 bg-blue-500 shadow-lg transition-transform active:scale-95 ${i === targetIndex ? targetShape : distractorShape}`,
        content: null
      });
    }
  } else if (type === 'NUMBER') {
    const distractorNum = randInt(0, 9);
    let targetNum;
    do { targetNum = randInt(0, 9); } while (targetNum === distractorNum);

    for (let i = 0; i < numItems; i++) {
      items.push({
        id: i, isTarget: i === targetIndex,
        className: `w-16 h-16 rounded-xl bg-surface-800 border-2 border-white/20 flex items-center justify-center shadow-lg transition-transform active:scale-95 text-3xl font-black text-white`,
        content: i === targetIndex ? targetNum : distractorNum
      });
    }
  } else if (type === 'SYMBOL') {
    const symbols = ['★', '●', '▲', '■', '✦', '♥', '♠', '♣', '♦', '☼', '♫', '⚡', '✿', '❄'];
    const distractorSym = symbols[randInt(0, symbols.length - 1)];
    let targetSym;
    do { targetSym = symbols[randInt(0, symbols.length - 1)]; } while (targetSym === distractorSym);

    for (let i = 0; i < numItems; i++) {
      items.push({
        id: i, isTarget: i === targetIndex,
        className: `w-16 h-16 rounded-xl bg-surface-800 border-2 border-white/20 flex items-center justify-center shadow-lg transition-transform active:scale-95 text-4xl text-yellow-400`,
        content: i === targetIndex ? targetSym : distractorSym
      });
    }
  } else if (type === 'EMOJI') {
    const emojis = ['😀','👽','👻','🤖','👾','🎃','💀','💩','🐵','🦄','🐝','🐛','🦖','🚀','🛸','🍕','🍔','🍩','🎱','🎲','💎','💡','🔥'];
    const distractorEmoji = emojis[randInt(0, emojis.length - 1)];
    let targetEmoji;
    do { targetEmoji = emojis[randInt(0, emojis.length - 1)]; } while (targetEmoji === distractorEmoji);

    for (let i = 0; i < numItems; i++) {
      items.push({
        id: i, isTarget: i === targetIndex,
        className: `w-16 h-16 rounded-xl bg-surface-800 border-2 border-white/20 flex items-center justify-center shadow-lg transition-transform active:scale-95 text-4xl`,
        content: i === targetIndex ? targetEmoji : distractorEmoji
      });
    }
  } else if (type === 'LETTER') {
    // Confusing pairs
    const pairs = [
      ['O', 'Q'], ['p', 'q'], ['b', 'd'], ['I', 'l'], ['m', 'n'],
      ['E', 'F'], ['C', 'G'], ['S', '5'], ['Z', '2'], ['V', 'W'],
      ['u', 'v'], ['X', 'Y'], ['6', '9']
    ];
    const pair = pairs[randInt(0, pairs.length - 1)];
    const targetIsFirst = Math.random() > 0.5;
    const targetLetter = targetIsFirst ? pair[0] : pair[1];
    const distractorLetter = targetIsFirst ? pair[1] : pair[0];

    for (let i = 0; i < numItems; i++) {
      items.push({
        id: i, isTarget: i === targetIndex,
        className: `w-16 h-16 rounded-xl bg-surface-800 border-2 border-white/20 flex items-center justify-center shadow-lg transition-transform active:scale-95 text-4xl font-mono text-white font-bold`,
        content: i === targetIndex ? targetLetter : distractorLetter
      });
    }
  } else if (type === 'SIZE') {
    const isTargetBig = Math.random() > 0.5;
    const targetScale = isTargetBig ? 'scale-110' : 'scale-75';
    const distractorScale = 'scale-90';

    for (let i = 0; i < numItems; i++) {
      items.push({
        id: i, isTarget: i === targetIndex,
        className: `w-16 h-16 rounded-full bg-purple-500 shadow-lg transition-transform active:scale-95 ${i === targetIndex ? targetScale : distractorScale}`,
        content: null
      });
    }
  }

  return {
    type,
    items: shuffle(items)
  };
};

export const getBotReactionTime = (difficulty) => {
  switch(difficulty) {
    case 'EASY': return randInt(1200, 2000);
    case 'MEDIUM': return randInt(700, 1100);
    case 'HARD': return randInt(450, 650);
    case 'INSANE': return randInt(250, 400);
    default: return 1000;
  }
};
