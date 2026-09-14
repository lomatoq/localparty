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

test('motion runtime observes presentation only',()=>{
 const js=fs.readFileSync(path.join(root,'public','motion.js'),'utf8');
 assert(js.includes('MutationObserver'));
 assert(js.includes("prefers-reduced-motion: reduce"));
 for(const forbidden of ['WebSocket','fetch(','postMessage(','pointerdown','touchstart'])assert(!js.includes(forbidden),forbidden);
});

test('launcher serves the shared motion assets to lobby and game iframes',()=>{
 const server=fs.readFileSync(path.join(root,'server.js'),'utf8');
 assert(server.includes("'/motion.css':'motion.css'"));
 assert(server.includes("'/motion.js':'motion.js'"));
});
