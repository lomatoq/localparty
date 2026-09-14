// Local compatibility fixture. It removes selected newer capabilities; it is NOT a webOS emulator.
const http=require('node:http'),net=require('node:net');
const injected='<script>delete Array.prototype.at;if(window.crypto)delete crypto.randomUUID;if(window.CanvasRenderingContext2D)delete CanvasRenderingContext2D.prototype.roundRect;</script>';
function oldCSS(s){
 // These @supports tests are false on the target engine, even though the test browser is modern.
 const marker=/@supports[^{}]*\b(?:cq[wh]|aspect-ratio)[^{}]*\{/g;
 let found;
 while((found=marker.exec(s))){let end=marker.lastIndex,depth=1;while(end<s.length&&depth){if(s[end]==='{')depth++;else if(s[end]==='}')depth--;end++;}s=s.slice(0,found.index)+(process.env.PARTY_LEGACY_BEFORE==='1'?s.slice(marker.lastIndex,end-1):'')+s.slice(end);marker.lastIndex=0;}
 return s.replace(/[\w-]+\s*:[^;{}]*\d(?:[dsv]v[wh]|cq[wh])[^;{}]*;?/g,'').replace(/(?:aspect-ratio|container-type)\s*:[^;{}]*;?/g,'').replace(/[^{}]*:(?:has|is)\([^{}]+\{[^{}]*\}/g,'');
}

const server=http.createServer((req,res)=>{const headers={...req.headers,host:'127.0.0.1:8080'};delete headers['accept-encoding'];const up=http.request({host:'127.0.0.1',port:8080,path:req.url,method:req.method,headers},r=>{const out={...r.headers};delete out['content-length'];delete out['transfer-encoding'];out['cache-control']='no-store';let body=[];r.on('data',b=>body.push(b));r.on('end',()=>{let data=Buffer.concat(body);const type=out['content-type']||'';if(type.includes('text/css'))data=oldCSS(data.toString());if(type.includes('text/html'))data=data.toString().replace(/<head[^>]*>/i,m=>m+injected).replace(/(<style[^>]*>)([\s\S]*?)(<\/style>)/gi,(_,a,b,c)=>a+oldCSS(b)+c);res.writeHead(r.statusCode,out);res.end(data);});});up.on('error',e=>{res.writeHead(502);res.end(e.message);});req.pipe(up);});
server.on('upgrade',(req,socket,head)=>{const upstream=net.connect(8080,'127.0.0.1',()=>{upstream.write(req.method+' '+req.url+' HTTP/1.1\r\n'+Object.entries(req.headers).map(([k,v])=>k+': '+v).join('\r\n')+'\r\n\r\n');if(head.length)upstream.write(head);socket.pipe(upstream);upstream.pipe(socket);});upstream.on('error',()=>socket.destroy());socket.on('error',()=>upstream.destroy());socket.on('close',()=>upstream.destroy());});
const port=Number(process.env.PARTY_LEGACY_PORT||8092);server.listen(port,'127.0.0.1',()=>console.log('TV compatibility fixture http://127.0.0.1:'+port+'/tv'));
