'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {spawn}=require('node:child_process');
const QRCode=require('qrcode');
const {ClipInvitation,validateInvitation}=require('../lib/clip-invitation');
const {presentation}=require('../public/tv-invitation');
const room='https://room.lancert.dev:8080/';
const payload={version:1,ssid:'Guest fixture café',password:'fixture-password',security:'WPA',room};
const invitation=data=>'https://appclip.apple.com/id?p=com.localparty.launcher.Join&join='+Buffer.from(JSON.stringify(data)).toString('base64url');
const url=invitation(payload);
test('TV invitations validate Clip identity, payload boundaries and current host room',()=>{
 assert.equal(validateInvitation(url,room),url);
 for(const bad of [url+'&p=com.localparty.launcher.Join',url+'&join=a',url+'&extra=1',url.replace('p=com.localparty.launcher.Join','p=other.Clip'),url.replace('appclip.apple.com','example.com'),url.replace('https:','http:'),url+'#fragment'])assert.throws(()=>validateInvitation(bad,room));
 for(const bad of [{version:2},{room:'https://other.lancert.dev:8080/'},{ssid:''},{ssid:'é'.repeat(17)},{ssid:'A\nB'},{password:'short'},{password:'a'.repeat(64)},{security:'WEP'},{security:'nopass',password:'not empty'}])assert.throws(()=>validateInvitation(invitation({...payload,...bad}),room));
 assert.equal(validateInvitation(invitation({...payload,security:'nopass',password:''}),room),invitation({...payload,security:'nopass',password:''}));
 assert.throws(()=>validateInvitation(url,'https://other.lancert.dev:8080/'));
 assert.throws(()=>validateInvitation('x'.repeat(3073),room));
});
test('ephemeral TV QR encodes the exact invitation and expires on clear/address changes',async()=>{
 const value=new ClipInvitation();value.set({url,room},room,'192.168.1.2');
 const metadata=value.metadata(room,'192.168.1.2');assert.deepEqual(Object.keys(metadata),['mode','revision']);
 assert(!JSON.stringify(value).includes(payload.password));assert(!JSON.stringify(metadata).includes('join='));
 assert.deepEqual(await value.image(metadata.revision),await QRCode.toBuffer(url,{margin:2,width:240,errorCorrectionLevel:'M'}));
 assert.deepEqual(await value.image(metadata.revision,true),await QRCode.toBuffer(url,{margin:2,width:720,errorCorrectionLevel:'M'}));
 assert.equal(await value.image('expired'),null);
 assert.equal(value.metadata(room,'192.168.1.3'),null);assert.equal(await value.image(metadata.revision),null);
 value.set({url,room},room,'192.168.1.2');assert.equal(value.metadata('','192.168.1.2'),null);
 value.set({url,room},room,'192.168.1.2');value.clear();assert.equal(value.metadata(room,'192.168.1.2'),null);
});
test('both TV QR sizes switch by revision, preserve room label and fall back to LAN',()=>{
 const state={networkEnabled:true,urls:[room]},revision='aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
 assert.equal(presentation(state).src,'/api/qr?url='+encodeURIComponent(room));
 state.invitation={mode:'appclip',revision};
 assert.equal(presentation(state).src,'/api/invite-qr?revision='+revision);
 assert.equal(presentation(state,true).src,'/api/invite-qr?revision='+revision+'&size=large');
 assert.equal(presentation(state).room,room);assert.equal(presentation(state).appclip,true);
 state.invitation.mode='appclip-beta';assert.equal(presentation(state).appclip,true);
 assert.match(presentation(state).hint,/TestFlight.*inside it/);
 state.invitation.revision='credential text';assert.equal(presentation(state).appclip,false);
 state.networkEnabled=false;assert.equal(presentation(state).src,'');
});
test('explicit beta TV mode is labelled as in-Clip scanning, with no credential metadata',()=>{
 const value=new ClipInvitation();value.set({url,room,beta:true},room,'192.168.1.2');
 const metadata=value.metadata(room,'192.168.1.2');assert.equal(metadata.mode,'appclip-beta');
 assert.deepEqual(Object.keys(metadata),['mode','revision']);assert(!JSON.stringify(metadata).includes(payload.password));
 value.clear();assert.equal(value.metadata(room,'192.168.1.2'),null);
});
test('real server protects invitation commands/images and never broadcasts or persists credentials',{timeout:20000},async()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'heypals-tvclip-'));
 const root=path.resolve(__dirname,'..'),preload=path.join(directory,'fixture.cjs'),dataFile=path.join(directory,'party.json');
 // Test fixture supplies a LAN scope without contacting Lancert or changing Wi-Fi.
 fs.writeFileSync(preload,`const os=require('node:os');os.networkInterfaces=()=>({en0:[{family:'IPv4',internal:false,address:'192.168.88.2'}]});
 const http=require('node:http'),original=http.createServer;http.createServer=function(handler){return original.call(this,(req,res)=>{if(req.headers['x-qa-public']==='1')req.partyPublic=true;handler(req,res);});};
 require.cache[${JSON.stringify(path.join(root,'lib/lancert-https.js'))}]={exports:{createLANHTTPS:()=>({forAddress:async()=>null})}};
 require.cache[${JSON.stringify(path.join(root,'lib/network-access.js'))}]={exports:{NetworkAccess:class{constructor(){this.enabled=false;this.hostname='';this.port=0;this.boundAddress='';}async setEnabled(on){this.enabled=on;this.hostname=on?'room.lancert.dev':'';this.port=on?8080:0;this.boundAddress=on?'192.168.88.2':'';}}}};
 `);
 const child=spawn(process.execPath,['--require',preload,'server.js'],{cwd:root,env:{...process.env,PARTY_EMBEDDED:'1',PARTY_INTERNAL_PORT:'0',PARTY_PORT:'0',PARTY_NO_BROWSER:'1',PARTY_EPHEMERAL:'0',PARTY_DATA_FILE:dataFile,PARTY_ADMIN_KEY:'clip-fixture-key'}});
 let log='',ws;child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 try{
  for(let i=0;i<150&&!/localhost:(\d+)/.test(log);i++){if(child.exitCode!==null)break;await wait(50);}
  assert.match(log,/localhost:(\d+)/,'fixture server started');const origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
  const post=async(command,headers={})=>fetch(origin+'/api/manage',{method:'POST',headers:{Authorization:'Bearer clip-fixture-key','Content-Type':'application/json',...headers},body:JSON.stringify(command)});
  assert.equal((await post({type:'join-invitation-set',room,url})).status,400,'sharing must be enabled');
  assert.equal((await post({type:'network-set',enabled:true})).status,200);
  const command={type:'join-invitation-set',room,url};
  assert.equal((await post(command,{Authorization:'Bearer wrong'})).status,403);
  assert.equal((await post(command,{'x-qa-public':'1'})).status,403,'public listener cannot issue commands');
  const WebSocket=require('ws');ws=new WebSocket(origin.replace('http:','ws:')+'/lobby');const messages=[];ws.on('message',raw=>messages.push(raw.toString()));await new Promise((resolve,reject)=>{ws.once('open',resolve);ws.once('error',reject);});
  const response=await post(command);assert.equal(response.status,200);const state=await response.json(),revision=state.invitation.revision;
  assert.equal(state.invitation.mode,'appclip');assert(!JSON.stringify(state).includes(payload.password));assert(!JSON.stringify(state).includes('join='));
  const imagePath='/api/invite-qr?revision='+revision;
  assert.equal((await fetch(origin+imagePath,{headers:{'x-qa-public':'1'}})).status,403);
  const tv=await fetch(origin+'/tv'),cookie=tv.headers.get('set-cookie').split(';')[0],html=await tv.text();assert(html.indexOf('/tv-invitation.js')<html.indexOf('/tv-show.js'));
  const image=await fetch(origin+imagePath,{headers:{'x-qa-public':'1',Cookie:cookie}});assert.equal(image.status,200);assert.equal(image.headers.get('cache-control'),'no-store');assert.equal(image.headers.get('content-type'),'image/png');
  assert.deepEqual(Buffer.from(await image.arrayBuffer()),await QRCode.toBuffer(url,{margin:2,width:240,errorCorrectionLevel:'M'}));
  assert.equal((await fetch(origin+'/api/invite-qr?revision=expired')).status,404);
  assert.equal((await post({type:'select',id:state.catalog[0].id})).status,200);
  await wait(50);assert(messages.some(raw=>raw.includes(revision)));assert(!messages.join('').includes(payload.password));assert(!messages.join('').includes('join='));
  const saved=fs.readFileSync(dataFile,'utf8');assert(!saved.includes(payload.password));assert(!saved.includes(payload.ssid));assert(!saved.includes('join-invitation-set'));
  assert.equal((await post({type:'join-invitation-clear'})).status,200);assert.equal((await fetch(origin+imagePath)).status,404);
  const reset=await post(command);assert.equal(reset.status,200);const next=(await reset.json()).invitation.revision;assert.notEqual(next,revision);
  await post({type:'network-set',enabled:false});assert.equal((await fetch(origin+'/api/invite-qr?revision='+next)).status,404);
  assert(!log.includes(payload.password));assert(!log.includes(payload.ssid));
 }finally{ws?.terminate();child.kill();await new Promise(resolve=>{if(child.exitCode!==null)resolve();else child.once('exit',resolve);});fs.rmSync(directory,{recursive:true,force:true});}
});
