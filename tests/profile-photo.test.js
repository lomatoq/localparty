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
