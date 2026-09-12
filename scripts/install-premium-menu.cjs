'use strict';
// Install the reviewed individual exports; atlases remain available for reuse.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'public/assets/games');
const ids=['push','shrink','knives','bomb','western','tanks','tankarena','chaos','kart','monster','spy','millionaire','sinyakquiz','warsaw','crocodile','jenga','crane','naval','drawguess','western_duel'];
for(const id of ids){const source=path.join(dir,'premium-v2',id+'.webp');if(!fs.existsSync(source))throw Error('Missing reviewed icon: '+id);}
for(const id of ids){fs.copyFileSync(path.join(dir,'premium-v2',id+'.webp'),path.join(dir,id+'.webp'));}
fs.copyFileSync(path.join(dir,'premium-v2/tankarena.webp'),path.join(dir,'tankarena-hd.webp'));
for(const file of ['public/app.js','public/bridge.js']){const full=path.join(root,file);let text=fs.readFileSync(full,'utf8');text=text.replace(/\.webp(?=['"`])/g,'.webp?v=0.6-premium');fs.writeFileSync(full,text);}
console.log('Installed 20 premium icons and refreshed menu/background cache URLs.');
