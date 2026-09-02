const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '..', 'src', 'pages');

const setupPages = [
  { file: 'MemoryMatchSetupPage.jsx', gameId: 'memoryMatch' },
  { file: 'MissingLetterSetupPage.jsx', gameId: 'missingLetter' },
  { file: 'NumberMemorySetupPage.jsx', gameId: 'numberMemory' },
  { file: 'OddOneOutSetupPage.jsx', gameId: 'oddOneOut' },
  { file: 'ReactionBattleSetupPage.jsx', gameId: 'reactionBattle' },
  { file: 'TargetBattleSetupPage.jsx', gameId: 'targetBattle' },
  { file: 'WordScrambleSetupPage.jsx', gameId: 'wordScramble' },
];

const onlineButton = (gameId) => `{/* Online Match */}
        <button
          onClick={() => navigate('/party/duel?game=${gameId}')}
          className="w-full group bg-surface-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 text-left hover:border-blue-500/50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-surface-800 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Globe className="text-blue-400" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Online Match</h2>
              <p className="text-sm text-gray-400">Play with a random opponent</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            Jump into matchmaking to find a random opponent and play online!
          </p>
        </button>`;

let total = 0;

for (const { file, gameId } of setupPages) {
  const filePath = path.join(pagesDir, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`SKIP: ${file} not found`);
    continue;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (!content.includes('Coming Soon')) {
    console.log(`SKIP: ${file} has no "Coming Soon"`);
    continue;
  }
  
  // Match the entire locked block: from the comment line to the closing </div> of the locked section
  // The pattern is:
  //   {/* Online Mode (Coming Soon) */}
  //   <div className="w-full bg-surface-900/30 ...>
  //     ... (multiple nested divs)
  //   </div>                   <-- this is the top-level closing div
  //
  // We match by counting div opens/closes after the comment
  
  const commentRegex = /\{\/\*\s*Online Mode \(Coming Soon\)\s*\*\/\}/;
  const match = commentRegex.exec(content);
  if (!match) {
    console.log(`SKIP: ${file} - could not find comment marker`);
    continue;
  }
  
  const startIdx = match.index;
  // Find the <div that immediately follows the comment
  const afterComment = content.substring(startIdx + match[0].length);
  const divStartMatch = afterComment.match(/^\s*<div/);
  if (!divStartMatch) {
    console.log(`SKIP: ${file} - no <div> after comment`);
    continue;
  }
  
  // Now count nested divs to find the matching closing </div>
  let depth = 0;
  let i = startIdx + match[0].length;
  let foundEnd = -1;
  
  while (i < content.length) {
    if (content.substring(i).startsWith('<div')) {
      depth++;
      i += 4;
    } else if (content.substring(i).startsWith('</div>')) {
      depth--;
      if (depth === 0) {
        foundEnd = i + 6; // past </div>
        break;
      }
      i += 6;
    } else {
      i++;
    }
  }
  
  if (foundEnd === -1) {
    console.log(`SKIP: ${file} - could not find matching </div>`);
    continue;
  }
  
  const before = content.substring(0, startIdx);
  const after = content.substring(foundEnd);
  let newContent = before + onlineButton(gameId) + after;
  
  // Fix imports: replace Lock with Globe if Lock is no longer used
  if (!newContent.includes('<Lock') && newContent.includes('Lock')) {
    newContent = newContent.replace(/,\s*Lock/, '');
  }
  
  fs.writeFileSync(filePath, newContent);
  console.log(`DONE: ${file} -> game=${gameId}`);
  total++;
}

console.log(`\nUpdated ${total} of ${setupPages.length} setup pages.`);
