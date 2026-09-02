import { ref, update, increment, serverTimestamp } from 'firebase/database';
import { rtdb as db } from '../firebase';

export const getRelationshipId = (uid1, uid2) => {
  return [uid1, uid2].sort().join('_');
};

export const updateRelationshipStats = async (host, guest, gameId, p1Score, p2Score) => {
  if (!host?.uid || !guest?.uid) return;
  
  const relId = getRelationshipId(host.uid, guest.uid);
  const updates = {};
  
  // Basic info
  updates[`relationships/${relId}/players/${host.uid}/displayName`] = host.displayName;
  updates[`relationships/${relId}/players/${guest.uid}/displayName`] = guest.displayName;
  
  // Global stats
  updates[`relationships/${relId}/stats/totalGames`] = increment(1);
  updates[`relationships/${relId}/stats/games/${gameId}/played`] = increment(1);
  
  // Determine winner
  if (p1Score > p2Score) {
    updates[`relationships/${relId}/stats/overallWins/${host.uid}`] = increment(1);
    updates[`relationships/${relId}/stats/games/${gameId}/${host.uid}_wins`] = increment(1);
  } else if (p2Score > p1Score) {
    updates[`relationships/${relId}/stats/overallWins/${guest.uid}`] = increment(1);
    updates[`relationships/${relId}/stats/games/${gameId}/${guest.uid}_wins`] = increment(1);
  } else {
    updates[`relationships/${relId}/stats/overallWins/ties`] = increment(1);
    updates[`relationships/${relId}/stats/games/${gameId}/ties`] = increment(1);
  }
  
  updates[`relationships/${relId}/lastPlayedAt`] = serverTimestamp();
  
  // Index for easy querying on the Home Screen
  updates[`userRelationships/${host.uid}/${relId}`] = true;
  updates[`userRelationships/${guest.uid}/${relId}`] = true;

  try {
    await update(ref(db), updates);
  } catch (err) {
    console.error("Failed to update relationship stats:", err);
  }
};

export const getUserHistory = async (uid) => {
  if (!uid) return [];
  const { get } = await import('firebase/database');
  const userRelsRef = ref(db, `userRelationships/${uid}`);
  const snapshot = await get(userRelsRef);
  
  if (!snapshot.exists()) return [];
  
  const relIds = Object.keys(snapshot.val());
  
  const historySnaps = await Promise.all(
    relIds.map(relId => get(ref(db, `relationships/${relId}`)))
  );
  
  const history = historySnaps
    .filter(snap => snap.exists())
    .map(snap => ({ id: snap.key, ...snap.val() }));
  
  return history.sort((a, b) => (b.lastPlayedAt || 0) - (a.lastPlayedAt || 0));
};

export const subscribeToRelationship = (uid1, uid2, callback) => {
  if (!uid1 || !uid2) return () => {};
  
  const relId = getRelationshipId(uid1, uid2);
  const relRef = ref(db, `relationships/${relId}`);
  
  import('firebase/database').then(({ onValue }) => {
    onValue(relRef, (snapshot) => {
      callback(snapshot.val());
    });
  });

  return () => {
    import('firebase/database').then(({ off }) => {
      off(relRef);
    });
  };
};

export const concludeGameAndReturnToLobby = async (roomId, host, guest, gameId, p1Score, p2Score) => {
  if (p1Score !== undefined && p2Score !== undefined) {
    await updateRelationshipStats(host, guest, gameId, p1Score, p2Score);
  }
  const { updatePartyRoom } = await import('./roomService');
  await updatePartyRoom(roomId, { status: 'lobby', activeGame: null, gameState: null });
};
