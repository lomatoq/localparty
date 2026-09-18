'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const pc=read('public/index.html'),tv=read('public/tv.html'),css=read('public/motion.css');
function card(html,id,tag){return html.match(new RegExp(`<${tag} id="${id}"[\\s\\S]*?<\\/${tag}>`))[0];}
test('TV invitation reuses desktop title, instructions and shared card classes',()=>{
 const a=card(pc,'joinDialog','dialog'),b=card(tv,'tvLargeInvite','section');
 for(const text of ['ЕЩЁ ЕСТЬ МЕСТО','Залетай<br><em>в компанию.</em>','Подключись к тому же Wi-Fi и открой камерой телефона.','lp-join-card','lp-join-qr','lp-join-address','desktop-card-20260918.2']){assert(a.includes(text),text);assert(b.includes(text),text);}
 assert(!b.includes('<button'));assert(a.includes('copyDialogAddress'));assert(a.includes('closeJoin'));
});
test('desktop and TV share the surface styling rather than a TV-only imitation',()=>{
 assert(css.includes(':is(#joinDialog,#tvLargeInvite).lp-join-card'));
 assert(!read('public/tv-show.css').includes('.tv-invite-card'));
 assert(css.includes('aspect-ratio:1'));assert(css.includes('object-fit:contain'));
});
test('podium spacing scales with occupied seats and preserves the full crowd cap',()=>{
 assert(read('public/tv-show.css').includes('max-width:min(1080px,calc(var(--seats,3)*210px + (var(--seats,3) - 1)*14px))'));
 assert(read('public/tv-show.js').includes('rows.slice(7)'));
});
test('return hint is guest-only with no claim to discover changed local addresses',()=>{
 assert.equal((pc.match(/class="return-entry-help"/g)||[]).length,1);
 assert(css.includes('body.guest-catalog:not(.native-controller) .return-entry-help'));
 assert(pc.includes('Если адрес ведущего изменился, открой новый QR'));
 assert(!pc.includes('type="text" inputmode="numeric"'));
});
