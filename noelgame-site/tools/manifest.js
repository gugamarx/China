// Builds the Pages upload manifest (path -> hash) the same way wrangler does.
const { hash } = require('blake3-wasm');
const fs = require('fs'), path = require('path');
const root = process.argv[2];
const IGNORE = new Set(['_worker.js', '_redirects', '_headers', '_routes.json', 'functions', '.DS_Store', 'node_modules', '.git']);
const out = {};
(function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    if (IGNORE.has(name)) continue;
    const full = path.join(dir, name), st = fs.statSync(full);
    if (st.isDirectory()) { walk(full); continue; }
    const ext = path.extname(full).substring(1);
    const h = hash(fs.readFileSync(full).toString('base64') + ext).toString('hex').slice(0, 32);
    out['/' + path.relative(root, full).split(path.sep).join('/')] = h;
  }
})(root);
fs.writeFileSync(process.argv[3], JSON.stringify(out));
console.log(Object.keys(out).length + ' files');
