/* Small, dependency-free fallbacks loaded before every game, including LG Chromium 87. */
(function () {
 'use strict';
 // Retain scrolling and game pointer gestures, not browser zoom or text selection.
 function editable(target){return target&&target.closest&&target.closest('input:not([type=button]):not([type=submit]):not([type=range]),textarea,[contenteditable=true]');}
 function protectUI(){
  var style=document.createElement('style');
  style.textContent='html{touch-action:pan-x pan-y}body{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}button,button *,[role=button],[role=button] *,canvas{-webkit-user-select:none!important;user-select:none!important;-webkit-touch-callout:none!important}input:not([type=range]),textarea,[contenteditable=true]{-webkit-user-select:text!important;user-select:text!important;-webkit-touch-callout:default!important}';
  document.head.appendChild(style);
 }
 var hasDocument=typeof document!=='undefined';
 if(hasDocument){if(document.head)protectUI();else document.addEventListener('DOMContentLoaded',protectUI,{once:true});}
 // iOS zooms focused text controls below 16 CSS px. Fix the control rather
 // than rewriting the viewport (which also resets intentional zoom/scroll).
 var textFields='input:not([type=button]):not([type=submit]):not([type=reset]):not([type=range]):not([type=checkbox]):not([type=radio]):not([type=color]):not([type=hidden]):not([type=file]),textarea,select,[contenteditable=true]';
 function sizeTextFields(root){
  if(!window.matchMedia('(any-pointer:coarse)').matches)return;
  var fields=[];
  if(root.matches&&root.matches(textFields))fields.push(root);
  if(root.querySelectorAll)fields=fields.concat(Array.prototype.slice.call(root.querySelectorAll(textFields)));
  fields.forEach(function(field){
   if(parseFloat(getComputedStyle(field).fontSize)<16)field.style.setProperty('font-size','16px','important');
  });
 }
 function watchTextFields(){
  sizeTextFields(document);
  new MutationObserver(function(records){records.forEach(function(record){
   if(record.type==='childList')Array.prototype.forEach.call(record.addedNodes,function(node){if(node.nodeType===1)sizeTextFields(node);});
   else if(record.target.matches(textFields))sizeTextFields(record.target);
  });}).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','contenteditable','type']});
  window.addEventListener('load',function(){sizeTextFields(document);},{once:true});
 }
 if(hasDocument){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watchTextFields,{once:true});else watchTextFields();
  document.addEventListener('pointerdown',function(e){var field=e.target.closest&&e.target.closest(textFields);if(field)sizeTextFields(field);},true);
  document.addEventListener('focus',function(e){if(e.target.matches&&e.target.matches(textFields))sizeTextFields(e.target);},true);
  document.addEventListener('selectstart',function(e){if(!editable(e.target))e.preventDefault();});
  document.addEventListener('contextmenu',function(e){if(!editable(e.target))e.preventDefault();});
 }
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
