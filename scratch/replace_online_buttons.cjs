const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../src/pages');
const files = fs.readdirSync(dir).filter(f => f.endsWith('SetupPage.jsx') && !f.includes('OnlineSetupPage'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Skip if already replaced or no "Coming Soon" block
  if (!content.includes('Coming Soon')) {
    console.log(`Skipping ${file}`);
    continue;
  }

  console.log(`Replacing in ${file}`);
  
  let gameId = file.replace('SetupPage.jsx', '').replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
  if (gameId === 'guess-battle') gameId = 'guess';
  
  const newBlock = `{/* Play Duel Mode */}
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
              <p className="text-sm text-gray-400">Play with a random opponent globally</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            Jump into matchmaking to find a random opponent to play this game right now!
          </p>
        </button>`;

  // Match until the end of the div by matching the literal text at the end of the block
  const replacedContent = content.replace(
    /\{\/\*\s*Online Mode \(Coming Soon\).*?online multiplayer\.\s*<\/p>\s*<\/div>/s,
    newBlock
  );

  fs.writeFileSync(filePath, replacedContent);
  console.log(`Updated ${file}`);
}
