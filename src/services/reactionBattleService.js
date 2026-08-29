import { ref, set, update, onValue } from 'firebase/database';
import { database } from '../firebase';
import { generateRound } from '../config/reactionBattle';

export const createReactionRoom = async (roomId, hostId, hostName) => {
  const roomRef = ref(database, `reactionRooms/${roomId}`);
  await set(roomRef, {
    hostId,
    hostName,
    guestId: null,
    guestName: null,
    status: 'waiting', // waiting, countdown, playing, finished
    scores: {
      [hostId]: 0
    },
    roundData: null,
    targetShowTime: null, // Timestamp when target appears
    winner: null // round winner or game winner
  });
};

export const joinReactionRoom = async (roomId, guestId, guestName) => {
  const roomRef = ref(database, `reactionRooms/${roomId}`);
  await update(roomRef, {
    guestId,
    guestName,
    status: 'countdown',
    [`scores.${guestId}`]: 0
  });
};

export const startNextRound = async (roomId) => {
  const roundData = generateRound();
  // Delay target appearance between 1.5s and 4s
  const delay = Math.floor(Math.random() * 2500) + 1500;
  const targetShowTime = Date.now() + delay;

  const roomRef = ref(database, `reactionRooms/${roomId}`);
  await update(roomRef, {
    status: 'playing',
    roundData,
    targetShowTime,
    winner: null
  });
};

export const submitReaction = async (roomId, playerId, isCorrect) => {
  // For simplicity, we just process it. If it's correct, player wins the round. 
  // If false start, other player wins the round.
  // We should do this in a transaction in a real app, but update is okay for simple sync
};

export const listenToReactionRoom = (roomId, callback) => {
  const roomRef = ref(database, `reactionRooms/${roomId}`);
  return onValue(roomRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback(null);
    }
  });
};
