const test=require('node:test'),assert=require('node:assert/strict');
const data=require('../games/arcade_deluxe/public/assets/pocket-projectiles.json'),reference=require('../games/arcade_deluxe/core/pocket-reference.generated.json');
test('projectile artwork is attached only to exact animated source nodes',()=>{
 const expectedNodes=reference.weapons.flatMap(w=>w.chain.filter(n=>['BULLET','CRUISER'].includes(n.type)&&/\.(bmp|png)/i.test(n.values.DRAW_ANIM||'')).map(n=>`${w.id}/${n.type}/${n.name}`));
 assert.deepEqual(Object.keys(data.nodes).sort(),expectedNodes.sort());for(const [key,p] of Object.entries(data.nodes)){const [id,type,name]=key.split('/'),node=reference.weapons.find(w=>w.id===id).chain.find(n=>n.type===type&&n.name===name);assert(node);const expected=node.values.DRAW_ANIM.replaceAll('\\','/').toLowerCase().split(/\s+/).filter(s=>/\.(bmp|png)$/.test(s));assert.deepEqual(p.frames,expected);assert.equal(p.rotate,node.values.DRAW_ANIM_ROTATE===true);assert.equal(p.fps,Number(node.values.DRAW_ANIM_SPEED)||0);}
 assert(!data.nodes['burn_barrel/FIRE/BurnBarrelBulletFire']);assert(!data.nodes['twist_rockets/BULLET/TwistRocketsBullet']);
});
test('source bitmap dimensions are retained without enlarging all particles',()=>{
 for(const [name,size] of Object.entries({'ac/barrel0001.bmp':[13,13],'qu/oilbarrel0001.bmp':[13,13],'hmissile01.bmp':[9,14],'bl/boostermissile.bmp':[11,23],'na/phasemissile0001.bmp':[15,15],'pw/lmissile0001.bmp':[20,20],'cannonball.bmp':[11,11]}))assert.deepEqual([data.frames[name].w,data.frames[name].h],size);
 assert.equal(data.pixelScale,1);for(const f of Object.values(data.frames)){assert(f.w<=1024&&f.h<=1024);if(f.png){assert.equal(Buffer.from(f.png,'base64').subarray(0,8).toString('hex'),'89504e470d0a1a0a');}else{assert.equal(f.pixels.length,f.w*f.h);assert(f.pixels.every(p=>Array.isArray(f.colors[p])));}}
 assert.equal(data.nodes['burn_barrel/BULLET/BurnBarrelBullet'].yOffset,6);assert.equal(data.nodes['burn_barrel/CRUISER/BurnBarrelCruise'].yOffset,9);
});
