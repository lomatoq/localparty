const fs=require('node:fs');
const path=require('node:path');
const test=require('node:test');
const assert=require('node:assert/strict');

const root=path.resolve(__dirname,'..');

test('launcher injects the shared motion system into every proxied game',()=>{
 const server=fs.readFileSync(path.join(root,'server.js'),'utf8');
 assert(server.includes('<link rel="stylesheet" href="/motion.css">'));
 assert(server.includes('<script defer src="/motion.js"></script>'));
 const shell=fs.readFileSync(path.join(root,'public','index.html'),'utf8');
 assert(shell.includes('/motion.css'));
 assert(shell.includes('/motion.js'));
});

test('motion styles define tokens and a strict reduced-motion exit',()=>{
 const css=fs.readFileSync(path.join(root,'public','motion.css'),'utf8');
 for(const token of ['--motion-fast','--motion-base','--motion-slow','--motion-stagger','--motion-ease-pop'])assert(css.includes(token),token);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)[\s\S]*animation:none!important/);
 assert.doesNotMatch(css,/width\s*:\s*\d+px[^}]*\.joystick/i);
});

test('motion runtime only changes presentation and scoped native feedback',()=>{
 const js=fs.readFileSync(path.join(root,'public','motion.js'),'utf8');
 assert(js.includes('MutationObserver'));
 assert(js.includes("prefers-reduced-motion: reduce"));
 // Pointer observers now implement user-requested visual pressure. They may not
 // capture, cancel or synthesize gameplay input. Native haptics are not game commands.
 for(const forbidden of ['WebSocket','fetch(','ws.send(','.preventDefault(','.stopPropagation(','.setPointerCapture(','.click(','touchstart'])assert(!js.includes(forbidden),forbidden);
 const calls=[...js.matchAll(/([\w?.]+)postMessage\(([^\n;]+)\)/g)];
 assert.equal(calls.length,2,'only prepare and short UI impact may use WK messaging');
 for(const [,receiver,payload] of calls){
  assert.equal(receiver,'window.webkit?.messageHandlers?.partyShell?.');
  assert.match(payload,/^\{type:'haptic(?:-prepare)'\}$|^\{type:'haptic',pattern\}$/);
 }
 assert.match(js,/if\(document.body.classList.contains\('native-shell'\)\)/);
 assert.match(js,/!e.isTrusted/);
 assert.match(js,/capture:true,passive:true/);
 assert.match(js,/window!==window.top/);
 assert.match(js,/pointercancel/);
 assert.match(js,/data-joystick/);
});

test('launcher serves the shared motion assets to lobby and game iframes',()=>{
 const server=fs.readFileSync(path.join(root,'server.js'),'utf8');
 assert(server.includes("'/motion.css':'motion.css'"));
 assert(server.includes("'/motion.js':'motion.js'"));
});
