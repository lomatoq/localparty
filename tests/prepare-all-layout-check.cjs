const fs=require('fs');let s=fs.readFileSync('tests/structure-verification.cjs','utf8');
s=s.replace("console.log('PASS',id,'visible game-specific rules open and close');",`
 for(const size of [{width:1920,height:1080},{width:3430,height:1300}]){
  await host.setViewportSize(size);await host.waitForTimeout(150);
  const layout=await frame.evaluate(()=>{const r=document.querySelector('.lp-lobby-rules').getBoundingClientRect();return{top:r.top,bottom:r.bottom,height:innerHeight,width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth+1};});
  assert(!layout.overflow,id+' host horizontal overflow '+JSON.stringify(layout));
  assert(layout.top>=120,id+' rules overlap title '+JSON.stringify(layout));
  assert(layout.bottom<=layout.height,id+' rules outside frame '+JSON.stringify(layout));
  if(size.width===1920)await host.screenshot({path:'tests/layout-host-'+id+'.png'});
 }
 for(const height of [760,874]){
  await phone.setViewportSize({width:402,height});await phone.waitForTimeout(100);
  const details=phone.locator('.waiting-details');
  const closed=await details.boundingBox();const ready=await phone.locator('#readyButton').boundingBox();
  assert(closed.y+closed.height<=ready.y,id+' mobile closed rules overlap ready');
  await details.locator('summary').click();const open=await details.boundingBox();
  const nextReady=await phone.locator('#readyButton').boundingBox();
  assert(Math.abs(open.width-nextReady.width)<3,id+' mobile expanded rules width');
  assert(open.y+open.height<=nextReady.y+1,id+' mobile open rules overlap ready');
  assert(nextReady.y+nextReady.height<height-60,id+' mobile ready clipped');
  await details.locator('summary').click();
  if(height===760)await phone.screenshot({path:'tests/layout-phone-'+id+'.png'});
 }
 console.log('PASS',id,'two desktop sizes and two mobile heights; rules open and close without overlap');`);
fs.writeFileSync('tests/all-layout-check.cjs',s);
