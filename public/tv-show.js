/* Presentation only. Server is authoritative for permissions, focus and results. */
(() => {
  'use strict';
  const revision='tv-show-20260918.1';
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  const make=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;};
  // Place #1 centrally, then #2 left, #3 right, #4 left, #5 right, ...
  function podiumOrder(rows) {const out=[];rows.forEach((r,i)=>i%2?out.unshift(r):out.push(r));return out;}
  const crown='<svg viewBox="0 0 64 48" fill="none" aria-hidden="true"><path d="m8 12 13 11L32 5l11 18 13-11-7 29H15L8 12Z" fill="url(#crownGold)" stroke="#fff0bf" stroke-width="2"/><path d="M17 34h30" stroke="#775721" stroke-width="3"/><defs><linearGradient id="crownGold" x1="13" y1="5" x2="49" y2="41" gradientUnits="userSpaceOnUse"><stop stop-color="#fff8d2"/><stop offset=".43" stop-color="#ffe593"/><stop offset="1" stop-color="#aa7234"/></linearGradient></defs></svg>';
  const safeAvatar=value=>typeof value==='string'&&value.length<145000&&/^data:image\/(jpeg|png|webp);base64,[A-Za-z\d+/]+=*$/.test(value);
  const number=value=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:1}).format(Number.isFinite(value)?value:0);

  function create(stage) {
    const loader=document.getElementById('tvStartup'),presentation=document.getElementById('tvPresentation'),qrCard=document.getElementById('tvLargeInvite'),podium=document.getElementById('tvPodium'),transition=document.getElementById('tvSceneTransition');
    let state=null,connected=false,done=false,started=performance.now(),boot=null,lastInstance=null,lastPaused=null;
    let startupTimer=0,startupFinish=0,overlayMode='none',overlayGeneration=0,overlayAnimation=null,boardKey='',effects=null;
    let focusRevision=-1,transitionGeneration=0,transitionTimer=0,transitionAnimation=null;
    const text=(id,value)=>{const n=document.getElementById(id);if(n&&n.textContent!==String(value))n.textContent=value;};
    function animate(el,frames,options={}) {
      if(!el||reduced()||typeof el.animate!=='function')return null;
      return el.animate(frames,{duration:420,easing:'cubic-bezier(.16,1,.3,1)',...options});
    }
    function revealLobby() {
      const candidates=[stage.querySelector('.tv-header'),...stage.querySelectorAll('#tvBrowse>.intro,#tvBrowse>.tv-choice,#tvCatalog>section,#tvSidebar>section')].filter(el=>el&&!el.hidden&&el.getClientRects().length);
      candidates.sort((a,b)=>a.getBoundingClientRect().top-b.getBoundingClientRect().top);
      candidates.slice(0,9).forEach((el,i)=>animate(el,[{opacity:0,scale:.965,translate:'0 18px'},{opacity:1,scale:1,translate:'0 0'}],{duration:560,delay:i*70}));
    }
    function finishStartup(immediate=false) {
      if(done)return;done=true;clearTimeout(startupTimer);clearTimeout(startupFinish);
      text('tvLoadProgress','100');document.getElementById('tvLoadBar').style.setProperty('--progress','1');
      loader.querySelector('[role=progressbar]').setAttribute('aria-valuenow','100');
      const end=()=>{loader.hidden=true;stage.classList.add('tv-show-ready');if(!state?.active)revealLobby();};
      if(immediate||reduced())end();else{animate(loader,[{opacity:1},{opacity:0}],{duration:300});startupFinish=setTimeout(end,300);}
      try{sessionStorage.setItem('lp-tv-intro:'+boot,'1');}catch{ /* private storage may be denied */ }
    }
    function tickStartup() {
      if(done)return;
      const elapsed=performance.now()-started,ready=connected&&!!state?.catalog?.length;
      if(state?.active){finishStartup(true);return;}
      if(ready&&(elapsed>=2400||reduced())){finishStartup();return;}
      const progress=Math.min(ready?97:88,Math.round((1-Math.exp(-elapsed/1050))*100));
      text('tvLoadProgress',progress);document.getElementById('tvLoadBar').style.setProperty('--progress',String(progress/100));loader.querySelector('[role=progressbar]').setAttribute('aria-valuenow',String(progress));
      text('tvLoadStatus',!connected?(elapsed>8000?'Ждём связь с iPhone…':'Соединяем общий экран…'):!state?.catalog?.length?'Получаем каталог игр…':'Собираем интерфейс вечера…');
      startupTimer=setTimeout(tickStartup,80);
    }
    function showTransition(title,{wait=false}={}) {
      const generation=++transitionGeneration;clearTimeout(transitionTimer);transitionAnimation?.cancel();transition.hidden=false;text('tvTransitionTitle',title);
      transitionAnimation=animate(transition,[{opacity:0},{opacity:1}],{duration:120});
      const leave=()=>{if(transitionGeneration!==generation)return;transitionAnimation?.cancel();transitionAnimation=animate(transition,[{opacity:1},{opacity:0}],{duration:260});transitionTimer=setTimeout(()=>{if(transitionGeneration===generation)transition.hidden=true;},reduced()?0:270);};
      transitionTimer=setTimeout(leave,wait?900:180);
    }
    function updatePause() {
      const paused=!!state?.active?.session?.paused,layer=document.getElementById('paused');
      if(lastPaused!==null&&lastPaused!==paused&&state?.active) {
        if(paused){layer.hidden=false;animate(layer,[{opacity:0,scale:.985},{opacity:1,scale:1}],{duration:320});}
        else showTransition('Продолжаем');
      }
      lastPaused=state?.active?paused:null;
    }
    // Places after the medals get cheerful party colours instead of one pale tint.
    const funColors=['#a98bff','#4fe0c8','#ff7ac3','#6fb8ff','#ffa24d','#b8f35a','#ff6f7d','#7ee7ff'];
    function buildPodium(board) {
      const photos=new Map([...(state?.leaderboard||[]),...(state?.players||[])].map(p=>[p.id,p.avatar]));
      const key=board.key+JSON.stringify(board.rows.map(r=>[r.id,r.name,photos.get(r.id)]));
      if(key===boardKey)return;boardKey=key;
      text('tvBoardTitle',board.title);text('tvBoardSubtitle',board.subtitle);
      const rows=board.rows.slice(0,16),mainRows=rows.slice(0,7),tailRows=rows.slice(7);
      const build=(list,tail=false)=>podiumOrder(list).map(row=>{
        const card=make('article','podium-seat'+(row.rank===1?' is-winner':''));
        card.dataset.rank=String(row.rank||0);card.setAttribute('aria-label',`${row.rank?row.rank+' место':'Участник'}: ${row.name}`);
        const hue=row.rank===1?'#ffd45c':row.rank===2?'#dfe6f5':row.rank===3?'#e89a62':funColors[((row.rank||4)-4)%funColors.length];card.style.setProperty('--medal',hue);if(row.rank>=1&&row.rank<=3)card.classList.add('is-medal');
        const h=tail?52:row.rank===1?194:row.rank===2?148:row.rank===3?119:Math.max(58,100-(row.rank||9)*6);card.style.setProperty('--plinth-height',h+'px');
        const portrait=make('div','podium-portrait');portrait.append(make('span','podium-initial',Array.from(row.name||'?')[0].toUpperCase()));
        if(safeAvatar(photos.get(row.id))){const img=new Image();img.src=photos.get(row.id);img.alt='';img.onerror=()=>img.remove();portrait.append(img);}
        if(row.rank===1){const decoration=make('div','podium-crown');decoration.innerHTML=crown.replaceAll('crownGold','gold-'+row.id.replace(/[^a-zA-Z0-9]/g,''));portrait.append(decoration);}
        const name=make('h3','podium-name',row.name);name.title=row.name;
        const base=make('div','podium-plinth');base.append(make('strong','podium-rank',row.rank?String(row.rank):'—'),make('span','podium-points',number(row.points??row.score)),make('small','',board.kind==='company'?'очков':'счёт игры'));
        card.append(portrait,name,base);return card;
      });
      const main=document.getElementById('tvPodiumMain'),tail=document.getElementById('tvPodiumTail');
      main.style.setProperty('--seats',String(mainRows.length));tail.style.setProperty('--seats',String(tailRows.length||1));
      main.replaceChildren(...build(mainRows));tail.replaceChildren(...build(tailRows,true));tail.hidden=!tailRows.length;podium.classList.toggle('has-tail',!!tailRows.length);
      // Lowest places arrive first; the winning centre follows with a small flourish.
      for(const el of podium.querySelectorAll('.podium-seat')) {
        const rank=Number(el.dataset.rank)||16;animate(el,[{opacity:0,translate:'0 28px',scale:.97},{opacity:1,translate:'0 0',scale:1}],{duration:620,delay:Math.max(0,8-Math.min(8,rank))*70});
      }
    }
    function updateOverlay() {
      const mode=state?.tv?.mode||'none',board=state?.tv?.board,validMode=mode==='podium'&&!board?'none':mode;
      const url=state?.networkEnabled!==false?state?.urls?.[0]||'':'';
      const qr=document.getElementById('tvLargeQR');
      if(url&&qr.dataset.url!==url){qr.dataset.url=url;qr.src='/api/qr?size=large&url='+encodeURIComponent(url);}
      text('tvLargeAddress',url);text('tvInviteCount',`${state?.players?.length||0} / 16 уже в компании`);
      if(validMode==='podium')buildPodium(board);
      if(validMode!==overlayMode){
        overlayMode=validMode;const generation=++overlayGeneration;overlayAnimation?.cancel();
        if(validMode==='none'){
          effects?.stop();
          if(!presentation.hidden){overlayAnimation=animate(presentation,[{opacity:1,scale:1},{opacity:0,scale:.975}],{duration:240});setTimeout(()=>{if(overlayGeneration===generation){presentation.hidden=true;qrCard.hidden=true;podium.hidden=true;}},reduced()?0:250);}
        }else{
          presentation.hidden=false;qrCard.hidden=validMode!=='qr';podium.hidden=validMode!=='podium';
          overlayAnimation=animate(presentation,[{opacity:0,scale:.975},{opacity:1,scale:1}],{duration:420});
        }
      }
      if(validMode==='podium'&&state.tv.effects&&!reduced()&&!document.hidden){try{effects ||= new CelebrationFX(document.getElementById('tvShader'),document.getElementById('tvFireworks'));effects.start();}catch{effects?.stop(); /* Static shaded stage remains available. */ }}
      else effects?.stop();
    }
    function followFocus() {
      const tv=state?.tv;if(!tv||focusRevision===tv.focusRevision||state.active)return;
      focusRevision=tv.focusRevision;if(!tv.browse||!tv.focusId)return;
      const card=[...stage.querySelectorAll('#tvCatalog .game')].find(n=>n.dataset.id===tv.focusId);if(!card)return;
      const view=document.getElementById('tvBrowse');const scale=stage.getBoundingClientRect().height/stage.offsetHeight||1;
      const rail=card.parentElement;
      if(rail.classList.contains('fresh-track'))rail.scrollTo({left:rail.scrollLeft+(card.getBoundingClientRect().left-rail.getBoundingClientRect().left)/scale-20,behavior:reduced()?'auto':'smooth'});
      view.scrollTo({top:Math.max(0,view.scrollTop+(card.getBoundingClientRect().top-view.getBoundingClientRect().top)/scale-36),behavior:reduced()?'auto':'smooth'});
      animate(card,[{filter:'brightness(1.3)'},{filter:'brightness(1)'}],{duration:540});
    }
    function update(next) {
      state=next;
      if(!boot&&state?.bootId){boot=state.bootId;try{if(sessionStorage.getItem('lp-tv-intro:'+boot))finishStartup(true);}catch{}}
      const instance=state?.active?.instance||null;
      if(lastInstance!==instance){if(done)showTransition(instance?(state.catalog.find(g=>g.id===state.active.id)?.title||'Готовим игру'):'В компанию',{wait:!!instance});lastInstance=instance;}
      updatePause();updateOverlay();requestAnimationFrame(followFocus);
      if(!done&&state?.active)finishStartup(true);
    }
    const onVisibility=()=>{if(document.hidden)effects?.stop();else updateOverlay();};
    document.addEventListener('visibilitychange',onVisibility);
    const onPreference=()=>{if(reduced()&&!done&&connected&&state?.catalog?.length)finishStartup(true);updateOverlay();};
    const media=matchMedia('(prefers-reduced-motion: reduce)');media.addEventListener?.('change',onPreference);
    window.addEventListener('pagehide',()=>{effects?.destroy();clearTimeout(startupTimer);clearTimeout(startupFinish);clearTimeout(transitionTimer);overlayAnimation?.cancel();transitionAnimation?.cancel();});
    tickStartup();
    return Object.freeze({update,setConnected(value){connected=value;},canIdle:()=>done&&overlayMode==='none'&&!state?.tv?.browse&&state?.tv?.idleBrowse!==false,
      gameLoaded(){/* Transitions are short visual covers, never a gate on readiness. */},diagnostics:()=>({revision,ready:done,overlay:overlayMode,effectsRunning:!!effects?.running,particles:effects?.particles?.length||0,renderer:effects?.gl?'webgl2':'css-canvas'}),revision});
  }

  /** Procedural stage shading + bounded, ballistic sparkle trails. No dependency,
   * audio, flashing full-screen white, or idle game-loop. GPU use is optional. */
  class CelebrationFX {
    constructor(back,front){this.back=back;this.front=front;this.ctx=front.getContext('2d');this.gl=null;this.frame=0;this.running=false;this.particles=[];this.last=0;this.started=0;this.nextBurst=0;this.initGL();}
    initGL(){
      const gl=this.back.getContext('webgl2',{alpha:true,antialias:false,depth:false,powerPreference:'low-power'});if(!gl)return;
      const vertex=`#version 300 es\nin vec2 p;out vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}`;
      const fragment=`#version 300 es
precision highp float;in vec2 uv;out vec4 outColor;uniform float t;uniform float aspect;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
void main(){vec2 p=(uv-.5)*vec2(aspect,1.);float n=noise(p*2.6+vec2(t*.035,-t*.02));float silk=sin(p.x*5.8+p.y*2.+n*4.+t*.16)*.5+.5;
float beam=exp(-abs(p.x+sin(p.y*3.+t*.1)*.12)*3.)*(.4+.6*silk);float ring=exp(-abs(length(p*vec2(.7,1.))- .33)*24.);
vec3 a=vec3(.045,.12,.13),b=vec3(.17,.075,.25),gold=vec3(.55,.38,.15);vec3 col=mix(a,b,silk)*(.5+.5*n)+gold*beam*.32+vec3(.17,.2,.1)*ring*.38;
col*=(1.-smoothstep(.18,.87,length(p*vec2(.5,1.))));outColor=vec4(col,1.);}`;
      const compile=(type,code)=>{const s=gl.createShader(type);gl.shaderSource(s,code);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){gl.deleteShader(s);return null;}return s;};
      const vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment);if(!vs||!fs){if(vs)gl.deleteShader(vs);if(fs)gl.deleteShader(fs);return;}
      const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);if(!gl.getProgramParameter(program,gl.LINK_STATUS)){gl.deleteProgram(program);return;}
      gl.useProgram(program);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
      const loc=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
      this.gl=gl;this.program=program;this.buffer=buffer;this.timeUniform=gl.getUniformLocation(program,'t');this.aspectUniform=gl.getUniformLocation(program,'aspect');
      this.back.addEventListener('webglcontextlost',()=>{this.gl=null;},{once:true});
    }
    size(){const parent=this.front.parentElement,w=Math.max(1,parent.offsetWidth),h=Math.max(1,parent.offsetHeight);this.w=w;this.h=h;
      this.front.width=Math.min(1280,w);this.front.height=Math.round(h*this.front.width/w);this.ctx?.setTransform(this.front.width/w,0,0,this.front.height/h,0,0);
      this.back.width=Math.min(960,w);this.back.height=Math.round(h*this.back.width/w);this.gl?.viewport(0,0,this.back.width,this.back.height);
    }
    burst(now){const x=this.w*(Math.random()<.5?.12+Math.random()*.18:.7+Math.random()*.18),y=this.h*(.15+Math.random()*.27),hue=Math.random()<.6?43:155;
      for(let i=0;i<56&&this.particles.length<280;i++){const a=i/56*Math.PI*2,s=48+Math.random()*95;this.particles.push({x,y,px:x,py:y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1.4+Math.random(),age:0,hue:hue+Math.random()*12});}
      this.nextBurst=now+850+Math.random()*650;
    }
    draw(now){if(!this.running)return;this.frame=requestAnimationFrame(t=>this.draw(t));if(now-this.last<33)return;const dt=Math.min(.06,(now-this.last)/1000||.033);this.last=now;
      if(this.front.parentElement.offsetWidth!==this.w||this.front.parentElement.offsetHeight!==this.h)this.size();
      if(this.gl){const gl=this.gl;gl.uniform1f(this.timeUniform,(now-this.started)/1000);gl.uniform1f(this.aspectUniform,this.w/this.h);gl.drawArrays(gl.TRIANGLES,0,6);}
      const c=this.ctx;if(!c)return;c.clearRect(0,0,this.w,this.h);c.globalCompositeOperation='lighter';c.lineCap='round';
      if(now<this.started+7800&&now>this.nextBurst)this.burst(now);
      for(const p of this.particles){p.age+=dt;p.px=p.x;p.py=p.y;p.vx*=Math.exp(-.75*dt);p.vy=p.vy*Math.exp(-.35*dt)+38*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;
        const alpha=Math.max(0,1-p.age/p.life);c.strokeStyle=`hsla(${p.hue},80%,72%,${alpha*.75})`;c.lineWidth=1.4;c.beginPath();c.moveTo(p.px-p.vx*.05,p.py-p.vy*.05);c.lineTo(p.x,p.y);c.stroke();c.fillStyle=`hsla(${p.hue},70%,85%,${alpha})`;c.beginPath();c.arc(p.x,p.y,1.2,0,Math.PI*2);c.fill();}
      this.particles=this.particles.filter(p=>p.age<p.life);c.globalCompositeOperation='source-over';
    }
    start(){if(this.running)return;this.running=true;this.started=performance.now();this.last=0;this.nextBurst=this.started+500;this.size();this.frame=requestAnimationFrame(t=>this.draw(t));}
    stop(){if(!this.running)return;this.running=false;cancelAnimationFrame(this.frame);this.frame=0;this.particles=[];this.ctx?.clearRect(0,0,this.w,this.h);}
    destroy(){this.stop();if(this.gl){this.gl.deleteBuffer(this.buffer);this.gl.deleteProgram(this.program);this.gl.getExtension('WEBGL_lose_context')?.loseContext();this.gl=null;}}
  }
  window.LocalPartyShow=Object.freeze({create,podiumOrder,revision});
})();
