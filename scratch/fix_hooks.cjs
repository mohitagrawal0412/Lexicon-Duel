const fs = require('fs');
const path = require('path');

const componentsDir = path.join(process.cwd(), 'src/components');
const dirs = fs.readdirSync(componentsDir);

dirs.forEach(dir => {
  const compPath = path.join(componentsDir, dir);
  if (!fs.statSync(compPath).isDirectory()) return;
  
  const files = fs.readdirSync(compPath).filter(f => f.startsWith('Online') && f.endsWith('.jsx'));
  
  files.forEach(file => {
    const filePath = path.join(compPath, file);
    let code = fs.readFileSync(filePath, 'utf8');
    
    if (code.includes('Inner' + file.replace('.jsx', ''))) return;

    const returnRegex = /if \(!room\.gameState \|\| typeof room\.gameState === 'string'\) \{\s*return <div[^>]*>Initializing Game\.\.\.<\/div>;\s*\}/g;
    const returnRegexSingle = /if \(!room\.gameState \|\| typeof room\.gameState === 'string'\) return <div[^>]*>Initializing Game\.\.\.<\/div>;/g;

    let match = returnRegex.exec(code);
    if (!match) {
      match = returnRegexSingle.exec(code);
    }

    if (match) {
      const splitIndex = match.index + match[0].length;
      const before = code.substring(0, splitIndex);
      const after = code.substring(splitIndex);

      const componentNameMatch = code.match(/export default function (Online[A-Za-z]+)\(([^)]+)\)/);
      if (componentNameMatch) {
        const componentName = componentNameMatch[1];
        const propsStr = componentNameMatch[2]; // e.g. "{ room, roomId, isHost, user }"

        const propNames = propsStr.replace(/[{}]/g, '').split(',').map(p => p.trim()).filter(Boolean);
        const propsPassed = propNames.map(p => `${p}={${p}}`).join(' ');

        const newCode = before + `\n  return <Inner${componentName} ${propsPassed} />;\n}\n\nfunction Inner${componentName}(${propsStr}) {` + after;
        
        fs.writeFileSync(filePath, newCode);
        console.log(`Fixed ${file}`);
      }
    }
  });
});
