/** Same-origin transport; credentials stay on the authenticated game connection. */
export class BowConnection {
 constructor(onmessage,onstatus){this.onmessage=onmessage;this.onstatus=onstatus;this.closed=false;this.delay=350;this.open();}
 open(){if(this.closed)return;const u=new URL('ws',document.baseURI);u.protocol=location.protocol==='https:'?'wss:':'ws:';const ws=this.socket=new WebSocket(u);
  ws.onopen=()=>{this.delay=350;this.onstatus?.('open');};ws.onmessage=e=>{try{const m=JSON.parse(e.data);this.onmessage(m.type,m.data);}catch(error){console.warn('Bow packet',error);}};
  ws.onclose=()=>{this.onstatus?.('closed');if(!this.closed){clearTimeout(this.retry);this.retry=setTimeout(()=>this.open(),this.delay);this.delay=Math.min(4000,this.delay*1.7);}};ws.onerror=()=>{};
 }
 send(type,data={}){if(this.socket?.readyState!==1)return false;this.socket.send(JSON.stringify({type,data}));return true;}
 close(){this.closed=true;clearTimeout(this.retry);this.socket?.close();}
}
