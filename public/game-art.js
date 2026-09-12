/* Shared, cached presentation assets. Simulation never depends on image loading. */
(() => {
  'use strict';
  const base='/assets/gameplay/', images=new Map(), tinted=new Map();
  let manifest=null;
  const load=path=>{if(images.has(path))return images.get(path);const image=new Image();image.src=base+path+"?v="+encodeURIComponent(manifest?.revision||manifest?.version||1);images.set(path,image);return image;};
  const valid=image=>image?.complete&&image.naturalWidth>0;
  const ready=fetch(base+'manifest.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Gameplay manifest unavailable');return r.json();}).then(data=>{manifest=data;return data;}).catch(()=>null);
  function sprite(key,color){
    const item=manifest?.frames?.[key];if(!item)return null;const source=load(item.atlas);if(!valid(source))return null;
    const f=item.frame;if(!color||!item.tintMask)return {image:source,x:f.x,y:f.y,w:f.w,h:f.h};
    const cacheKey=key+':'+color;if(tinted.has(cacheKey))return tinted.get(cacheKey);
    const mask=load(item.tintMask);if(!valid(mask))return {image:source,x:f.x,y:f.y,w:f.w,h:f.h};
    const canvas=document.createElement('canvas');canvas.width=f.w;canvas.height=f.h;const ctx=canvas.getContext('2d');ctx.drawImage(source,f.x,f.y,f.w,f.h,0,0,f.w,f.h);
    const layer=document.createElement('canvas');layer.width=f.w;layer.height=f.h;const paint=layer.getContext('2d');paint.drawImage(mask,0,0,f.w,f.h);paint.globalCompositeOperation='source-in';paint.fillStyle=color;paint.fillRect(0,0,f.w,f.h);ctx.globalCompositeOperation='multiply';ctx.drawImage(layer,0,0);ctx.globalCompositeOperation='destination-in';ctx.drawImage(source,f.x,f.y,f.w,f.h,0,0,f.w,f.h);
    const result={image:canvas,x:0,y:0,w:f.w,h:f.h};if(tinted.size>256)tinted.delete(tinted.keys().next().value);tinted.set(cacheKey,result);return result;
  }
  function draw(ctx,key,x,y,width,height=width,options={}){const item=sprite(key,options.color);if(!item)return false;ctx.save();ctx.translate(x,y);if(options.rotation)ctx.rotate(options.rotation);if(options.alpha!=null)ctx.globalAlpha*=options.alpha;ctx.scale(options.flipX?-1:1,1);const pivot=options.pivot||manifest?.frames?.[key]?.pivot||{x:.5,y:.5};ctx.drawImage(item.image,item.x,item.y,item.w,item.h,-width*pivot.x,-height*pivot.y,width,height);ctx.restore();return true;}
  const surfaces=new WeakMap();
  function beginFrame(ctx,width,height){
    const canvas=ctx.canvas;let surface=surfaces.get(canvas);
    if(!surface){surface={width:0,height:0,dirty:true};surfaces.set(canvas,surface);new ResizeObserver(()=>surface.dirty=true).observe(canvas);}
    const dpr=Math.min(2,window.devicePixelRatio||1);
    if(surface.dirty||surface.dpr!==dpr||surface.logicalWidth!==width||surface.logicalHeight!==height){
      const rect=canvas.getBoundingClientRect(),fit=Math.min(rect.width/width,rect.height/height);
      const scale=Math.min(Math.max(1,fit*dpr),Math.sqrt(5000000/(width*height)));
      surface.width=Math.round(width*scale);surface.height=Math.round(height*scale);surface.dpr=dpr;surface.logicalWidth=width;surface.logicalHeight=height;surface.dirty=false;
    }
    if(canvas.width!==surface.width||canvas.height!==surface.height){canvas.width=surface.width;canvas.height=surface.height;}
    ctx.setTransform(canvas.width/width,0,0,canvas.height/height,0,0);
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    return canvas.width/width;
  }
  window.PartyArt={ready,draw,sprite,beginFrame,preload(keys){for(const key of keys){const frame=manifest?.frames?.[key];if(frame){load(frame.atlas);if(frame.tintMask)load(frame.tintMask);}}},has:key=>!!manifest?.frames?.[key],get manifest(){return manifest;}};
})();



