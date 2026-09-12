/* Deliberately modest test companion. Only its own ordinary controller is used. */
(() => {
  'use strict';
  if(!window.parent?.PARTY_TEST_BOT || window.PARTY_TEST_BOT_RUNNING)return;
  window.PARTY_TEST_BOT_RUNNING=true;
  const game=location.pathname.match(/\/games\/([^/]+)/)?.[1]||'';
  const held=new Map();let serial=7000,lastAction=0,drawStep=0,stopped=false;
  const q=s=>document.querySelector(s);
  const available=e=>!!e&&!e.disabled&&e.getAttribute('aria-disabled')!=='true'&&!e.closest('[hidden],.hidden')&&e.getClientRects().length>0&&getComputedStyle(e).display!=='none';
  function event(e,type,x=.5,y=.5,id){
    const r=e.getBoundingClientRect();
    // Synthetic pointer ids cannot be captured by the browser. This override is
    // restricted to controls of the explicitly enabled, isolated bot document.
    if(!e.dataset.botPointer){e.dataset.botPointer='true';e.setPointerCapture=()=>{};e.releasePointerCapture=()=>{};}
    e.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerId:id,pointerType:'touch',isPrimary:true,button:0,buttons:type==='pointerup'||type==='pointercancel'?0:1,clientX:r.left+r.width*x,clientY:r.top+r.height*y}));
  }
  function hold(e,x=.5,y=.5){if(!available(e))return;let id=held.get(e);if(!id){id=++serial;held.set(e,id);event(e,'pointerdown',x,y,id);}else event(e,'pointermove',x,y,id);}
  function release(e){const id=held.get(e);if(id){event(e,'pointerup',.5,.5,id);held.delete(e);}}
  function releaseAll(){for(const e of [...held.keys()])release(e);}
  function tap(selector){const e=q(selector);if(!available(e))return false;const id=++serial;event(e,'pointerdown',.5,.5,id);event(e,'pointerup',.5,.5,id);return true;}
  function click(selector){const e=q(selector);if(!available(e))return false;e.click();return true;}
  function online(){const c=window.PARTY_TEST_CONNECTIONS;return !!c&&([...c.native].some(s=>s.readyState===1)||[...c.io].some(s=>s.connected));}
  function paused(){const u=window.PARTY_UI||window.parent.PARTY_UI;return u?.paused||['paused','pause'].includes(u?.phase)||document.documentElement.dataset.partyPaused==='true';}
  function draw(canvas){if(!available(canvas))return;drawStep++;const t=drawStep%32;hold(canvas,.5+Math.sin(t/32*Math.PI*2)*.25,.5+Math.cos(t/32*Math.PI*2)*.25);if(t===31)release(canvas);}
  function tick(){
    if(stopped)return;
    if(!online()||paused()||document.hidden){releaseAll();return;}
    for(const e of [...held.keys()])if(!available(e)||!e.isConnected)release(e);
    const now=performance.now(),t=now/1000,slow=now-lastAction>2200;
    // Continuous input is refreshed more often than the server's 450ms cutoff.
    if(['push','shrink','bomb'].includes(game))hold(q('#joystickZone'),.5+Math.sin(t*.6)*.19,.5+Math.cos(t*.6)*.19);
    if(game==='tankarena'){hold(q('#joy'),.5+Math.sin(t*.5)*.22,.5+Math.cos(t*.5)*.22);hold(q('#fire'));}
    if(game==='tanks'){if(t%6<4)hold(q('#forwardBtn'));else release(q('#forwardBtn'));hold(q('#fireBtn'));}
    if(game==='kart'){hold(q('#gasBtn'));hold(q('#wheelPad'),.5+Math.sin(t*.45)*.17,.5);}
    if(game==='chaos'){hold(q('.vector-pad'),.5+Math.sin(t*.3)*.06,.5+Math.cos(t*.3)*.06);}
    if(game==='jenga')hold(q('#jengaJoystick'),.5,.77);
    if(game==='monster')draw(q('#drawCanvas'));
    if(game==='drawguess'&&q('#canvas.canDraw'))draw(q('#canvas'));
    if(['hungry','carryball','snakelines'].includes(game))hold(q('#joy'),.5+Math.cos(t*.7)*.3,.5+Math.sin(t*.7)*.3);
    if(game==='taprace')tap('#action');
    if(game==='flappy'&&now-lastAction>510){tap('#action');lastAction=now;}
    if(!slow)return;lastAction=now;
    if(game==='carryball')tap('#action');
    if(game==='punchmeter'){const e=q('#action');if(available(e)){hold(e);setTimeout(()=>release(e),500);}}
    if(game==='knives')tap('#throwBtn');
    if(game==='western')tap('#fireBtn'); // It can lose, just like a novice guest.
    if(game==='western_duel'&&q('#fire.ready'))tap('#fire');
    if(['warsaw','sinyakquiz'].includes(game))click('#answers button:not(:disabled)');
    if(game==='millionaire')click('#phoneAnswers button:not(:disabled)');
    if(game==='crocodile')click('#guessed');
    if(game==='crane'){releaseAll();tap('#drop');}
    if(game==='jenga'&&!q('#blocks .selected'))click('#blocks button:not(:disabled)');
    if(game==='naval')click('#grid button:not(.hit):not(.miss):not(.sunk):not(:disabled)');
    if(game==='chaos'){const e=q('#controlArea .ctrl');if(available(e)){hold(e);setTimeout(()=>release(e),350);}}
    if(game==='monster'){release(q('#drawCanvas'));if(!click('#confirmSubmit'))click('#doneBtn');}
    if(game==='drawguess'){
      const input=q('#guess');if(available(input)){input.value=['кот','дом','солнце','дерево','машина'][Math.floor(t/2.2)%5];input.dispatchEvent(new Event('input',{bubbles:true}));q('#guessForm')?.requestSubmit();}
    }
    if(game==='spy'){
      // Readiness requires an actual hold gesture. Never inspect the secret text.
      const secret=q('#secretCard');if(available(secret)){hold(secret);setTimeout(()=>{if(!paused()&&online())click('#readyBtn');release(secret);},350);}
      click('#nextTurnPhone');
      // Vote directly through the same player API, without opening a hidden confirm.
      const option=q('#voteList [data-vote]:not(:disabled)');if(available(option))for(const s of window.PARTY_TEST_CONNECTIONS.io)if(s.connected)s.emit('player:vote',{targetId:option.dataset.vote});
    }
  }
  const timer=setInterval(tick,100);
  window.addEventListener('pagehide',()=>{stopped=true;clearInterval(timer);releaseAll();});
  window.addEventListener('offline',releaseAll);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)releaseAll();});
})();
