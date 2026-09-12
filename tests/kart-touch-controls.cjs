const fs=require('fs'),Module=require('module');process.env.UX_GAMES='kart';
let source=fs.readFileSync(require.resolve('./game-art-browser.cjs'),'utf8');
const exercise=`
const pf=phone.frames().find(f=>f.url().includes('/games/kart/'));
await pf.waitForFunction(()=>gameState?.status==='racing');const initial=await pf.evaluate(()=>{const p=gameState.players.find(p=>p.id===playerId);return{x:p.x,y:p.y}});const pad=await pf.locator('#wheelPad').boundingBox(),gas=await pf.locator('#gasBtn').boundingBox();
assert(pad.width>100&&pad.height>=80,'large steering zone');
await pf.evaluate(()=>{window.touchLog=[];for(const t of ['pointerdown','pointerup','pointercancel','lostpointercapture'])document.addEventListener(t,e=>touchLog.push([t,e.pointerId,e.target.id]),true)});const cdp=await context.newCDPSession(phone),a={id:1,x:pad.x+pad.width*.5,y:pad.y+pad.height*.5},b={id:2,x:gas.x+gas.width*.5,y:gas.y+gas.height*.5};
await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[a,b]});
await phone.waitForTimeout(80);assert.equal(await pf.evaluate(()=>steer),0,'touchdown must not jump steering');assert.equal(await pf.evaluate(()=>throttle),1);
await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...a,x:a.x-65},b]});await phone.waitForTimeout(100);
assert((await pf.evaluate(()=>steer))<-.4,'drag left turns left');assert.equal(await pf.evaluate(()=>throttle),1,'second finger keeps gas');
await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...a,x:pad.x+pad.width+45},b]});await phone.waitForTimeout(80);assert((await pf.evaluate(()=>steer))>.9,'capture works beyond steering pad');
await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{...a,x:pad.x+pad.width+45}]});await phone.waitForTimeout(80);console.log('RELEASE',await pf.evaluate(()=>({steer,throttle,wheelPointer,gasPointer,touchLog})));assert.equal(await pf.evaluate(()=>steer),0);assert.equal(await pf.evaluate(()=>throttle),1);
await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await phone.waitForTimeout(80);assert.equal(await pf.evaluate(()=>throttle),0);
const moved=await pf.evaluate(()=>{const p=gameState.players.find(p=>p.id===playerId);return{x:p.x,y:p.y}});assert(Math.hypot(moved.x-initial.x,moved.y-initial.y)>1,'touch input moves real server kart');await pf.locator('#swapHandBtn').click();assert(await pf.locator('#controlsArea').evaluate(el=>el.classList.contains('left-handed')));
await phone.screenshot({path:'tests/kart-touch-controller.png'});console.log('PASS real two-touch steering/gas, no touchdown jump, capture outside pad, independent release and hand swap');
`;
source=source.replace("const gameFrame=host.frames().find",exercise+"const gameFrame=host.frames().find");
const test=new Module(__filename,module);test.filename=__filename;test.paths=module.paths;test._compile(source,__filename);
