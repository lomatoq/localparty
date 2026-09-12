// Tiny offline QR renderer for short ASCII/UTF-8 URLs.
// Fixed QR Version 3, Error Correction L, Mask 0 (55 data + 15 ECC codewords).
(function(global){
  const VERSION=3, SIZE=29, DATA_CW=55, ECC_CW=15;
  const EXP=new Uint8Array(512), LOG=new Uint8Array(256);
  let x=1;
  for(let i=0;i<255;i++){
    EXP[i]=x; LOG[x]=i;
    x<<=1; if(x&0x100) x^=0x11d;
  }
  for(let i=255;i<512;i++) EXP[i]=EXP[i-255];
  const mul=(a,b)=>a&&b?EXP[LOG[a]+LOG[b]]:0;
  function polyMul(a,b){
    const out=new Uint8Array(a.length+b.length-1);
    for(let i=0;i<a.length;i++) for(let j=0;j<b.length;j++) out[i+j]^=mul(a[i],b[j]);
    return [...out];
  }
  let GEN=[1];
  for(let i=0;i<ECC_CW;i++) GEN=polyMul(GEN,[1,EXP[i]]);

  function ecc(data){
    const msg=[...data,...new Array(ECC_CW).fill(0)];
    for(let i=0;i<data.length;i++){
      const factor=msg[i];
      if(!factor) continue;
      for(let j=0;j<GEN.length;j++) msg[i+j]^=mul(GEN[j],factor);
    }
    return msg.slice(data.length);
  }
  function pushBits(bits,value,count){ for(let i=count-1;i>=0;i--) bits.push((value>>>i)&1); }
  function codewords(text){
    const bytes=[...new TextEncoder().encode(text)];
    if(bytes.length>53) throw new Error('QR URL too long for local QR renderer');
    const bits=[];
    pushBits(bits,0b0100,4); // byte mode
    pushBits(bits,bytes.length,8); // version 1-9 byte count
    for(const b of bytes) pushBits(bits,b,8);
    const cap=DATA_CW*8;
    for(let i=0;i<4&&bits.length<cap;i++) bits.push(0);
    while(bits.length%8) bits.push(0);
    const data=[];
    for(let i=0;i<bits.length;i+=8){
      let v=0; for(let j=0;j<8;j++) v=(v<<1)|(bits[i+j]||0); data.push(v);
    }
    let pad=0;
    while(data.length<DATA_CW) data.push((pad++&1)?0x11:0xEC);
    return [...data,...ecc(data)];
  }
  function bitLength(v){let n=0;while(v){n++;v>>>=1}return n}
  function formatBits(){
    const data=0b01000; // EC level L (01), mask 000
    let d=data<<10;
    const g=0x537;
    while(bitLength(d)>=bitLength(g)) d^=g<<(bitLength(d)-bitLength(g));
    return ((data<<10)|d)^0x5412;
  }
  function matrixFor(text){
    const m=Array.from({length:SIZE},()=>Array(SIZE).fill(null));
    const put=(r,c,v)=>{if(r>=0&&r<SIZE&&c>=0&&c<SIZE)m[r][c]=!!v};
    function finder(r0,c0){
      for(let dr=-1;dr<=7;dr++) for(let dc=-1;dc<=7;dc++){
        const r=r0+dr,c=c0+dc; if(r<0||r>=SIZE||c<0||c>=SIZE) continue;
        let v=false;
        if(dr>=0&&dr<=6&&dc>=0&&dc<=6){
          v=dr===0||dr===6||dc===0||dc===6||(dr>=2&&dr<=4&&dc>=2&&dc<=4);
        }
        put(r,c,v);
      }
    }
    finder(0,0); finder(0,SIZE-7); finder(SIZE-7,0);
    for(let i=8;i<SIZE-8;i++){
      if(m[6][i]===null) put(6,i,i%2===0);
      if(m[i][6]===null) put(i,6,i%2===0);
    }
    // Version 3 alignment centers = [6,22]; only (22,22) doesn't overlap a finder.
    const ar=22,ac=22;
    for(let dr=-2;dr<=2;dr++) for(let dc=-2;dc<=2;dc++){
      const ring=Math.max(Math.abs(dr),Math.abs(dc));
      put(ar+dr,ac+dc,ring!==1);
    }
    const fmt=formatBits();
    for(let i=0;i<15;i++){
      const v=((fmt>>>i)&1)!==0;
      if(i<6) put(i,8,v); else if(i<8) put(i+1,8,v); else put(SIZE-15+i,8,v);
      if(i<8) put(8,SIZE-i-1,v); else if(i<9) put(8,15-i,v); else put(8,15-i-1,v);
    }
    put(SIZE-8,8,true); // fixed dark module

    const words=codewords(text);
    let inc=-1,row=SIZE-1,bit=7,idx=0;
    for(let col=SIZE-1;col>0;col-=2){
      if(col===6) col--;
      for(;;){
        for(let c=0;c<2;c++){
          const cc=col-c;
          if(m[row][cc]!==null) continue;
          let dark=false;
          if(idx<words.length) dark=((words[idx]>>>bit)&1)!==0;
          if(((row+cc)&1)===0) dark=!dark; // mask 0
          put(row,cc,dark);
          bit--; if(bit<0){idx++;bit=7}
        }
        row+=inc;
        if(row<0||row>=SIZE){row-=inc;inc=-inc;break}
      }
    }
    return m;
  }
  function renderQr(el,text,pixels){
    const m=matrixFor(text), quiet=4, modules=SIZE+quiet*2;
    const canvas=document.createElement('canvas');
    const scale=Math.max(1,Math.floor((pixels||220)/modules));
    canvas.width=canvas.height=modules*scale;
    const ctx=canvas.getContext('2d');
    ctx.imageSmoothingEnabled=false;
    ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='#000';
    for(let r=0;r<SIZE;r++) for(let c=0;c<SIZE;c++) if(m[r][c]) ctx.fillRect((c+quiet)*scale,(r+quiet)*scale,scale,scale);
    el.innerHTML=''; el.appendChild(canvas); el.title=text;
    return canvas;
  }
  global.renderQr=renderQr;
})(window);
