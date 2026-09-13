'use strict';
// Test-only, limited diagnostics. Never log lobby authentication tokens or host keys.
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const original=chromium.launch.bind(chromium);
chromium.launch=async options=>{
  const browser=await original(options),newContext=browser.newContext.bind(browser);let count=0;
  browser.newContext=async options=>{
    const context=await newContext(options),label='context-'+(++count);
    context.on('page',page=>{
      page.on('websocket',socket=>{let snapshots=0;
        socket.on('framesent',f=>{try{const m=JSON.parse(f.payload);if(m.type==='join')console.log('PHONE-JOIN',label,JSON.stringify({name:m.data?.name,hand:m.data?.hand}));}catch{}});
        socket.on('framereceived',f=>{try{const m=JSON.parse(f.payload);if(m.type==='joined'||m.type==='private'&&snapshots<2)console.log('PHONE-IDENTITY',label,JSON.stringify(m.data));if(m.type==='state'&&snapshots++<3)console.log('GAME-STATE',label,JSON.stringify({phase:m.data?.phase,players:m.data?.players?.map(p=>({id:p.id,name:p.name})),currentId:m.data?.currentId}));}catch{}});
      });
      const timer=setInterval(async()=>{if(page.isClosed())return;try{console.log('PHONE-DOM',label,JSON.stringify(await page.evaluate(()=>({profile:window.PARTY_PROFILE?{name:window.PARTY_PROFILE.name,hand:window.PARTY_PROFILE.hand}:null,you:document.querySelector('#ap-you')?.textContent,state:document.querySelector('#ap-state')?.textContent,classes:document.body?.className}))));}catch{}},5000);
      page.once('close',()=>clearInterval(timer));
    });
    return context;
  };
  return browser;
};
