'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function runtime(dimensions){
 const context={window:{},Image:class{constructor(){this.complete=true;this.naturalWidth=dimensions[0];this.naturalHeight=dimensions[1];}},fetch:()=>Promise.resolve({ok:true,json:async()=>({frames:{}})})};
 vm.runInNewContext(fs.readFileSync('public/game-art.js','utf8'),context);
 const calls=[],ctx={globalAlpha:1};for(const method of ['save','restore','translate','rotate','scale','beginPath','arc','clip','drawImage','stroke'])ctx[method]=(...args)=>calls.push([method,...args]);
 return{draw:options=>context.window.PartyArt.drawMascot(ctx,10,20,80,80,options),calls,ctx};
}
test('uploaded rectangular photos cover a circular canvas identity',()=>{const r=runtime([200,100]);assert.equal(r.draw({avatar:'/api/avatar/photo',alpha:.5,rotation:.1}),true);assert.deepEqual(r.calls.find(c=>c[0]==='arc').slice(1),[0,0,40,0,Math.PI*2]);assert.equal(r.calls.filter(c=>c[0]==='clip').length,1);assert.deepEqual(r.calls.find(c=>c[0]==='drawImage').slice(2),[-80,-40,160,80]);assert.equal(r.ctx.globalAlpha,.5);assert.equal(r.calls.at(-1)[0],'restore');});
test('approved freeform mascots stay contained without circular clipping',()=>{const r=runtime([100,200]);assert.equal(r.draw({seed:'player'}),true);assert.equal(r.calls.some(c=>c[0]==='clip'),false);assert.deepEqual(r.calls.find(c=>c[0]==='drawImage').slice(2),[-20,-40,40,80]);});
test('uploaded photos receive a thin player-color ring while mascots do not',()=>{const r=runtime([200,100]);r.draw({avatar:'/api/avatar/photo',color:'#46cfd8'});assert.equal(r.ctx.strokeStyle,'#46cfd8');assert.equal(r.ctx.lineWidth,2);assert.deepEqual(r.calls.filter(c=>c[0]==='arc').at(-1).slice(1),[0,0,39,0,Math.PI*2]);assert.equal(r.calls.filter(c=>c[0]==='stroke').length,1);const mascot=runtime([100,200]);mascot.draw({seed:'player',color:'#46cfd8'});assert(!mascot.calls.some(c=>c[0]==='stroke'));});
