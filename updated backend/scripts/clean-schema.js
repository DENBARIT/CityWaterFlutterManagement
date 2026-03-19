const fs = require('fs');
const path = require('path');
const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
let s = fs.readFileSync(schemaPath, 'utf8');
// Remove blocks that start with '/* =========================' and end with '*/' (non-greedy)
s = s.replace(/\/\* =========================[\s\S]*?\*\//g, '');
fs.writeFileSync(schemaPath, s, 'utf8');
console.log('Cleaned schema.prisma');
