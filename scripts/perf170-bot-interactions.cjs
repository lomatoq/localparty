'use strict';
const fs=require('fs'),path=require('path'),{spawn}=require('child_process'),{chromium}=require('playwright');
const out=path.resolve(process.env.QA_OUTPUT||'.localparty-build/perf170/bots');fs.mkdirSync(out,{recursive:true});
const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'1',PARTY_EPHEMERAL:'1',PARTY_INTERNAL_PORT:'0',PARTY_PORT:'0',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'perf170'}});let log='',browser,staticServer;child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{try{
 for(let i=0;i<300&&!/localhost:(\d+)/.test(log);i++)await wait(50);const origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 const api=async command=>(await fetch(origin+'/api/manage',{method:command?'POST':'GET',headers:{Authorization:'Bearer perf170','Content-Type':'application/json'},body:command?JSON.stringify(command):undefined})).json();
 browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 const tv=await browser.newPage({viewport:{width:1280,height:720}});await tv.goto(origin+'/tv');
 const p=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true});
 const report={clicks:[],deliveries:[],errors:[]};p.on('pageerror',e=>report.errors.push(e.message));
 await p.exposeFunction('__nativeCommand',async m=>{if(m.type==='manage'){let t=Date.now();const s=await api(m.command);report.deliveries.push({type:m.command.type,count:m.command.count,apiMs:Date.now()-t,error:s.error});await update(s);}});
 await p.addInitScript(()=>{window.webkit={messageHandlers:{partyShell:{postMessage:m=>window.__nativeCommand(m)}}};window.__cost={};const MO=MutationObserver;window.MutationObserver=class extends MO{constructor(fn){const key=new Error().stack.split('\n')[2];super(function(...args){const t=performance.now();try{return fn(...args)}finally{const v=__cost[key]||(__cost[key]={n:0,ms:0,max:0});const d=performance.now()-t;v.n++;v.ms+=d;v.max=Math.max(v.max,d)}})}};});
 if(process.env.PERF_SOURCE_DIR)for(const file of ['host.js','icons.js','game-ui-system.js'])await p.route('**/'+file,r=>r.fulfill({contentType:'text/javascript',body:fs.readFileSync(process.env.PERF_SOURCE_DIR+'/'+file,'utf8')}));
 staticServer=require('express')().use(require('express').static(path.resolve('public'))).listen(0,'127.0.0.1');await new Promise(r=>staticServer.once('listening',r));await p.goto('http://127.0.0.1:'+staticServer.address().port+'/native-shell/index.html');
 async function update(state){if(state.error)return;state.native={ready:true,catalogReady:true};const t=await p.evaluate(s=>{let t=performance.now();LocalPartyHost.update(s);return performance.now()-t;},state);report.deliveries.push({renderMs:t,players:state.players.length});}
 await api({type:'select',id:'curling'});await update(await api());await p.evaluate(()=>document.fonts.ready);await wait(1500);
 async function click(id,label){const v=await p.evaluate(async({id,label})=>{const node=document.getElementById(id)||document.querySelector(id),t=performance.now();node.click();const sync=performance.now()-t;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return{label,syncMs:sync,nextPaintOpportunityMs:performance.now()-t};},{id,label});report.clicks.push(v);await wait(350);}
 const trace=process.env.PERF_TRACE?await p.context().newCDPSession(p):null;if(trace)await trace.send('Tracing.start',{categories:'devtools.timeline,v8,disabled-by-default-devtools.timeline',transferMode:'ReturnAsStream'});
 for(let n=0;n<3;n++){await click('openHost','host-open');await click('[data-close=hostPanel]','host-close');}
 await click('choiceStart','micro-open');
 for(let n=1;n<=5;n++){await click('startBotsPlus','add-'+n);await wait(150);await update(await api());}
 await api({type:'bots-set',count:15});await wait(400);await update(await api());await wait(500);
 for(let n=0;n<3;n++){await click('startBotsMinus','remove');await wait(150);await update(await api());await click('startBotsPlus','add-back');await wait(150);await update(await api());}
 if(trace){const done=new Promise(r=>trace.once('Tracing.tracingComplete',r));await trace.send('Tracing.end');const {stream}=await done;let data='';for(;;){const chunk=await trace.send('IO.read',{handle:stream});data+=chunk.data;if(chunk.eof)break;}await trace.send('IO.close',{handle:stream});fs.writeFileSync(path.join(out,'trace.json'),data);}
 await p.screenshot({path:path.join(out,'micro-bots.png')});report.cost=await p.evaluate(()=>__cost);report.final=await api();delete report.final.catalog;
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({clicks:report.clicks,errors:report.errors,deliveries:report.deliveries}));
 }finally{await browser?.close();child.kill();staticServer?.close();}})().catch(e=>{console.error(e);process.exitCode=1});
