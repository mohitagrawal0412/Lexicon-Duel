const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, '..', 'src', 'components');

const directories = [
  'BisGutiya', 'GuessBattle', 'MemoryMatch', 'MissingLetter', 
  'NumberMemory', 'OddOneOut', 'ReactionBattle', 'TargetBattle', 'WordScramble'
];

directories.forEach(dir => {
  const filePath = path.join(componentsDir, dir, `Online${dir}.jsx`);
  if (!fs.existsSync(filePath)) {
    console.log(`Not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Add the import if not exists
  if (!content.includes('concludeGameAndReturnToLobby')) {
    content = content.replace(
      "import { updatePartyRoom } from '../../services/roomService';",
      "import { updatePartyRoom } from '../../services/roomService';\nimport { concludeGameAndReturnToLobby } from '../../services/relationshipService';"
    );
  }

  // Find the button onClick
  const regex = /onClick=\{\(\) => updatePartyRoom\(roomId, \{\s*status: 'lobby',\s*activeGame: null,\s*gameState: null\s*\}\)\}/g;
  
  let replacement = '';
  
  if (dir === 'BisGutiya') {
    replacement = "onClick={() => concludeGameAndReturnToLobby(roomId, room.host, room.guest, 'bisGutiya', winner === 1 ? 1 : 0, winner === -1 ? 1 : 0)}";
  } else if (dir === 'GuessBattle') {
    replacement = "onClick={() => concludeGameAndReturnToLobby(roomId, room.host, room.guest, 'guessBattle', p1State.stats.score, p2State.stats.score)}";
  } else {
    // camelCase the gameId
    const gameId = dir.charAt(0).toLowerCase() + dir.slice(1);
    replacement = `onClick={() => concludeGameAndReturnToLobby(roomId, room.host, room.guest, '${gameId}', scores.p1, scores.p2)}`;
  }
  
  // also need to replace the async arrow function in BisGutiya which is formatted differently:
  if (dir === 'BisGutiya') {
    const bgRegex = /onClick=\{async \(\) => \{\s*await updatePartyRoom\(roomId, \{\s*status: 'lobby',\s*activeGame: null,\s*gameState: null\s*\}\);\s*\}\}/g;
    content = content.replace(bgRegex, replacement);
  }

  content = content.replace(regex, replacement);
  
  fs.writeFileSync(filePath, content);
  console.log(`Updated ${dir}`);
});
