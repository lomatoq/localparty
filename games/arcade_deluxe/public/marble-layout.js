/* A stable per-level camera: authored entrances may lie outside 1280×720.
 * Include the full reachable aim world and the track's 34px rim / gate petals.
 * This is presentation only; the simulation and phone input coordinates stay unchanged.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MarbleLayout=api;})(globalThis,function(){
 'use strict';
 function bounds(state){let left=-28,top=-28,right=1308,bottom=748;for(const p of state.path||[]){left=Math.min(left,p.x-44);top=Math.min(top,p.y-44);right=Math.max(right,p.x+44);bottom=Math.max(bottom,p.y+44);}return {left,top,right,bottom,width:right-left,height:bottom-top};}
 function fit(state,rect){const b=bounds(state),scale=Math.min(rect.w/b.width,rect.h/b.height);return {scale,x:rect.x+(rect.w-b.width*scale)/2-b.left*scale,y:rect.y+(rect.h-b.height*scale)/2-b.top*scale,bounds:b,rect};}
 function inverse(view,x,y){return {x:(x-view.x)/view.scale,y:(y-view.y)/view.scale};}
 function boards(count,width,height){const gap=16,edge=16,top=48,bottom=16,w=(width-2*edge-gap)/2,rows=count===3?2:1,h=Math.min((height-top-bottom-gap*(rows-1))/rows,w*9/16+36),y=top+(height-top-bottom-h*rows-gap*(rows-1))/2;return count===2?[{x:edge,y,w,h},{x:edge+w+gap,y,w,h}]:[{x:edge,y,w,h},{x:edge+w+gap,y,w,h},{x:(width-w)/2,y:y+h+gap,w,h}];}
 return {bounds,fit,inverse,boards};
});
