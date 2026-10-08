'use strict';
// Drives the real WKWebViews of the DEBUG simulator build (PARTY_UI_AUDIT=1 file
// command channel) and captures simctl screenshots. Simulator only; not a device.
// Usage: QA_LABEL=before|after node scripts/sim-app-ux-20261005.cjs
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const U=process.env.SIM_UDID||'813D1542-DA22-468D-921D-0A50760224EE',B='com.localparty.launcher';
const out=path.join(__dirname,'..','.localparty-build','app-ux-2026-10-05','sim-'+(process.env.QA_LABEL||'after'));fs.mkdirSync(out,{recursive:true});
const dir=path.join(execFileSync('xcrun',['simctl','get_app_container',U,B,'data'],{encoding:'utf8'}).trim(),'Documents');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let seq=0;const log=[];
async function js(script,surface='menu',tab){const id=Date.now()+'-ux-'+(++seq);const cmd={id,script,surface};if(tab)cmd.tab=tab;fs.writeFileSync(path.join(dir,'ui-audit-command.json.tmp'),JSON.stringify(cmd));fs.renameSync(path.join(dir,'ui-audit-command.json.tmp'),path.join(dir,'ui-audit-command.json'));
 for(let n=0;n<200;n++){await sleep(50);try{const r=JSON.parse(fs.readFileSync(path.join(dir,'ui-audit-result.json'),'utf8'));if(r.id===id){if(r.error)throw Error(r.error);return r.result;}}catch(e){if(e.code!=='ENOENT'&&!(e instanceof SyntaxError))throw e;}}throw Error('timeout '+script.slice(0,60));}
function shot(name){const f=path.join(out,name+'.png');execFileSync('xcrun',['simctl','io',U,'screenshot',f],{stdio:'ignore'});log.push(name);}
(async()=>{
 for(let n=0;n<120;n++){try{if(await js("!!window.LocalPartyHost&&document.querySelectorAll('#catalog [data-game]').length>5"))break;}catch{}await sleep(500);}
 await sleep(1500);
 const steps=JSON.parse(process.env.SIM_STEPS||'null')||[
  ['hub',"scrollTo(0,0);true",1200],
  ['hub-scrolled-500',"scrollTo({top:500,behavior:'instant'});true",900],
  ['hub-scrolled-1500',"scrollTo({top:1500,behavior:'instant'});true",900],
  ['detail-open-80ms',"scrollTo({top:0,behavior:'instant'});setTimeout(()=>{const b=document.querySelector('#catalog [data-game=bomb] .lp-card-open');b.scrollIntoView({block:'center'});setTimeout(()=>{b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,isPrimary:true}));b.click();},400);},10);true",640],
  ['detail',"true",1200],
  ['detail-closed',"document.querySelector('[data-close=gameDetail]').click();true",900],
  ['search-empty',"scrollTo({top:0,behavior:'instant'});(()=>{const s=document.getElementById('search');s.value='zzzz';s.dispatchEvent(new Event('input',{bubbles:true}));})();true",900],
  ['search-cleared',"(()=>{const s=document.getElementById('search');s.value='';s.dispatchEvent(new Event('input',{bubbles:true}));s.blur();})();true",600],
  ['hub-scrolled-160',"scrollTo({top:160,behavior:'instant'});true",900],
  ['host-tab',"window.webkit.messageHandlers.partyShell.postMessage({type:'native-tab',tab:'host'});true",1500],
  ['games-tab',"window.webkit.messageHandlers.partyShell.postMessage({type:'native-tab',tab:'games'});true",1500],
 ];
 for(const [name,script,wait] of steps){try{const r=await js(script);await sleep(wait);shot(name);}catch(e){log.push(name+' ERROR '+e.message);}}
 fs.writeFileSync(path.join(out,'log.json'),JSON.stringify(log,null,1));console.log(log.join('\n'));
})();
