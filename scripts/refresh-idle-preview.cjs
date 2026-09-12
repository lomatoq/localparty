// Refresh the known preview only while it is idle and serving this checkout.
const fs=require('fs'),path=require('path'),{spawn}=require('child_process'),WebSocket=require('ws');
(async()=>{
 const pid=Number(process.argv[2]);if(!Number.isInteger(pid)||pid<1)throw Error('Explicit preview PID required');
 const base='http://127.0.0.1:59435';
 const served=await(await fetch(base+'/app.js')).text();
 if(served!==fs.readFileSync(path.join(__dirname,'../public/app.js'),'utf8'))throw Error('Preview is not serving this checkout');
 const state=await new Promise((resolve,reject)=>{const ws=new WebSocket('ws://127.0.0.1:59435/lobby');const timeout=setTimeout(()=>{ws.close();reject(Error('No state'));},3000);ws.on('error',reject);ws.on('message',d=>{const m=JSON.parse(d);if(m.type==='state'){clearTimeout(timeout);ws.close();resolve(m);}});});
 if(state.active)throw Error('Preview has active game; leave it running');
 process.kill(pid);
 await new Promise(r=>setTimeout(r,1000));
 const root=path.join(__dirname,'..'),out=fs.openSync(path.join(root,'tests/quick-test.log'),'a'),err=fs.openSync(path.join(root,'tests/quick-test-error.log'),'a');
 const child=spawn(process.execPath,[path.join(root,'server.js')],{cwd:root,env:{...process.env,PARTY_PORT:'59435',PARTY_NO_BROWSER:'1',PARTY_DEV:'1'},detached:true,windowsHide:true,stdio:['ignore',out,err]});child.unref();fs.closeSync(out);fs.closeSync(err);
 for(let i=0;i<40;i++){try{if((await(await fetch(base+'/api/health')).json()).ok){console.log('Current preview ready',child.pid,base+'/host');return;}}catch{}await new Promise(r=>setTimeout(r,250));}
 throw Error('Preview startup failed; see tests/quick-test-error.log');
})().catch(e=>{console.error(e.message);process.exitCode=1});
