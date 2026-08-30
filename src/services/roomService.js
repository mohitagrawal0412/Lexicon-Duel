import { ref, set, get, update, onValue, off, remove } from 'firebase/database';
import { rtdb } from '../firebase';

// Generate a random 6-character room code
const generateRoomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const createRoom = async (user, gridSize = 5) => {
  const roomCode = generateRoomCode();
  const roomRef = ref(rtdb, `rooms/${roomCode}`);

  const initialRoomState = {
    status: 'waiting', // waiting, playing, finished
    gridSize,
    host: {
      uid: user.uid,
      displayName: user.displayName,
      photoURL: user.photoURL || null,
    },
    guest: null,
    gameState: {
      gridData: Array.from({ length: gridSize * gridSize }, () => ''),
      cellOwners: Array.from({ length: gridSize * gridSize }, () => 0), // Use 0 instead of null for Firebase
      currentPlayer: 1, // 1 for host, 2 for guest
      turnPhase: 'place',
      scores: { 1: 0, 2: 0 },
      gameOver: false,
      winner: null,
      lastMoveTime: Date.now(),
    },
    createdAt: Date.now(),
  };

  await set(roomRef, initialRoomState);
  return roomCode;
};

export const joinRoom = async (roomCode, user) => {
  const roomRef = ref(rtdb, `rooms/${roomCode}`);
  const snapshot = await get(roomRef);

  if (!snapshot.exists()) {
    throw new Error('Room not found! Check the code and try again.');
  }

  const room = snapshot.val();

  if (room.status !== 'waiting' && room.guest?.uid !== user.uid) {
    throw new Error('Room is already full or game has started.');
  }

  if (room.host.uid === user.uid) {
    // Host is re-joining
    return roomCode;
  }

  // Add guest to room
  await update(roomRef, {
    guest: {
      uid: user.uid,
      displayName: user.displayName,
      photoURL: user.photoURL || null,
    },
    status: 'playing',
  });

  return roomCode;
};

export const subscribeToRoom = (roomCode, callback) => {
  const roomRef = ref(rtdb, `rooms/${roomCode}`);
  
  const unsubscribe = onValue(roomRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback(null); // Room deleted
    }
  });

  return unsubscribe;
};

export const updateGameState = async (roomCode, newGameState) => {
  const gameStateRef = ref(rtdb, `rooms/${roomCode}/gameState`);
  await update(gameStateRef, {
    ...newGameState,
    lastMoveTime: Date.now()
  });
};

export const leaveRoom = async (roomCode) => {
  const roomRef = ref(rtdb, `rooms/${roomCode}`);
  await remove(roomRef);
};

// ─── Tic Tac Toe Rooms ────────────────────────────────────────────────────────

export const createTTTRoom = async (user) => {
  const roomCode = generateRoomCode();
  const roomRef = ref(rtdb, `tttRooms/${roomCode}`);

  await set(roomRef, {
    status: 'waiting',
    host: { uid: user.uid, displayName: user.displayName, photoURL: user.photoURL || null },
    guest: null,
    gameState: {
      board: Array(9).fill('_'),   // '_' = empty (Firebase drops null arrays)
      currentTurn: 'X',            // X = host, O = guest
      winner: null,
      gameOver: false,
    },
    createdAt: Date.now(),
  });

  return roomCode;
};

export const joinTTTRoom = async (roomCode, user) => {
  const roomRef = ref(rtdb, `tttRooms/${roomCode}`);
  const snapshot = await get(roomRef);

  if (!snapshot.exists()) throw new Error('Room not found! Check the code and try again.');

  const room = snapshot.val();
  if (room.status !== 'waiting' && room.guest?.uid !== user.uid)
    throw new Error('Room is already full or game has started.');
  if (room.host.uid === user.uid) return roomCode;

  await update(roomRef, {
    guest: { uid: user.uid, displayName: user.displayName, photoURL: user.photoURL || null },
    status: 'playing',
  });

  return roomCode;
};

export const subscribeToTTTRoom = (roomCode, callback) => {
  const roomRef = ref(rtdb, `tttRooms/${roomCode}`);
  const unsubscribe = onValue(roomRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : null);
  });
  return unsubscribe;
};

export const updateTTTGameState = async (roomCode, newGameState) => {
  const gsRef = ref(rtdb, `tttRooms/${roomCode}/gameState`);
  await update(gsRef, newGameState);
};

export const leaveTTTRoom = async (roomCode) => {
  const roomRef = ref(rtdb, `tttRooms/${roomCode}`);
  await remove(roomRef);
};

// ─── Party Rooms (Unified Multiplayer) ──────────────────────────────────────

export const createPartyRoom = async (user) => {
  const roomCode = generateRoomCode();
  const roomRef = ref(rtdb, `partyRooms/${roomCode}`);

  await set(roomRef, {
    status: 'waiting', // waiting (for guest), lobby (picking game), playing (in game)
    host: { uid: user.uid, displayName: user.displayName, photoURL: user.photoURL || null },
    guest: null,
    activeGame: null,
    gameState: null,
    createdAt: Date.now(),
  });

  return roomCode;
};

export const joinPartyRoom = async (roomCode, user) => {
  const roomRef = ref(rtdb, `partyRooms/${roomCode}`);
  const snapshot = await get(roomRef);

  if (!snapshot.exists()) throw new Error('Party Room not found! Check the code.');

  const room = snapshot.val();
  
  if (room.host.uid === user.uid) return roomCode; // Host re-joining
  
  if (room.status !== 'waiting' && room.guest?.uid !== user.uid) {
    throw new Error('Party Room is full.');
  }

  await update(roomRef, {
    guest: { uid: user.uid, displayName: user.displayName, photoURL: user.photoURL || null },
    status: 'lobby', // Move to game selection lobby
  });

  return roomCode;
};

export const subscribeToPartyRoom = (roomCode, callback) => {
  const roomRef = ref(rtdb, `partyRooms/${roomCode}`);
  const unsubscribe = onValue(roomRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : null);
  });
  return unsubscribe;
};

export const updatePartyRoom = async (roomCode, updates) => {
  const roomRef = ref(rtdb, `partyRooms/${roomCode}`);
  await update(roomRef, updates);
};

export const leavePartyRoom = async (roomCode) => {
  const roomRef = ref(rtdb, `partyRooms/${roomCode}`);
  await remove(roomRef);
};

