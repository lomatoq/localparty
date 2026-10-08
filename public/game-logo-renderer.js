/* Display the untouched HD wordmarks with deliberate downsampling. CSS-sized
   transparent textures otherwise leave sharp colour fringes at tiny sizes. */
(()=>{
 'use strict';
 const selector='img.waiting-game-logo,img[data-hp-game-logo]',records=new WeakMap(),pending=new Set();let frame=0;
 function surface(width,height){const c=document.createElement('canvas');c.width=width;c.height=height;const ctx=c.getContext('2d',{alpha:true});if(ctx){ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';}return{canvas:c,ctx};}
 function release(img){const record=records.get(img);record?.observer.disconnect();record?.canvas.remove();records.delete(img);pending.delete(img);img.style.removeProperty('opacity');delete img.dataset.hpLogoSmooth;}
 function draw(img){
  // Keep the real wordmark in every masked, responsive catalogue. Replacing
  // it with a separately painted canvas can leave a blank card after a resize.
  // The original image shares the card's layout and clipping directly.
  if(img.matches('.lp-card-game-logo')){release(img);return;}
  if(!img.isConnected||!img.complete||!img.naturalWidth)return;
  const style=getComputedStyle(img),width=parseFloat(style.width)||img.clientWidth,height=parseFloat(style.height)||img.clientHeight;let record=records.get(img);
  if(record&&record.canvas.parentElement!==img.parentElement){release(img);record=undefined;}
  if(!img.getClientRects().length||width<1||height<1){if(record)record.canvas.hidden=true;return;}
  // The TV stage uses CSS zoom to fit1080p. Size the bitmap for those physical
  // pixels while keeping its positioning in local layout coordinates below.
  let zoom=1;for(let node=img;node;node=node.parentElement)zoom*=parseFloat(getComputedStyle(node).zoom)||1;
  const ratio=Math.min(devicePixelRatio||1,3)*zoom,w=Math.max(1,Math.round(width*ratio)),h=Math.max(1,Math.round(height*ratio));
  if(!record){
   const parent=img.parentElement;if(getComputedStyle(parent).position==='static')parent.style.position='relative';
   if(parent.tagName==='A')parent.style.display='block';
   const {canvas,ctx}=surface(w,h);if(!ctx)return;
   canvas.className='hp-smooth-game-logo';canvas.setAttribute('aria-hidden','true');Object.assign(canvas.style,{position:'absolute',pointerEvents:'none',maxWidth:'none',margin:'0',imageRendering:'auto'});
   parent.append(canvas);const observer=new ResizeObserver(()=>queue(img));record={canvas,ctx,key:'',observer};records.set(img,record);observer.observe(img);
  }
  // Local layout coordinates let the logo and its painted copy share ancestor
  // entrance/FLIP transforms once; screen rectangles would apply them twice.
  record.canvas.hidden=false;
  Object.assign(record.canvas.style,{left:img.offsetLeft+'px',top:img.offsetTop+'px',width:width+'px',height:height+'px'});
  const key=[w,h,img.currentSrc,style.objectPosition].join(':');if(key===record.key)return;record.key=key;
  record.canvas.width=w;record.canvas.height=h;record.ctx.imageSmoothingEnabled=true;record.ctx.imageSmoothingQuality='high';
  const fit=Math.min(w/img.naturalWidth,h/img.naturalHeight),dw=Math.max(1,Math.round(img.naturalWidth*fit)),dh=Math.max(1,Math.round(img.naturalHeight*fit));
  let source=img,sw=img.naturalWidth,sh=img.naturalHeight;
  // Each step reduces by at most two. The final draw lands on whole physical
  // pixels, with high-quality filtering and correct transparent compositing.
  while(sw>dw*2&&sh>dh*2){const next=surface(Math.max(dw,Math.round(sw/2)),Math.max(dh,Math.round(sh/2)));if(!next.ctx)break;next.ctx.drawImage(source,0,0,next.canvas.width,next.canvas.height);source=next.canvas;sw=source.width;sh=source.height;}
  const position=style.objectPosition.split(/\s+/),axis=(token,free)=>token==='left'||token==='top'?0:token==='right'||token==='bottom'?free:/^-?\d+(?:\.\d+)?%$/.test(token)?free*parseFloat(token)/100:free/2;
  record.ctx.clearRect(0,0,w,h);record.ctx.drawImage(source,Math.round(axis(position[0],w-dw)),Math.round(axis(position[1]||'50%',h-dh)),dw,dh);
  img.style.opacity='0';img.dataset.hpLogoSmooth='ready';
 }
 function flush(){frame=0;for(const img of pending)draw(img);pending.clear();}
 function queue(img){if(img.matches('.lp-card-game-logo')){if(records.has(img))release(img);return;}pending.add(img);if(!frame)frame=requestAnimationFrame(flush);}
 function images(node){return node instanceof Element?[...(node.matches(selector)?[node]:[]),...node.querySelectorAll(selector)]:[];}
 function scan(node){for(const img of images(node)){if(!img.dataset.hpLogoWatched){img.dataset.hpLogoWatched='true';img.addEventListener('load',()=>{release(img);queue(img);});img.addEventListener('error',()=>release(img));}queue(img);}}
 scan(document.body);new MutationObserver(events=>{for(const e of events){if(e.type==='attributes'){e.target.querySelectorAll?.(selector).forEach(queue);}else{e.removedNodes.forEach(node=>images(node).filter(img=>!img.isConnected).forEach(release));e.addedNodes.forEach(scan);}}}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','open']});
 window.addEventListener('resize',()=>document.querySelectorAll(selector).forEach(queue));
})();
