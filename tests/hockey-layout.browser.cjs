'use strict';
const {spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const playerCount=Number(process.env.QA_HOCKEY_PLAYERS||4);assert.ok([2,4].includes(playerCount));
const root=path.resolve('.localparty-build/hockey-v2-'+(playerCount===2?'two':'four')),output=root;fs.mkdirSync(output,{recursive:true});
const clockRate=1;
const child=spawn(process.execPath,['--require',path.resolve('scripts/capture-qa-clock.cjs'),'server.js'],{env:{...process.env,NODE_OPTIONS:[process.env.NODE_OPTIONS||'','--require='+path.resolve('scripts/capture-qa-clock.cjs')].join(' '),PARTY_EMBEDDED:'1',PARTY_INTERNAL_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_PORT:'0',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'screen-review',QA_CLOCK_RATE:String(clockRate)}});

async function assertHeader(page,width){
 await page.evaluate(()=>document.fonts.ready);
 const header=await page.evaluate(()=>{
  const text=n=>{const c=getComputedStyle(n),r=n.getBoundingClientRect();return{id:n.id,text:n.textContent.trim(),size:parseFloat(c.fontSize),line:c.lineHeight,font:c.fontFamily,style:c.fontStyle,caps:c.textTransform,width:r.width,height:r.height,scrollHeight:n.scrollHeight,clientHeight:n.clientHeight,overflowX:n.scrollWidth>n.clientWidth+1,overflowY:n.scrollHeight>n.clientHeight+1}};
  const groups=[...document.querySelectorAll('.tv-info-wing,.tv-info-center')].map(n=>{const r=n.getBoundingClientRect(),children=[...n.children].filter(x=>!x.hidden&&x.textContent.trim()&&x.getBoundingClientRect().height>0),top=Math.min(...children.map(x=>x.getBoundingClientRect().top)),bottom=Math.max(...children.map(x=>x.getBoundingClientRect().bottom));return{class:n.className,height:r.height,cssHeight:parseFloat(getComputedStyle(n).height),scale:r.height/parseFloat(getComputedStyle(n).height),topPadding:top-r.top,bottomPadding:r.bottom-bottom,children:children.map(text)}});
  return{groups,timer:document.querySelector('.tv-timer-value')?text(document.querySelector('.tv-timer-value')):null,fontFaces:[...document.fonts].filter(f=>f.family.startsWith('HeyPals')).map(f=>({family:f.family,style:f.style,status:f.status})),fonts:{display:document.fonts.check('italic 750 16px HeyPalsDisplay'),body:document.fonts.check('500 16px HeyPalsText'),numeric:document.fonts.check('650 30px HeyPalsNumeric')},phase:text(document.querySelector('#phase')),context:text(document.querySelector('#gameContext'))};
 });
 console.log('HEADER',width,JSON.stringify(header,null,2));
 report.headers??=[];report.headers.push({width,...header});
 fs.writeFileSync(path.join(output,'header-report.json'),JSON.stringify(report.headers,null,2));
 assert.ok(header.timer&&header.timer.size>=28,'Side timer must be prominent');assert.ok(header.timer.font.includes('HeyPalsNumeric'),'Side timer numeric role');assert.equal(header.phase.caps,'uppercase','TV phase must be CAPS');assert.equal(header.phase.style,'italic','TV phase must be italic');assert.ok(header.phase.size<header.context.size,'Phase must be secondary to game title');
 for(const [name,loaded]of Object.entries(header.fonts))assert.equal(loaded,true,name+' font loaded');for(const family of ['HeyPalsDisplay','HeyPalsText','HeyPalsNumeric'])assert.ok(header.fontFaces.some(f=>f.family===family&&f.status==='loaded'),family+' actual face loaded');
 for(const group of header.groups){for(const item of group.children){assert.equal(item.overflowX,false,item.id+' horizontal clipping');assert.equal(item.overflowY,false,item.id+' vertical clipping');}if(group.class.includes('tv-info-wing')){assert.equal(group.cssHeight,64);assert.ok(group.topPadding/group.scale>=8,group.class+' top padding');assert.ok(group.bottomPadding/group.scale>=8,group.class+' bottom padding');assert.ok(Math.abs(group.topPadding-group.bottomPadding)/group.scale<=1,group.class+' centered content');}}
}

const sleep=ms=>new Promise(r=>setTimeout(r,ms));let log='',browser;
const report={capturedAt:new Date().toISOString(),method:'Real games, host actions, minimum supported settings; QA server clock '+clockRate+'x. Does not validate real-time physics or timing.',games:[],errors:[]};
let extras=[];try{extras=JSON.parse(fs.readFileSync(path.join(root,'manifest-extra.json')));}catch{}
child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
const save=()=>{fs.writeFileSync(path.join(output,process.env.QA_REPORT_NAME||'complete-report.json'),JSON.stringify(report,null,2));fs.writeFileSync(path.join(root,'manifest-extra.json'),JSON.stringify(extras,null,2));};
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{save();child.kill();browser?.close().finally(()=>process.exit(130));});
const deadline=setTimeout(()=>{console.error('Global review timeout');save();child.kill();process.exit(2);},45*60*1000);deadline.unref();
(async()=>{try{
 for(let i=0;i<300&&!/localhost:(\d+)/.test(log);i++)await sleep(50);assert.match(log,/localhost:(\d+)/);const origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 const api=async body=>{const r=await fetch(origin+'/api/manage',{signal:AbortSignal.timeout(15000),method:body?'POST':'GET',headers:{Authorization:'Bearer screen-review','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const state=await r.json();if(!r.ok)throw Error(JSON.stringify(state));return state;};
 browser=await webkit.launch({headless:true});const tv=await browser.newPage({viewport:{width:1280,height:720}}),phone=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true});
 for(const [surface,p]of[['tv',tv],['phone',phone]])p.on('pageerror',e=>report.errors.push({surface,error:e.message}));
 await tv.goto(origin+'/tv');await phone.goto(origin+'/play');await phone.locator('#name').fill('Александра ДлинноеИмя');await phone.locator('#joinForm button[type=submit]').click();await phone.locator('#home').waitFor();

 for(const id of ['airhockey']){
  await api({type:'bots-set',count:playerCount-1});await sleep(500);await api({type:'launch',id});
  await phone.waitForFunction(id=>document.querySelector('#gameFrame').src.includes('/games/'+id+'/'),id);
  await phone.waitForFunction(()=>!document.getElementById('readyButton').disabled,null,{timeout:30000});await phone.locator('#readyButton').click();await sleep(1600);
  const snap=await api();if(snap.active?.ui?.phase==='waiting')await api({type:'force-start',instance:snap.active.instance});await sleep(900);
  for(const width of [320,375,393]){await phone.setViewportSize({width,height:width===320?568:width===375?667:852});await sleep(350);await phone.screenshot({path:path.join(output,id+'-'+width+'.png')});const f=phone.frames().find(f=>f.url().includes('/games/'+id+'/'));assert.equal(await f.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);console.log(id,width,await f.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,body:document.body.getBoundingClientRect().toJSON(),controls:[...document.querySelectorAll('#hole,#actions,#hockeyJoy,#mineOpen')].filter(n=>!n.hidden).map(n=>({id:n.id,rect:n.getBoundingClientRect().toJSON()}))})));}
  for(const width of [1280,1920]){await tv.setViewportSize({width,height:width===1280?720:1080});await sleep(500);await tv.screenshot({path:path.join(output,id+'-tv-'+width+'.png')});await assertHeader(tv,width);const f=tv.frames().find(f=>f.url().includes('/games/'+id+'/'));const geometry=await f.evaluate(()=>{const rink=document.querySelector('#rink'),rail=document.querySelector('#hockeyHitters'),r=rink.getBoundingClientRect(),q=rail.getBoundingClientRect(),c=getComputedStyle(rink);return{ratio:(r.width-parseFloat(c.borderLeftWidth)-parseFloat(c.borderRightWidth))/(r.height-parseFloat(c.borderTopWidth)-parseFloat(c.borderBottomWidth)),railWidth:q.width,rinkWidth:r.width,railBottom:q.bottom,height:innerHeight,railHidden:rail.hidden,labels:[...rail.children].map(n=>({hidden:n.hidden,left:n.getBoundingClientRect().left}))}});assert.ok(Math.abs(geometry.ratio-5/3)<.001);if(playerCount>2){assert.ok(Math.abs(geometry.railWidth-geometry.rinkWidth)<1);assert.ok(geometry.railBottom<=geometry.height);}assert.equal(geometry.railHidden,playerCount<=2);console.log('GEOMETRY',width,geometry);console.log(id,'TV',width,await f.evaluate(()=>({canvas:document.querySelector('canvas')?.getBoundingClientRect().toJSON(),inset:getComputedStyle(document.documentElement).getPropertyValue('--party-stage-inset-top'),seats:[...document.querySelectorAll('.seat')].map(n=>n.getBoundingClientRect().toJSON()),labels:[...document.querySelectorAll('.hockey-last-hitter')].map(n=>({visible:!n.hidden,name:n.textContent}))})));}
  await api({type:'stop'});await sleep(500);
 }
 console.log('ERRORS',report.errors);assert.deepEqual(report.errors,[]);
 }finally{clearTimeout(deadline);await browser?.close();child.kill();}})().catch(e=>{console.error(e);process.exitCode=1;});
