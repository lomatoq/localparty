'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const root=path.resolve(__dirname,'../..'),engine=process.env.QA_ENGINE||'chromium',out=path.join(root,'output/playwright/performance244/canvas/pixels-'+engine);fs.mkdirSync(out,{recursive:true});
const files={'/before.mjs':path.join(root,'.localparty-build/perf244/canvas-before/games/bow_club/public/src/mini3d.mjs'),'/after.mjs':path.join(root,'games/bow_club/public/src/mini3d.mjs')};
const server=http.createServer((req,res)=>{if(files[req.url]){res.setHeader('Content-Type','text/javascript');res.end(fs.readFileSync(files[req.url]));}else{res.setHeader('Content-Type','text/html');res.end('<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#222}canvas{display:inline-block;vertical-align:top}</style>');}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;try{
 browser=await(engine==='webkit'?webkit:chromium).launch({headless:true,...(engine==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{})});const page=await browser.newPage({viewport:{width:1000,height:900},deviceScaleFactor:3}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port);
 const result=await page.evaluate(async()=>{
  const before=await import('/before.mjs'),after=await import('/after.mjs'),make=M=>{const c=document.createElement('canvas');document.body.append(c);return new M.Bow3D(c);},a=make(before),b=make(after),states=[];
  for(const [w,h,pull,hand,kick]of[[320,568,0,'right',0],[393,780,.48,'right',0],[393,780,1,'left',0],[780,393,0,'left',0],[393,780,0,'right',1]]){
   if(kick){a.shoot();b.shoot();}a.canvas.style.width=b.canvas.style.width=w+'px';a.canvas.style.height=b.canvas.style.height=h+'px';a.frame(w,h,pull,1000,1/60,hand);b.frame(w,h,pull,1000,1/60,hand);
   if(a.software||b.software)throw Error('Pixel proof needs actual WebGL; software fallback is separate');const read=r=>{const pixels=new Uint8Array(r.canvas.width*r.canvas.height*4);r.gl.readPixels(0,0,r.canvas.width,r.canvas.height,r.gl.RGBA,r.gl.UNSIGNED_BYTE,pixels);return pixels;},x=read(a),y=read(b);let changed=0,max=0,ink=0;for(let i=0;i<x.length;i++){if(x[i]!==y[i])changed++;max=Math.max(max,Math.abs(x[i]-y[i]));if(i%4===3&&x[i])ink++;}
   states.push({w,h,pull,hand,kick,changedChannelValues:changed,maxDifference:max,opaquePixels:ink,backing:[a.canvas.width,a.canvas.height]});
  }
  // Repeat unchanged geometry, then force real WebGL context loss/restoration.
  a.frame(393,780,0,2000,1,'right');b.frame(393,780,0,2000,1,'right');const extension=b.gl.getExtension('WEBGL_lose_context');if(extension){await new Promise(resolve=>{b.canvas.addEventListener('webglcontextlost',resolve,{once:true});extension.loseContext();});await new Promise(resolve=>{b.canvas.addEventListener('webglcontextrestored',resolve,{once:true});setTimeout(()=>extension.restoreContext(),80);});b.frame(393,780,0,2016,1/60,'right');const err=b.gl.getError();if(err!==b.gl.NO_ERROR)throw Error('Restored renderer GL error '+err);}
  return{method:'Deterministic authored Bow3D states in real WebGL, exact readPixels comparison; not a game/camera/device profile',states,contextRestore:!!extension};
 });for(const s of result.states){assert(s.opaquePixels>1000,'Artwork must really render');assert.equal(s.changedChannelValues,0,'Before/final pixel identity for '+JSON.stringify(s));}assert.deepEqual(errors,[]);await page.screenshot({path:path.join(out,'before-after.png')});fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({...result,engine,errors},null,2)+'\n');console.log(JSON.stringify(result));
}finally{await browser?.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
