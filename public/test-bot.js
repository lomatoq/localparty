/* Deliberately modest test companion. Only its own ordinary controller is used. */
(() => {
  'use strict';
  if(!window.parent?.PARTY_TEST_BOT || window.PARTY_TEST_BOT_RUNNING)return;
  window.PARTY_TEST_BOT_RUNNING=true;
  const game=location.pathname.match(/\/games\/([^/]+)/)?.[1]||'';
  const held=new Map(),pending=new Map();let serial=7000,lastAction=0,drawStep=0,stopped=false;
  const profile=window.PARTY_PROFILE||{},seed=[...(profile.id||profile.name||'bot')].reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,0),pace=1250+seed%700;
  const diagnostics=window.PARTY_BOT_DIAGNOSTICS={game,actions:0,ticks:0,decisions:0,mode:'waiting'};
  const q=s=>document.querySelector(s);
  const available=e=>!!e&&!e.disabled&&e.getAttribute('aria-disabled')!=='true'&&!e.closest('[hidden],.hidden')&&e.getClientRects().length>0&&getComputedStyle(e).display!=='none';
  function event(e,type,x=.5,y=.5,id){
    const r=e.getBoundingClientRect();
    // Synthetic pointer ids cannot be captured by the browser. This override is
    // restricted to controls of the explicitly enabled, isolated bot document.
    if(!e.dataset.botPointer){e.dataset.botPointer='true';e.setPointerCapture=()=>{};e.releasePointerCapture=()=>{};}
    e.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerId:id,pointerType:'touch',isPrimary:true,button:0,buttons:type==='pointerup'||type==='pointercancel'?0:1,clientX:r.left+r.width*x,clientY:r.top+r.height*y}));
    if(type==='pointerdown')diagnostics.actions++;
  }
  function hold(e,x=.5,y=.5){if(!available(e))return;let id=held.get(e);if(!id){id=++serial;held.set(e,id);event(e,'pointerdown',x,y,id);}else event(e,'pointermove',x,y,id);}
  function release(e){const id=held.get(e);if(id){event(e,'pointerup',.5,.5,id);held.delete(e);}}
  function releaseAll(){pending.clear();for(const [e,id]of held)event(e,'pointercancel',.5,.5,id);held.clear();}
  function later(fn,ms){pending.set(fn,performance.now()+ms);}
  function tap(selector){const e=q(selector);if(!available(e))return false;const id=++serial;event(e,'pointerdown',.5,.5,id);event(e,'pointerup',.5,.5,id);return true;}
  function click(selector){const e=q(selector);if(!available(e))return false;e.click();diagnostics.actions++;return true;}
  function online(){const c=window.PARTY_TEST_CONNECTIONS;return !!c&&([...c.native].some(s=>s.readyState===1)||[...c.io].some(s=>s.connected));}
  function paused(){const u=window.PARTY_UI||window.parent.PARTY_UI;return window.PARTY_SESSION?.paused||window.parent.PARTY_SESSION?.paused||u?.paused||['paused','pause'].includes(u?.phase)||document.documentElement.dataset.partyPaused==='true';}
  function draw(canvas){if(!available(canvas))return;drawStep++;const t=drawStep%32;hold(canvas,.5+Math.sin(t/32*Math.PI*2)*.25,.5+Math.cos(t/32*Math.PI*2)*.25);if(t===31)release(canvas);}
  function tick(){
    if(stopped)return;
    diagnostics.ticks++;
    const ui=window.PARTY_UI||window.parent.PARTY_UI,phase=ui?.phase;
    if(!online()||paused()||document.hidden||!phase||['waiting','countdown','results','reveal'].includes(phase)&&game!=='spy'){diagnostics.mode='waiting';releaseAll();return;}
    diagnostics.mode='playing';
    for(const [fn,at]of pending)if(performance.now()>=at){pending.delete(fn);fn();}
    for(const e of [...held.keys()])if(!available(e)||!e.isConnected)release(e);
    const now=performance.now(),t=now/1000+seed%50,slow=now-lastAction>pace;
    let board;try{board=window.parent.parent.document.getElementById('gameFrame')?.contentWindow.PARTY_BOT_VIEW;}catch{}
    const plan=window.PartyBotPolicy?.decide(game,board||window.PARTY_BOT_SELF,profile,t);
    if(plan)diagnostics.decisions++;
    const steer=(selector,fallback=.24)=>{const a=plan?.axis;hold(q(selector),.5+(a?a.x*fallback:Math.sin(t*.6)*.19),.5+(a?a.y*fallback:Math.cos(t*.6)*.19));};
    // Continuous input is refreshed more often than the server's 450ms cutoff.
    if(['push','shrink','bomb'].includes(game))steer('#joystickZone');
    if(game==='tankarena'){hold(q('#joy'),.5+Math.sin(t*.5)*.22,.5+Math.cos(t*.5)*.22);hold(q('#fire'));}
    if(game==='airhockey'){
      const view=board||window.PARTY_BOT_SELF,me=view?.players?.find(p=>p.id===profile.id);if(me)hold(q('#hockeyJoy'),.5+Math.sin(t*.6)*.2,.5+(view.puck?Math.max(-.25,Math.min(.25,(view.puck.y-me.y)/300)):Math.sin(t)*.2));
    }
    if(game==='tanks'){if(t%6<4)hold(q('#forwardBtn'));else release(q('#forwardBtn'));hold(q('#fireBtn'));}
    if(game==='kart'){hold(q('#gasBtn'));hold(q('#wheelPad'),.5+Math.sin(t*.45)*.17,.5);}
    if(game==='chaos'){hold(q('.vector-pad'),.5+Math.sin(t*.3)*.06,.5+Math.cos(t*.3)*.06);}
    if(game==='jenga')hold(q('#jengaJoystick'),.5,.77);
    if(game==='monster')draw(q('#drawCanvas'));
    if(game==='drawguess'&&q('#canvas.canDraw'))draw(q('#canvas'));
    if(['hungry','carryball','snakelines'].includes(game))steer('#joy',.30);
    if(game==='taprace')tap('#action');
    if(game==='flappy'&&(plan?plan.flap:now-lastAction>510)&&now-lastAction>240){tap('#action');lastAction=now;}
    if(game==='western'&&plan?.fire&&now-lastAction>300){tap('#fireBtn');lastAction=now;}
    if(!slow)return;lastAction=now;
    if(game==='poker')click('#call');
    if(game==='mines'){if(!click('#mineOpen')||Math.floor(t)%3)click(`[data-direction="${['up','right','down','left'][(seed+Math.floor(t))%4]}"]`);}
    if(game==='carryball'&&plan?.pass)tap('#action');
    if(game==='punchmeter'){const e=q('#action');if(available(e)){hold(e);later(()=>release(e),650+seed%180);}}
    if(game==='knives')tap('#throwBtn');
    if(game==='western_duel'&&q('#fire.ready'))tap('#fire');
    if(['warsaw','sinyakquiz','millionaire'].includes(game)){const answers=[...document.querySelectorAll(game==='millionaire'?'#phoneAnswers button:not(:disabled)':'#answers button:not(:disabled)')].filter(available),answer=answers[(seed+Math.floor(t/pace*1000))%answers.length];if(answer){answer.click();diagnostics.actions++;}}
    if(game==='crocodile')click('#guessed');
    if(game==='crane'){releaseAll();tap('#drop');}
    if(game==='jenga'&&!q('#blocks .selected'))click('#blocks button:not(:disabled)');
    if(game==='naval')click('#grid button:not(.hit):not(.miss):not(.sunk):not(:disabled)');
    if(game==='chaos'){const e=q('#controlArea .ctrl');if(available(e)){hold(e);later(()=>release(e),350);}}
    if(game==='marble_bloom'){const me=window.PARTY_BOT_SELF?.players?.find(p=>p.id===profile.id||p.name===profile.name),aim=me?.aim||{x:700,y:190};hold(q('#aimpad'),.5,.5);hold(q('#aimpad'),.5+(plan?.aim?(plan.aim.x-aim.x)/1280:Math.sin(t*.7)*.2),.5+(plan?.aim?(plan.aim.y-aim.y)/1280:Math.cos(t*.7)*.1));release(q('#aimpad'));tap('#marbleFire');}
    if(game==='pocket_siege'&&available(q('#tankFire'))){for(const [id,value]of [['angle',plan?.angle??(35+(seed+Math.floor(t))%110)],['power',plan?.power??(55+seed%36)]]){const e=q('#'+id);e.value=String(value);e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));}click('#tankFire');}
    if(game==='bow_club'){
      const targets=window.PARTY_BOT_SELF?.targets||[],target=targets[(seed+drawStep++)%targets.length],pad=q('#touchPad');
      if(target&&available(pad)){hold(pad,target.u,target.v);release(pad);}
      const draw=q('#draw');if(available(draw)){hold(draw);later(()=>release(draw),700+seed%180);}
    }
    if(game==='monster'){release(q('#drawCanvas'));if(!click('#confirmSubmit'))click('#doneBtn');}
    if(game==='drawguess'){
      const input=q('#guess');if(available(input)){input.value=['кот','дом','солнце','дерево','машина'][Math.floor(t/2.2)%5];input.dispatchEvent(new Event('input',{bubbles:true}));q('#guessForm')?.requestSubmit();}
    }
    if(game==='spy'){
      // Readiness requires an actual hold gesture. Never inspect the secret text.
      const secret=q('#secretCard');if(available(secret)){hold(secret);later(()=>{click('#readyBtn');release(secret);},350);}
      click('#nextTurnPhone');
      // Vote directly through the same player API, without opening a hidden confirm.
      const option=q('#voteList [data-vote]:not(:disabled)');if(available(option))for(const s of window.PARTY_TEST_CONNECTIONS.io)if(s.connected)s.emit('player:vote',{targetId:option.dataset.vote});
    }
  }
  window.PARTY_BOT_TICK=tick;
  window.addEventListener('pagehide',()=>{stopped=true;window.PARTY_BOT_TICK=null;releaseAll();});
  window.addEventListener('offline',releaseAll);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)releaseAll();});
})();
