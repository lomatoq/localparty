'use strict';
// Optional test diagnostics; no tokens, credentials, or host keys are logged.
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const original=chromium.launch.bind(chromium);
chromium.launch=async options=>{
  const browser=await original(options),newContext=browser.newContext.bind(browser);let count=0;
  browser.newContext=async options=>{
    const context=await newContext(options),label='context-'+(++count);
    await context.addInitScript(()=>{
      const trace=(proto,key)=>{const fn=proto[key];let n=0;proto[key]=function(...args){const log=n++<3;if(log)console.log('AP-DIAG',key,'begin');const value=fn.apply(this,args);if(log)console.log('AP-DIAG',key,'end');return value;};};
      trace(HTMLCanvasElement.prototype,'getContext');for(const key of ['setTransform','clearRect','fillText'])trace(CanvasRenderingContext2D.prototype,key);
      const descriptor=Object.getOwnPropertyDescriptor(WebSocket.prototype,'onmessage');let n=0;
      Object.defineProperty(WebSocket.prototype,'onmessage',{...descriptor,set(fn){descriptor.set.call(this,e=>{const log=n++<12;let type='';try{type=JSON.parse(e.data).type;}catch{}if(log)console.log('AP-DIAG','message',type,'begin');fn.call(this,e);if(log)console.log('AP-DIAG','message',type,'end');});}});
    });
    context.on('page',page=>{
      page.on('console',m=>{if(m.text().startsWith('AP-DIAG'))console.log(label,m.text());});
      page.on('websocket',socket=>{let snapshots=0;
        socket.on('framesent',f=>{try{const m=JSON.parse(f.payload);if(m.type==='join')console.log('PHONE-JOIN',label,JSON.stringify({name:m.data?.name,hand:m.data?.hand}));}catch{}});
        socket.on('framereceived',f=>{try{const m=JSON.parse(f.payload);if(m.type==='joined')console.log('PHONE-IDENTITY',label,JSON.stringify(m.data));if(m.type==='state'&&snapshots++<3)console.log('GAME-STATE',label,JSON.stringify({phase:m.data?.phase,players:m.data?.players?.map(p=>({id:p.id,name:p.name})),currentId:m.data?.currentId}));}catch{}});
      });
      const timer=setInterval(async()=>{if(page.isClosed())return;try{console.log('PHONE-DOM',label,JSON.stringify(await page.evaluate(()=>({profile:window.PARTY_PROFILE?{name:window.PARTY_PROFILE.name,hand:window.PARTY_PROFILE.hand}:null,you:document.querySelector('#ap-you')?.textContent,state:document.querySelector('#ap-state')?.textContent,classes:document.body?.className}))));}catch{}},5000);
      page.once('close',()=>clearInterval(timer));
    });
    return context;
  };
  return browser;
};
