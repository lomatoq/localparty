// CSS layout pixels are independent of the receiver's physical resolution.
// Keep familiar game breakpoints on Retina/4K displays; scale both axes equally.
(function () {
 'use strict';
 function layout(width,height){
  width=Math.max(1,Number(width)||1);height=Math.max(1,Number(height)||1);
  const aspect=Math.max(4/3,Math.min(21/9,width/height));
  const sceneHeight=720,sceneWidth=Math.round(sceneHeight*aspect);
  const scale=Math.min(width/sceneWidth,height/sceneHeight);
  return {width:sceneWidth,height:sceneHeight,scale,
   left:(width-sceneWidth*scale)/2,top:(height-sceneHeight*scale)/2};
 }
 if(typeof module==='object'&&module.exports)module.exports=layout;
 else window.partyTVLayout=layout;
}());
