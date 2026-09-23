const test=require('node:test'),assert=require('node:assert/strict');
const {board}=require('./fixtures/bow/camera.cjs');
test('real portrait RGBA camera frames acquire the board, including uneven exposure',async()=>{
 const {MarkerTracker}=await import('../games/bow_club/public/src/marker-tracker.mjs');
 for(const shade of [false,true]){const f=await board({shade}),r=new MarkerTracker().detect(f.pixels,f.width,f.height);assert.ok(r,'720x1280 portrait must be processed');assert.equal(r.tags.length,4);assert.ok(Math.abs(r.uv.u-.5)<.015);assert.ok(Math.abs(r.uv.v-.5)<.015);}
});
test('two visible tags maintain a locked board but cannot acquire it from scratch',async()=>{
 const {MarkerTracker}=await import('../games/bow_club/public/src/marker-tracker.mjs'),t=new MarkerTracker();const full=await board(),half=await board({missing:[2,3]});
 assert.equal(t.detect(half.pixels,half.width,half.height),null);assert.ok(t.detect(full.pixels,full.width,full.height));
 for(let i=0;i<5;i++){const r=t.detect(half.pixels,half.width,half.height);assert.ok(r);assert.equal(r.tags.length,2);assert.ok(Math.abs(r.uv.u-.5)<.015);}
 const blank=new Uint8ClampedArray(full.pixels.length).fill(255);assert.equal(t.detect(blank,full.width,full.height),null);
});
