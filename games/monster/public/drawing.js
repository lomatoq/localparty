(function(root){
  'use strict';
  const BACKGROUND=[246,239,227],STRIP=12;
  function ink(data,i){return data[i+3]>32&&Math.abs(data[i]-BACKGROUND[0])+Math.abs(data[i+1]-BACKGROUND[1])+Math.abs(data[i+2]-BACKGROUND[2])>35;}
  function bounds(data,width,height,preserveTop=false){let top=height,bottom=-1;for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(ink(data,(y*width+x)*4)){top=Math.min(top,y);bottom=y;}
    if(bottom<0)return null;return{top:preserveTop?0:top,bottom,height:bottom-(preserveTop?0:top)+1};}
  function connectors(data,width,height){const xs=[];for(let x=0;x<width;x++){for(let y=Math.max(0,height-STRIP);y<height;y++)if(ink(data,(y*width+x)*4)){xs.push(x/width);break;}}if(!xs.length)return[];const groups=[[xs[0]]];for(let i=1;i<xs.length;i++){if(xs[i]-xs[i-1]>3/width)groups.push([]);groups.at(-1).push(xs[i]);}return groups.sort((a,b)=>b.length-a.length).slice(0,8).map(g=>g.reduce((a,b)=>a+b,0)/g.length).sort((a,b)=>a-b);}
  function layout(segments){let height=0;return{items:segments.map((s,i)=>{const overlap=i?Math.min(s.overlap||0,height,s.height):0;const y=height-overlap;height=y+s.height;return{y,height:s.height,overlap};}),get height(){return height;}};}
  const api={BACKGROUND,STRIP,ink,bounds,connectors,layout};if(typeof module!=='undefined')module.exports=api;else root.MonsterDrawing=api;
})(typeof window!=='undefined'?window:globalThis);
