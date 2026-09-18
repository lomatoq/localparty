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
    // Canvas at the screen's real pixel size (not the 1280 logical stage), so glows stay sharp.
    size(){const parent=this.front.parentElement,w=Math.max(1,parent.offsetWidth),h=Math.max(1,parent.offsetHeight),box=this.front.getBoundingClientRect();this.w=w;this.h=h;
      const px=Math.min(1920,Math.max(w,Math.round(box.width*(window.devicePixelRatio||1))));
      this.front.width=px;this.front.height=Math.round(h*px/w);this.ctx?.setTransform(this.front.width/w,0,0,this.front.height/h,0,0);
      this.back.width=Math.min(960,w);this.back.height=Math.round(h*this.back.width/w);this.gl?.viewport(0,0,this.back.width,this.back.height);
    }
    // Pre-rendered glow sprites: the gradient reaches full transparency inside the sprite,
    // so a spark can never show a cut square edge.
    sprites(){if(this.glow)return this.glow;const make=color=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),r=g.createRadialGradient(32,32,0,32,32,31);
      r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.16,color);r.addColorStop(.42,color+'66');r.addColorStop(1,color+'00');g.fillStyle=r;g.fillRect(0,0,64,64);return c;};
      this.palette=['#ffd45c','#ff7ac3','#4fe0c8','#a98bff','#b8f35a','#6fb8ff','#ff6f7d','#fff1c9'];this.glow=this.palette.map(make);return this.glow;}
    spawn(p){if(this.particles.length<280)this.particles.push({age:0,px:p.x,py:p.y,drag:1.4,gravity:60,size:10,twinkle:false,flash:false,...p});}
    launch(){const side=Math.random()<.5,x=this.w*(side?.08+Math.random()*.26:.66+Math.random()*.26);
      this.spawn({kind:'rocket',x,y:this.h+8,vx:(this.w*.5-x)*.08*Math.random(),vy:-(this.h*(1.05+Math.random()*.35)),drag:.2,gravity:this.h*.62,life:3,size:9,color:7,apex:this.h*(.1+Math.random()*.28)});}
    explode(r){const S=this.h*.34,type=Math.random(),color=Math.floor(Math.random()*7),alt=(color+2+Math.floor(Math.random()*4))%7;
      this.spawn({x:r.x,y:r.y,vx:0,vy:0,life:.28,size:150,color,flash:true,gravity:0});
      if(type<.42){for(let i=0;i<62;i++){const a=Math.random()*Math.PI*2,v=S*(.55+Math.random()*.45);this.spawn({x:r.x,y:r.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:1.3+Math.random()*.7,size:11+Math.random()*5,color:i%5?color:alt});}}
      else if(type<.72){for(let i=0;i<44;i++){const a=i/44*Math.PI*2,v=S*.92;this.spawn({x:r.x,y:r.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:1.4,size:12,color});}
        for(let i=0;i<14;i++){const a=i/14*Math.PI*2,v=S*.42;this.spawn({x:r.x,y:r.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:1.1,size:10,color:7});}}
      else{for(let i=0;i<54;i++){const a=Math.random()*Math.PI*2,v=S*(.35+Math.random()*.5);this.spawn({x:r.x,y:r.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-S*.1,life:2.4+Math.random()*.9,size:9+Math.random()*3,color:0,drag:1.05,gravity:34,twinkle:true});}}}
    draw(now){if(!this.running)return;this.frame=requestAnimationFrame(t=>this.draw(t));if(now-this.last<33)return;const dt=Math.min(.06,(now-this.last)/1000||.033);this.last=now;
      if(this.front.parentElement.offsetWidth!==this.w||this.front.parentElement.offsetHeight!==this.h)this.size();
      if(this.gl){const gl=this.gl;gl.uniform1f(this.timeUniform,(now-this.started)/1000);gl.uniform1f(this.aspectUniform,this.w/this.h);gl.drawArrays(gl.TRIANGLES,0,6);}
      const c=this.ctx;if(!c)return;const glow=this.sprites(),elapsed=now-this.started;
      // Fade the previous frame instead of clearing it: soft trails behind every spark.
      c.globalCompositeOperation='destination-out';c.globalAlpha=1;c.fillStyle='rgba(0,0,0,.3)';c.fillRect(0,0,this.w,this.h);
      c.globalCompositeOperation='lighter';
      if(elapsed<11000&&now>this.nextBurst){this.launch();if(elapsed>8600)this.launch();this.nextBurst=now+(elapsed>8600?260:480+Math.random()*520);}
      const next=[];
      for(const p of this.particles){p.age+=dt;p.px=p.x;p.py=p.y;const k=Math.exp(-p.drag*dt);p.vx*=k;p.vy=p.vy*k+p.gravity*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;
        if(p.kind==='rocket'){if(p.vy>-this.h*.12||p.y<p.apex){this.explode(p);continue;}if(this.particles.length<276)next.push({age:0,x:p.x+(Math.random()-.5)*3,y:p.y+6,px:p.x,py:p.y,vx:(Math.random()-.5)*14,vy:24,drag:2,gravity:40,life:.4,size:6,color:0});}
        if(p.age>=p.life)continue;
        let alpha=Math.pow(1-p.age/p.life,p.flash?1:1.3);if(p.twinkle)alpha*=.5+.5*Math.abs(Math.sin(p.age*23+p.x));
        const size=p.flash?p.size*(1+p.age*2):p.size*(1-.35*p.age/p.life);c.globalAlpha=Math.min(1,alpha*(p.flash?.45:1));
        if(!p.flash){c.globalAlpha*=.55;c.drawImage(glow[p.color],(p.x+p.px)/2-size*.45,(p.y+p.py)/2-size*.45,size*.9,size*.9);c.globalAlpha=Math.min(1,alpha);}
        c.drawImage(glow[p.color],p.x-size/2,p.y-size/2,size,size);next.push(p);}
      this.particles=next.slice(0,280);c.globalAlpha=1;c.globalCompositeOperation='source-over';
    }
    start(){if(this.running)return;this.running=true;this.started=performance.now();this.last=0;this.nextBurst=this.started+350;this.size();this.ctx?.clearRect(0,0,this.w,this.h);this.frame=requestAnimationFrame(t=>this.draw(t));}
    stop(){if(!this.running)return;this.running=false;cancelAnimationFrame(this.frame);this.frame=0;this.particles=[];this.ctx?.clearRect(0,0,this.w,this.h);}
    destroy(){this.stop();if(this.gl){this.gl.deleteBuffer(this.buffer);this.gl.deleteProgram(this.program);this.gl.getExtension('WEBGL_lose_context')?.loseContext();this.gl=null;}}
  }
  window.LocalPartyShow=Object.freeze({create,podiumOrder,revision});
})();
