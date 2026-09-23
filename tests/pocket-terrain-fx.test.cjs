const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
test('authored dirt bursts retain source brown palette instead of generic green',async()=>{
 // The particle allocator does not need a DOM. Stub only the separate plasma renderer.
 const source=fs.readFileSync('games/arcade_deluxe/public/siege-fx.js','utf8').replace("import {PocketPlasma} from './pocket-plasma.js';",'class PocketPlasma {emit(){return false;} clear(){}}');
 const {SiegeFX}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 const fx=new SiegeFX();fx.setWeapons({mud_pie:{fx:{colors:['#11ff00'],commandTypes:['DIRTBALL']}}});
 const colors=['#472f00','#924700'];
 fx.emit({id:1,kind:'blast',x:300,y:300,r:24,weapon:'mud_pie',family:'dirt',color:colors[1],terrainMaterial:colors,fxStages:[['D',0,0,0,0,0,24,.4]]});
 const chunks=fx.items.filter(p=>p.kind==='chunk');assert(chunks.length>4);assert(chunks.every(p=>colors.includes(p.color)));
 fx.clear();fx.emit({id:2,kind:'blast',x:300,y:300,r:24,weapon:'mud_pie',family:'dirt',color:'#ff0000',terrainMaterial:['#ff0000','#ffff00'],fxStages:[['D',0,0,0,0,0,24,.4]]});
 assert(fx.items.filter(p=>p.kind==='chunk').every(p=>['#ff0000','#ffff00'].includes(p.color)),'other dirt colors must not become brown');
});
