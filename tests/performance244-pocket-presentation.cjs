'use strict';
// Explicit paired snapshot fixtures compare final presentation against saved
// approved source. Real worker, native-route and input timing are measured
// separately by performance244-deluxe.cjs.
const assert=require('node:assert/strict'),path=require('node:path'),{spawn}=require('node:child_process');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const root=path.resolve(__dirname,'..'),before=path.join(root,'output/playwright/performance244/deluxe/before-source');
(async()=>{
 const child=spawn(process.execPath,['games/arcade_deluxe/server.js','pocket_siege'],{cwd:root,env:{...process.env,ARCADE_PORT:'0'},stdio:['ignore','pipe','pipe']});let browser;
 try{
  const base=await new Promise((resolve,reject)=>{let output='';const timer=setTimeout(()=>reject(Error(output)),8000);const read=b=>{output+=b;const m=output.match(/http:\/\/localhost:(\d+)\/host/);if(m){clearTimeout(timer);resolve('http://127.0.0.1:'+m[1]);}};child.stdout.on('data',read);child.stderr.on('data',read);});
  browser=await webkit.launch();const pages=[],errors=[];
  for(const old of [true,false]){
   const page=await browser.newPage({viewport:{width:393,height:852}});page.on('pageerror',e=>errors.push(e.message));
   if(old)await page.route(/\/(controller|pocket-deck)\.js(?:\?.*)?$/,route=>route.fulfill({path:path.join(before,new URL(route.request().url()).pathname.split('/').at(-1)),contentType:'application/javascript'}));
   await page.goto(base);await page.fill('#name','Presentation QA');await page.click('#joinForm button[type=submit]');await page.waitForFunction(()=>window.__arcadeState?.players.length);
   await page.evaluate(()=>{
    const net=window.__arcadeConnection;net.ws.onmessage=null;net.ws.send=()=>{};
    window.fixture={...window.__arcadeState,phase:'playing',stage:'aim',activeId:net.id,t:0,deadline:30,turn:0,rounds:3,wind:0,events:[],roundSerial:1,
     players:[{...window.__arcadeState.players.find(p=>p.id===net.id),name:'Presentation QA',participant:true,angle:45,power:65,fuel:100,weapon:'pebble',inventory:{pebble:3},droneUsed:false,score:0}],
     airDefense:{charges:10,canLaunch:false,reason:'own-turn',origin:{x:300,y:300},range:600,threats:[],interceptors:[]}};
    window.push=()=>net.dispatchEvent(new CustomEvent('state',{detail:structuredClone(window.fixture)}));push();
   });
   await page.waitForFunction(()=>document.querySelector('#weaponInfo .hp-copy'));pages.push(page);
  }
  const cases=['aim','blocked','enemy','flight','radar','pilot','paused','used','loadout','waiting','results'];
  for(const language of ['en','ru'])for(const kind of cases){
   const states=[];
   for(const page of pages){
    states.push(await page.evaluate(({language,kind})=>{
     window.PartyI18n={language,t:v=>v};const f=fixture,p=f.players[0],id=window.__arcadeConnection.id;
     f.phase='playing';f.stage='aim';f.paused=false;f.activeId=id;f.drone=null;p.blockedThisTurn=false;p.droneUsed=false;p.participant=true;p.loadout=['pebble'];p.loadoutReady=false;f.draftSize=10;f.loadoutDeadline=30;
     f.airDefense={charges:10,canLaunch:false,reason:'own-turn',origin:{x:300,y:300},range:600,threats:[],interceptors:[]};
     if(kind==='blocked')p.blockedThisTurn=true;
     if(kind==='enemy')f.activeId='enemy';
     if(kind==='flight'||kind==='radar'){f.stage='flight';f.activeId='enemy';}
     if(kind==='radar')f.airDefense={...f.airDefense,canLaunch:true,reason:'ready',threats:[{id:'threat',dx:.2,dy:-.3}],interceptors:[{id:'interceptor',x:320,y:310}]};
     if(kind==='pilot'){f.stage='drone';f.drone={owner:id,deadline:12,duration:15,weapon:'pebble'};}
     if(kind==='paused')f.paused=true;if(kind==='used')p.droneUsed=true;
     if(kind==='loadout')f.stage='loadout';if(kind==='waiting')f.phase='waiting';if(kind==='results')f.phase='results';
     push();
     const ids=['turnLabel','turnHint','clock','fuel','droneLaunch','droneCountdown','droneInfo','droneBattery','droneDrop','droneStick','tankFire','moveLeft','moveRight','angle','power','angleValue','powerValue','tankTab','droneTab','defenseTab','defenseCharges','defenseReason','defenseLaunch','defenseRadar','weaponInfo','weaponName'];
     return Object.fromEntries(ids.map(id=>{const el=document.getElementById(id);return[id,{text:el.textContent,value:el.value,disabled:el.disabled,hidden:el.classList.contains('hidden'),aria:el.getAttribute('aria-label'),selected:el.getAttribute('aria-selected'),tabIndex:el.tabIndex}];}));
    },{language,kind}));
   }
   assert.deepEqual(states[1],states[0],`${language}/${kind}: same final text, controls and accessibility as before source`);
  }
  const retained=await pages[1].evaluate(async()=>{
   fixture.phase='playing';fixture.stage='flight';fixture.paused=false;fixture.drone=null;fixture.players[0].loadoutReady=false;push();
   const radar=document.querySelector('#radarContacts');const info=document.querySelector('#weaponInfo .hp-copy');
   // Non-empty radar plus unchanged packet: both informational nodes survive.
   fixture.airDefense.threats=[{id:'stable',dx:.1,dy:.2}];push();const contact=radar.firstElementChild;push();
   const same=contact===radar.firstElementChild&&info===document.querySelector('#weaponInfo .hp-copy');
   fixture.airDefense.threats[0].dx=.5;push();const moved=radar.firstElementChild.style.left==='72%';
   return{same,moved};
  });
  assert(retained.same,'Unchanged authoritative packet retains description and radar DOM');assert(retained.moved,'Real radar coordinate changes remain immediate');assert.deepEqual(errors,[]);
  console.log('PASS explicit paired WebKit fixtures: 22 EN/RU states preserve final labels, controls and accessibility; retained stable information updates immediately on changed data');
 }finally{await browser?.close();child.kill('SIGTERM');}
})().catch(e=>{console.error(e);process.exitCode=1;});
