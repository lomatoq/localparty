const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'server.js'),'utf8');
const begin=source.indexOf('function transform('),end=source.indexOf('\nconst handler=',begin);
const context={fs,path,__dirname:root,APP_HEAD:'',cssFallbacks:x=>x};
vm.runInNewContext(source.slice(begin,end)+'\nthis.transformHTML=transform;',context);

test('managed sports HTML preserves real shared artwork and scopes game-owned resources',()=>{
 const shared=['/assets/icons/game-pack/mute.svg','/assets/icons/game-pack/switch.svg','/assets/icons/game-pack/arrow-up.svg','/assets/icons/atlas-stat-glyphs/pin.webp','/assets/icons/atlas-stat-glyphs/hit.webp','/assets/gameplay/sports-siege/sprites/turret-pulse.webp'];
 const input='<html><head><link href="/style.css"></head><body>'+shared.map(src=>`<img src="${src}?v=118">`).join('')+'<img src="/assets/atlas-sports/bowling-ball-lime.webp"><img src="assets/atlas-sports/broom.webp"><img src="https://example.test/photo.png"></body></html>';
 const result=context.transformHTML(input,'text/html','/games/bowling',{});
 for(const src of shared){assert.ok(fs.existsSync(path.join(root,'public',src)));assert.ok(result.includes(`src="${src}?v=118"`),src);}
 assert.ok(result.includes('href="/games/bowling/style.css"'));
 assert.ok(result.includes('src="/games/bowling/assets/atlas-sports/bowling-ball-lime.webp"'));
 assert.ok(result.includes('src="assets/atlas-sports/broom.webp"'));
 assert.ok(result.includes('src="https://example.test/photo.png"'));
 assert.ok(result.includes('<base href="/games/bowling/">'));
});
