'use strict';
const fs=require('node:fs');
const palette={"push":["#a96aff","#5ce9ef"],"shrink":["#31dfff","#9760ff"],"knives":["#ff5977","#41d7ef"],"bomb":["#ae54ff","#ff9f35"],"western":["#ffac43","#a75bff"],"tanks":["#b4ec35","#8c55ff"],"tankarena":["#b6fa32","#a45cff"],"chaos":["#9b58ff","#17cfff"],"kart":["#ff634b","#c0ef3a"],"monster":["#25d8e5","#aa65f6"],"spy":["#b56aff","#f5bf51"],"millionaire":["#ffc949","#33dfff"],"sinyakquiz":["#bcf735","#a663ff"],"warsaw":["#efbb60","#b0ec3b"],"crocodile":["#a8ec32","#a866ef"],"jenga":["#f4b24e","#a872f5"],"crane":["#ffcc36","#19cfe9"],"naval":["#28d7f0","#8c68ef"],"drawguess":["#9f63f5","#b5ed35"],"western_duel":["#b363f5","#ffc440"],"taprace":["#ffc04d","#be63f3"],"punchmeter":["#ff6589","#ae63f5"],"flappy":["#3adef5","#b259ff"],"hungry":["#b2ef39","#ffad3e"],"snakelines":["#b4ed3f","#a86bff"],"carryball":["#36dbe9","#a7e83d"]};
const catalog=JSON.parse(fs.readFileSync('catalog.json','utf8'));
for(const game of catalog){[game.color,game.secondaryColor]=palette[game.id];}
fs.writeFileSync('catalog.json',JSON.stringify(catalog,null,2)+'\n');
let app=fs.readFileSync('public/app.js','utf8');
if(app.includes('const menuPalette='))app=app.replace(/const menuPalette=\{[^\n]*?\};/, 'const menuPalette='+JSON.stringify(palette)+';');
else app=app.replace(" 'use strict';"," 'use strict';\n // Keep a running host's cached catalog visually current without interrupting a match.\n const menuPalette="+JSON.stringify(palette)+";");
app=app.replace("if(m.type==='state'){state=m;","if(m.type==='state'){for(const g of m.catalog){const p=menuPalette[g.id];if(p){g.color=p[0];g.secondaryColor=p[1];}}state=m;");
if(!app.includes("card.style.setProperty('--card-secondary'"))app=app.replace("card.style.setProperty('--card',g.color);","card.style.setProperty('--card',g.color);card.style.setProperty('--card-secondary',g.secondaryColor||g.color);");
fs.writeFileSync('public/app.js',app);
const monster='games/monster/public/monster-glass.css';
fs.writeFileSync(monster,fs.readFileSync(monster,'utf8').replace('/assets/games/monster.webp\'', '/assets/games/monster.webp?v=0.6-premium\''));
