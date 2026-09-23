'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const device='67ECE888-2F77-45FC-89DE-127096A509C5',bundle='com.localparty.launcher';
const container=execFileSync('xcrun',['simctl','get_app_container',device,bundle,'data'],{encoding:'utf8'}).trim();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let sequence=0;
async function js(script,surface='menu'){
 const id=Date.now()+'-tabs-'+(++sequence),file=path.join(container,'Documents/ui-audit-command.json');
 fs.writeFileSync(file+'.tmp',JSON.stringify({id,script,surface}));fs.renameSync(file+'.tmp',file);
 for(let n=0;n<150;n++){await sleep(50);try{const r=JSON.parse(fs.readFileSync(path.join(container,'Documents/ui-audit-result.json')));if(r.id===id){if(r.error)throw Error(r.error);return r.result;}}catch(e){if(!['ENOENT'].includes(e.code)&&!(e instanceof SyntaxError))throw e;}}
 throw Error('Native tab command timed out');
}
(async()=>{
 await js("LocalPartyTabs.select('controller');true");await sleep(600);
 for(let n=0;n<30;n++){if(await js('!!window.LocalPartyTabs','controller'))break;await sleep(200);}
 await js("window.__tabSessionSentinel='kept';true",'controller');
 const brandStyle="JSON.stringify((()=>{const s=getComputedStyle(document.querySelector('.app-header .brand'));return [s.fontSize,s.fontFamily,s.fontWeight,s.fontStyle,s.lineHeight,s.letterSpacing]})())";
 const controllerBrand=await js(brandStyle,'controller');
 assert.equal(await js(brandStyle),controllerBrand,'Games and Controller brand typography must match');
 for(let n=0;n<4;n++){
  await js("LocalPartyTabs.select('host');true",'controller');await sleep(1000);
  const host=JSON.parse(await js("JSON.stringify({open:hostPanel.open,modal:hostPanel.matches(':modal'),screen:document.body.classList.contains('native-host-tab'),dock:document.querySelector('#partyNativeDock').getBoundingClientRect().height})"));
  assert(host.open&&host.screen&&!host.modal);assert(host.dock>=48);
  assert.equal(await js(brandStyle),controllerBrand,'Host brand typography must match');
  await js("LocalPartyTabs.select('games');true");await sleep(1000);
  assert(await js("!hostPanel.open&&!document.body.classList.contains('native-host-tab')"));
  await js("LocalPartyTabs.select('controller');true");await sleep(1000);
  assert.equal(await js('window.__tabSessionSentinel','controller'),'kept');
 }
 await js("for(const tab of ['host','games','controller','host'])window.webkit.messageHandlers.partyShell.postMessage({type:'native-tab',tab});true",'controller');await sleep(2000);
 assert(await js("hostPanel.open&&document.body.classList.contains('native-host-tab')"));
 await js("scrollTo(0,1500);document.querySelector('[data-filter=all]').click();true",'controller');await sleep(1200);
 assert.equal(await js('scrollY','controller'),0);
 const geometry=JSON.parse(await js("JSON.stringify({intro:document.querySelector('#home>.intro').getBoundingClientRect().top,header:document.querySelector('.app-header').getBoundingClientRect().bottom})",'controller'));
 assert(geometry.intro>=geometry.header);
 await js("LocalPartyTabs.select('games');true",'controller');
 console.log('PASS: 12 tab transitions; Host is a page, controller document retained, All Games scrollY=0, intro below header');
})().catch(e=>{console.error(e);process.exitCode=1;});
