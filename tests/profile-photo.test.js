'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {normalizeAvatar,MAX_AVATAR_BYTES}=require('../lib/profile-store');

test('profile photos accept bounded JPEG, PNG and WebP data URLs',()=>{
 assert.equal(normalizeAvatar('data:image/jpeg;base64,/9j/2Q=='),'data:image/jpeg;base64,/9j/2Q==');
 assert.match(normalizeAvatar('data:image/png;base64,iVBORw0KGgo='),/^data:image\/png/);
 assert.match(normalizeAvatar('data:image/webp;base64,UklGRgAAAABXRUJQ'),/^data:image\/webp/);
});

test('profile photos reject spoofed formats and oversized payloads',()=>{
 assert.throws(()=>normalizeAvatar('data:image/jpeg;base64,iVBORw0KGgo='),/повреждён/);
 assert.throws(()=>normalizeAvatar('data:text/html;base64,PGgxPg=='),/JPEG/);
 const tooLarge=Buffer.alloc(MAX_AVATAR_BYTES+1);tooLarge[0]=0xff;tooLarge[1]=0xd8;tooLarge[2]=0xff;
 assert.throws(()=>normalizeAvatar('data:image/jpeg;base64,'+tooLarge.toString('base64')),/слишком большое/);
});


test('reconnect avoids disk writes while avatar changes remain persistent',()=>{
 const {ProfileStore}=require('../lib/profile-store');const store=new ProfileStore(null);let writes=0;store.save=()=>writes++;
 const first=store.register(null,'Player','right',null);assert.equal(writes,1);
 store.register(first.token,'Player','right',null);assert.equal(writes,1);
 store.register(first.token,'Player','right','data:image/jpeg;base64,/9j/2Q==');assert.equal(writes,2);
 store.register(first.token,'Player','right');assert.equal(writes,2);assert.ok(first.avatar);
 store.register(first.token,'Player','right',null);assert.equal(writes,3);assert.equal(first.avatar,null);
});
