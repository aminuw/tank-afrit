const fs = require('fs');

const replacements = {
    'ðŸŒ¿': '🌿',
    'ðŸª¨': '🪨',
    'ðŸŒ²': '🌲',
    'ðŸ'¥': '👥',
    'ðŸš€': '🚀',
    'ðŸŒ': '🌐',
    'ðŸ''': '👑',
    'ðŸ"´': '🔴',
    'ðŸŽ®': '🎮',
    'âœ…': '✅',
    'â³': '⏳',
    'âš ï¸': '⚠️',
    'â¤ï¸': '❤️',
    'Ã©': 'é',
    'Ã¨': 'è',
    'Ã ': 'à',
    'Ã§': 'ç',
    'Ã´': 'ô',
    'Ãª': 'ê',
    'Ã®': 'î',
    'Ã¢': 'â',
    'Ã¹': 'ù',
    'Ã‰': 'É',
    'â€™': "'",
    'Â ': ' '
};

let content = fs.readFileSync('battle-royale.js', 'utf8');

for (const [bad, good] of Object.entries(replacements)) {
    content = content.split(bad).join(good);
}

fs.writeFileSync('battle-royale.js', content, 'utf8');
console.log('Fixed battle-royale.js encoding!');
