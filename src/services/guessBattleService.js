import { ref, set, get, update, onValue, remove } from 'firebase/database';
import { rtdb } from '../firebase';
import { generateSecret, POWER_UP_DEFAULTS } from '../config/guessBattle';

const generateCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const makePlayerState = (user) => ({
  uid: user.uid,
  displayName: user.displayName,
  photoURL: user.photoURL || null,
  submitted: false,
  guess: null,
  doublePointsActive: false,
  powerUps: { ...POWER_UP_DEFAULTS },
  stats: {
    score: 0, roundsWon: 0, exactGuesses: 0,
    totalDiff: 0, bestDiff: 999999999,
    streak: 0, maxStreak: 0,
  },
});

export const createGuessBattleRoom = async (user, timerMode = 'standard') => {
  const code = generateCode();
  await set(ref(rtdb, `guessBattleRooms/${code}`), {
    status: 'waiting',
    timerMode,
    currentRound: 1,
    secretNumber: generateSecret(1),
    hostPlayer: makePlayerState(user),
    guestPlayer: null,
    roundRevealData: null,
    createdAt: Date.now(),
  });
  return code;
};

export const joinGuessBattleRoom = async (code, user) => {
  const snap = await get(ref(rtdb, `guessBattleRooms/${code}`));
  if (!snap.exists()) throw new Error('Room not found. Check the code and try again.');
  const room = snap.val();
  if (room.status !== 'waiting' && room.guestPlayer?.uid !== user.uid)
    throw new Error('Room is full or game already started.');
  if (room.hostPlayer.uid === user.uid) return code;
  await update(ref(rtdb, `guessBattleRooms/${code}`), {
    guestPlayer: makePlayerState(user),
    status: 'round_active',
  });
  return code;
};

export const subscribeToGuessBattleRoom = (code, callback) => {
  const r = ref(rtdb, `guessBattleRooms/${code}`);
  return onValue(r, (snap) => callback(snap.exists() ? snap.val() : null));
};

export const submitGuessBattleGuess = async (code, playerKey, guess, dblPts) => {
  await update(ref(rtdb, `guessBattleRooms/${code}/${playerKey}`), {
    guess,
    submitted: true,
    doublePointsActive: dblPts,
  });
};

export const writeGuessBattleReveal = async (code, revealData, hostStats, guestStats, nextStatus) => {
  await update(ref(rtdb, `guessBattleRooms/${code}`), {
    status: nextStatus,
    roundRevealData: revealData,
    'hostPlayer/stats': hostStats,
    'guestPlayer/stats': guestStats,
    'hostPlayer/doublePointsActive': false,
    'guestPlayer/doublePointsActive': false,
  });
};

export const advanceGuessBattleRound = async (code, nextRound) => {
  await update(ref(rtdb, `guessBattleRooms/${code}`), {
    status: 'round_active',
    currentRound: nextRound,
    secretNumber: generateSecret(nextRound),
    roundRevealData: null,
    'hostPlayer/submitted': false,
    'hostPlayer/guess': null,
    'hostPlayer/doublePointsActive': false,
    'guestPlayer/submitted': false,
    'guestPlayer/guess': null,
    'guestPlayer/doublePointsActive': false,
  });
};

export const updateGuessBattlePowerUp = async (code, playerKey, type, newValue) => {
  await update(ref(rtdb, `guessBattleRooms/${code}/${playerKey}/powerUps`), { [type]: newValue });
};

export const leaveGuessBattleRoom = async (code) => {
  await remove(ref(rtdb, `guessBattleRooms/${code}`));
};
