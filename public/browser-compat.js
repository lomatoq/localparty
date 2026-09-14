/* Small, dependency-free fallbacks loaded before every game, including LG Chromium 87. */
(function () {
 'use strict';
 if(window.crypto && !window.crypto.randomUUID && window.crypto.getRandomValues)window.crypto.randomUUID=function(){var b=new Uint8Array(16);window.crypto.getRandomValues(b);b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;var hex=[];for(var i=0;i<16;i++)hex.push(('0'+b[i].toString(16)).slice(-2));return hex.slice(0,4).join('')+'-'+hex.slice(4,6).join('')+'-'+hex.slice(6,8).join('')+'-'+hex.slice(8,10).join('')+'-'+hex.slice(10).join('');};
 if (!Array.prototype.at) Object.defineProperty(Array.prototype,'at',{configurable:true,writable:true,value:function(index){var n=Number(index)||0;n=n<0?Math.ceil(n):Math.floor(n);if(n<0)n+=this.length;return this[n];}});
 if (window.CanvasRenderingContext2D && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect=function(x,y,w,h,radii){
   var r=Array.isArray(radii)?radii.slice():[radii===undefined?0:radii];
   if(!r.length||r.length>4)throw new RangeError('Invalid radii');
   r=r.map(function(v){if(typeof v==='object')v=Math.min(v.x,v.y);v=Number(v);if(v<0)throw new RangeError('Negative radius');return v;});
   if(r.length===1)r=[r[0],r[0],r[0],r[0]];else if(r.length===2)r=[r[0],r[1],r[0],r[1]];else if(r.length===3)r=[r[0],r[1],r[2],r[1]];
   if(w<0){x+=w;w=-w;r=[r[1],r[0],r[3],r[2]];}if(h<0){y+=h;h=-h;r=[r[3],r[2],r[1],r[0]];}
   var scale=Math.min(1,w/(r[0]+r[1]||1),w/(r[2]+r[3]||1),h/(r[0]+r[3]||1),h/(r[1]+r[2]||1));r=r.map(function(v){return v*scale;});
   this.moveTo(x+r[0],y);this.lineTo(x+w-r[1],y);this.quadraticCurveTo(x+w,y,x+w,y+r[1]);this.lineTo(x+w,y+h-r[2]);this.quadraticCurveTo(x+w,y+h,x+w-r[2],y+h);this.lineTo(x+r[3],y+h);this.quadraticCurveTo(x,y+h,x,y+h-r[3]);this.lineTo(x,y+r[0]);this.quadraticCurveTo(x,y,x+r[0],y);this.closePath();
  };
 }
}());
