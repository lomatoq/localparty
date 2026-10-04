'use strict';
const fs=require('node:fs'),path=require('node:path'),catalog=require('../lib/catalog');
const [game,status,...words]=process.argv.slice(2),index=catalog.findIndex(g=>g.id===game);if(index<0||!words.length)throw Error('game status note required');
const source=path.resolve('.localparty-build/individual-current-36/captures',game+'-tv.png');const dest=path.resolve('docs/qa/current-visual-audit-tv.json');let notes={};try{notes=JSON.parse(fs.readFileSync(dest));}catch{}notes[String(103+index*10)]={revision:fs.statSync(source).mtime.toISOString(),note:words.join(' '),status};fs.writeFileSync(dest,JSON.stringify(notes,null,2));
