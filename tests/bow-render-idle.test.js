'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('Bow Club only renders its static 3D scene when targets, arrows or viewport change',()=>{
 const source=fs.readFileSync(require.resolve('../games/bow_club/public/src/range-scene.mjs'),'utf8');
 const Frame=vm.runInNewContext('(class {'+source.slice(source.indexOf(' frame(targets,'),source.lastIndexOf('\n}'))+'})');
 const scene=new Frame();let renders=0,layouts=0,arrows=0;
 Object.assign(scene,{renderer:{setSize(){},render(){renders++;}},camera:{updateProjectionMatrix(){}},arrowIds:new Set(),layout(){layouts++;},clear(){},addArrow(){arrows++;}});
 for(let i=0;i<100;i++)scene.frame([],[],1,1280,720);
 assert.equal(renders,1,'Identical frames must not redraw lighting/shadow maps');assert.equal(layouts,1);
 const hits=[{id:'hit-1'}];scene.frame([],hits,1,1280,720);assert.equal(renders,2);assert.equal(arrows,1);
 scene.frame([],hits,1,1280,720);assert.equal(renders,2);
 scene.frame([],hits,1,1920,1080);assert.equal(renders,3);assert.equal(layouts,2);
 scene.frame([],[],2,1920,1080);assert.equal(renders,4);assert.equal(scene.arrowIds.size,0);
});
