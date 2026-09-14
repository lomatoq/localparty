'use strict';
const fs=require('node:fs'),path=require('node:path');const root=path.resolve(__dirname,'..');
function edit(file,fn){const p=path.join(root,file),s=fs.readFileSync(p,'utf8'),n=fn(s);if(s!==n)fs.writeFileSync(p,n);}
function r(s,a,b){if(s.includes(b))return s;if(!s.includes(a))throw Error('Pass2 anchor missing: '+a.slice(0,70));return s.replace(a,b);}
edit('games/afterparty/public/sports-view.js',s=>{
 s=r(s,'cameraPlan,damp,clamp,BoundedEffects','cameraPlan,fitCamera,focusPoints,FrameBudget,damp,clamp,BoundedEffects');
 s=r(s,"this.quality='auto';","this.quality='auto';this.budget=new FrameBudget();this.dirty=true;");
 s=r(s,'setState(s){this.state=s;','setState(s){if(this.state?.phase!==s.phase||this.state?.state!==s.state||this.state?.rackId!==s.rackId)this.dirty=true;this.state=s;');
 s=r(s,"if(now-this.renderAt<(this.low?65:15))return;this.renderAt=now;", "const idle=s.phase==='waiting'||paused;if(!this.dirty&&now-this.renderAt<(idle?500:this.low?90:16))return;const frameMS=this.renderAt?now-this.renderAt:16;this.renderAt=now;this.dirty=false;if(!idle&&this.quality==='auto'&&!this.low&&this.budget.sample(frameMS,now))this.resize();");
 s=r(s,'cameraPlan(this.mode,s,this.overview||this.reduced)','cameraPlan(this.mode,s,this.overview||this.reduced,this.camera.aspect)');
 s=r(s,"this.camera.lookAt(this.look);\n  this.fx.tick(step);", "if(!this.overview&&!this.reduced&&s.state==='rolling'){const fitted=fitCamera({position:this.camera.position.toArray(),target:this.look.toArray(),fov:this.camera.fov},focusPoints(this.mode,s),this.camera.aspect);this.camera.position.set(...fitted.position);}\n  this.camera.lookAt(this.look);\n  this.fx.tick(step);");
 s=r(s,'setOverview(value){this.overview=value;}','setOverview(value){this.overview=value;this.dirty=true;}');
 s=r(s,"this.renderer.setPixelRatio(low?Math.min(1,720/w):Math.min(devicePixelRatio||1,1.5));", "this.renderer.setPixelRatio(low?Math.min(1,600/w):Math.min(devicePixelRatio||1,1.5)*(this.quality==='auto'?this.budget.scale:1));this.dirty=true;");
 return s;
});
// A stalled/background tab must not reconnect an otherwise healthy lobby after 1.8s.
edit('public/app.js',s=>r(s,'pongTimer=setTimeout(reopen,1800);','pongTimer=setTimeout(()=>{if(document.hidden)return;reopen();},8000);'));
// Debounce deadline jitter: rendering sixty complete shell HUDs per second is unnecessary.
edit('lib/party-runtime.js',s=>r(s,'const signature=JSON.stringify({...next,serverNow:0});','if(Number.isFinite(next.endsAt))next.endsAt=Math.round(next.endsAt/50)*50;\n const signature=JSON.stringify({...next,serverNow:0});'));
edit('tests/polish-browser.cjs',s=>{
 s=r(s,"'--disable-dev-shm-usage']","'--disable-dev-shm-usage','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows']");
 s=r(s,'width:1440,height:1000','width:1280,height:800');
 s=r(s,"host.on('pageerror',e=>errors.push({game:current,screen:'host',message:e.message}));", "host.on('pageerror',e=>errors.push({game:current,screen:'host',message:e.message}));host.on('websocket',s=>{s.on('framereceived',e=>{try{const m=JSON.parse(String(e.payload));if(m.type==='error')console.log('HOST_PROTOCOL_ERROR',JSON.stringify(m));}catch{}});});");
 s=r(s,"p.on('pageerror',e=>errors.push({game:current,screen:'phone'+i,message:e.message}));", "p.on('pageerror',e=>errors.push({game:current,screen:'phone'+i,message:e.message}));p.on('websocket',socket=>{const route=socket.url().includes('/lobby')?'lobby':'game';socket.on('framereceived',e=>{try{const m=JSON.parse(String(e.payload));if(['joined','join_error','error','replaced'].includes(m.type))console.log('PHONE_PROTOCOL',i,route,m.type,m.data?.id||m.id||'',m.message||'');}catch{}});socket.on('close',()=>console.log('PHONE_SOCKET_CLOSED',i,route));});");
 s=r(s,"for(const p of phones){await p.bringToFront();await p.waitForFunction", "for(const p of phones){await p.waitForFunction");
 s=r(s,"for(const p of phones){await p.bringToFront();await p.locator('#readyButton')", "for(const p of phones){await p.locator('#readyButton')");
 s=r(s,"await host.bringToFront();\n    const frame", "console.log('READY_BUTTONS_CLICKED',mode);\n    const frame");
 s=r(s,"entry.error=e.message;console.error", "entry.error=e.stack;console.error");
 s=r(s,"fs.writeFileSync(path.join(OUT,'server.log'),logs.join(''));", "fs.writeFileSync(path.join(OUT,'server.log'),logs.join(''));console.log('SERVER_LOG_TAIL',logs.join('').slice(-4000));");
 return s;
});
console.log('Pass2 applied: dynamic safe framing, adaptive resolution, reduced idle work, stable reconnects');
