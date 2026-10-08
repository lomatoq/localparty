'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const app=fs.readFileSync('games/arcade/public/app.js','utf8');
const helper=app.slice(app.indexOf('function drawArcadeCountdown('),app.indexOf('function drawPunchRope('));
function context(){const camera=[.82,0,0,.82,148,130],stack=[],fills=[],texts=[];return {camera,stack,fills,texts,save(){stack.push([...this.camera]);},restore(){this.camera=stack.pop();},setTransform(...t){this.camera=t;},fillRect(...rect){fills.push({rect,transform:[...this.camera]});},fillText(...text){texts.push({text,transform:[...this.camera]});}};}
for(const [width,height] of [[1280,720],[3840,2160]])test(`Countdown dims full ${width}×${height} backing without moving its readout`,()=>{
 const g=context(),camera=[...g.camera];let timer;
 const sandbox={window:{ArcadeJuice:{countdown(ctx,state){timer={transform:[...ctx.camera],countdown:state.countdown};}}}};vm.runInNewContext(helper+';drawArcadeCountdown',sandbox)(g,{countdown:2.7},{width,height});
 assert.deepEqual(g.fills,[{rect:[0,0,width,height],transform:[1,0,0,1,0,0]}]);assert.deepEqual(timer,{transform:camera,countdown:2.7});assert.deepEqual(g.camera,camera);assert.equal(g.stack.length,0);
});
test('Fallback numeral gets the same fullscreen dim and retains world position',()=>{
 const g=context(),camera=[...g.camera];vm.runInNewContext(helper+';drawArcadeCountdown',{window:{}})(g,{countdown:1.4},{width:1920,height:1080});
 assert.equal(g.fills.length,1);assert.deepEqual(g.texts.map(t=>t.text),[['2',600,380],['Get ready to flap',600,440]]);for(const t of g.texts)assert.deepEqual(t.transform,camera);assert.equal(g.stack.length,0);
});
test('World clip and shake restore before countdown; countdown art cannot add a slab',()=>{
 assert.match(app,/drawFeedback\(state\);g\.restore\(\);g\.restore\(\);if\(state\.countdown>0\)drawArcadeCountdown\(g,state,c\)/);
 const juice=fs.readFileSync('games/arcade/public/arcade-juice.js','utf8'),art=juice.slice(juice.indexOf('function countdown('),juice.indexOf('/* ---------- Phone ---------- */'));
 assert.doesNotMatch(art,/fillRect|clip\(/);assert.match(art,/Math\.ceil\(s\.countdown\)/);assert.match(art,/g\.translate\(600,350\)/);
});
