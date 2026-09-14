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
edit('public/app.js',s=>r(s,'pongTimer=setTimeout(reopen,1800);','pongTimer=setTimeout(()=>{if(document.hidden)return;reopen();},8000);'));
edit('lib/party-runtime.js',s=>r(s,'const signature=JSON.stringify({...next,serverNow:0});','if(Number.isFinite(next.endsAt))next.endsAt=Math.round(next.endsAt/50)*50;\n const signature=JSON.stringify({...next,serverNow:0});'));
edit('tests/polish-browser.cjs',s=>{
 s=r(s,"if(m.type==='joined'&&kind==='game')", "if(m.type==='game-ui'&&data.lobby?.active?.instance===m.instance)data.lobby.active.ui=m.ui;\n   if(m.type==='joined'&&kind==='game')");
 s=r(s,"await f.locator('#ap-power').fill('.70');await f.locator('#ap-power').dispatchEvent('input');", "await f.locator('#ap-power').evaluate(el=>{el.value='.70';el.dispatchEvent(new Event('input',{bubbles:true}));});");return s;
});
console.log('Pass2 applied: dynamic safe framing, adaptive resolution, reduced idle work, stable reconnects');
