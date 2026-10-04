'use strict';
async function settleTVWaiting(page){
 await page.waitForFunction(()=>{const e=document.getElementById('tvSceneTransition');return !e||e.hidden;});
 await page.waitForFunction(()=>{const e=document.getElementById('waiting'),r=e?.getBoundingClientRect();return e&&!e.hidden&&r.width>0&&r.height>0;});
 await page.evaluate(async()=>{await document.fonts.ready;await Promise.all(document.getAnimations().filter(a=>{const t=a.effect?.getComputedTiming();return t&&t.iterations!==Infinity&&t.endTime<=3000;}).map(a=>a.finished.catch(()=>{})));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
}
module.exports={settleTVWaiting};
