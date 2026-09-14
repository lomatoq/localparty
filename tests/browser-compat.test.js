const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {cssFallbacks}=require('../lib/browser-compat');
test('old-TV viewport fallbacks preserve calc, clamp, responsive rules and current browser declarations',()=>{
 const css='a{height:calc(100dvh - 80px);width:50svw}@media(max-width:850px){a{min-height:clamp(30px,50dvh,300px)}}';
 const out=cssFallbacks(css);
 assert.ok(out.includes('height:calc(100vh - 80px);height:calc(100dvh - 80px)'));
 assert.ok(out.includes('width:50vw;width:50svw'));
 assert.ok(out.includes('min-height:clamp(30px,50vh,300px);min-height:clamp(30px,50dvh,300px)'));
 assert.equal(cssFallbacks('a{color:red;background:url(/a.svg)}'),'a{color:red;background:url(/a.svg)}');
 const tv=cssFallbacks(fs.readFileSync('public/tv.css','utf8'));assert.ok(tv.includes('height:calc(100vh - 80px)'));assert.ok(tv.includes('height:calc(100vh - 64px)'));
});
test('fallbacks run when Array.at and Canvas.roundRect are absent',()=>{
 const context=vm.createContext({});
 vm.runInContext('window=this;crypto={getRandomValues:function(b){b.fill(1);return b;}};delete Array.prototype.at;function CanvasRenderingContext2D(){};var ops=[];["moveTo","lineTo","quadraticCurveTo","closePath"].forEach(function(k){CanvasRenderingContext2D.prototype[k]=function(){ops.push([k].concat(Array.from(arguments)));};});',context);
 vm.runInContext(fs.readFileSync('public/browser-compat.js','utf8'),context);
 assert.match(vm.runInContext('crypto.randomUUID()',context),/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
 assert.equal(vm.runInContext('[10,20,30].at(-1)',context),30);
 assert.equal(vm.runInContext('[10,20,30].at(-9)',context),undefined);
 assert.equal(vm.runInContext('[10,20,30].at(1.9)',context),20);
 vm.runInContext('new CanvasRenderingContext2D().roundRect(0,0,20,10,99)',context);
 assert.equal(vm.runInContext('ops[0][1]',context),5);assert.equal(vm.runInContext('ops[ops.length-1][0]',context),'closePath');
 assert.throws(()=>vm.runInContext('new CanvasRenderingContext2D().roundRect(0,0,20,10,-1)',context));
});
