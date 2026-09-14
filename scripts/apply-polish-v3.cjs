'use strict';
// Integration is now committed to the actual application. This is an assertion,
// not a runtime patch: tests must exercise the same files npm start serves.
const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');
function has(file,term){if(!fs.readFileSync(path.join(root,file),'utf8').includes(term))throw Error('Native integration missing: '+file+' / '+term);}
has('server.js','/native-bridge.js');has('server.js','if(!nativeLayout)');has('server.js',"'.avif':'image/avif'");has('public/index.html','shell-v2.js');
has('games/afterparty/server.js','sports-view.js');has('games/afterparty/server.js','venues.js');has('games/afterparty/sports.js','enhanceSports');has('games/afterparty/arcade.js','enhanceArcade');
console.log('Committed native integration verified; no migration required for npm start.');
