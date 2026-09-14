const test=require('node:test'),assert=require('node:assert/strict');
const layout=require('../public/tv-layout');

test('720p, Full HD, 4K and 5K use the same logical game viewport and proportional UI',()=>{
 const base=layout(1280,720);
 for(const factor of [1,1.5,2,3,4]){
  const scene=layout(1280*factor,720*factor);
  assert.equal(scene.width,base.width);assert.equal(scene.height,base.height);
  assert.equal(scene.scale,factor);assert.equal(scene.left,0);assert.equal(scene.top,0);
 }
});
test('Mac, 4:3 and ultrawide screens adapt without cropping or stretching',()=>{
 for(const [width,height] of [[3024,1964],[2560,1600],[1024,768],[3440,1440],[5120,1440],[1080,1920]]){
  const scene=layout(width,height),w=scene.width*scene.scale,h=scene.height*scene.scale;
  assert.ok(scene.width>=960&&scene.width<=1680);assert.equal(scene.height,720);
  assert.ok(scene.left>=-1e-8&&scene.top>=-1e-8);
  assert.ok(w<=width+1e-8&&h<=height+1e-8);
  assert.ok(Math.abs(2*scene.left+w-width)<1e-8);
  assert.ok(Math.abs(2*scene.top+h-height)<1e-8);
  assert.ok(Math.min(Math.abs(width-w),Math.abs(height-h))<1e-8);
 }
});
