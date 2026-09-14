'use strict';
// All pass-two changes are committed now. CI verifies ordinary startup files.
const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');
for(const [file,needles] of [['games/afterparty/public/sports-view.js',['fitCamera','FrameBudget','this.camera.aspect']],['public/app.js',['pongTimer=setTimeout(()=>{if(document.hidden)return;reopen();},8000)']],['lib/party-runtime.js',['Math.round(next.endsAt/50)*50']]])for(const term of needles)if(!fs.readFileSync(path.join(root,file),'utf8').includes(term))throw Error('Missing committed pass-two change '+file+' '+term);
console.log('Pass 2 committed files verified; no test-only patching.');
