'use strict';
// Load the unchanged Rapier JS bindings with a module-local native WASM ABI.
// Do not expose a fake global WebAssembly: Node would enable its own WASM parsers.
exports.install=game=>{
 const dim=['jenga','bowling'].includes(game)?'3d':game==='crane'?'2d':null;if(!dim)return;
 const Module=require('module'),fs=require('fs'),path=require('path'),vm=require('vm');
 const {isUtf8}=require('buffer'),NativeDecoder=global.TextDecoder;
 class MobileDecoder extends NativeDecoder {
  constructor(label,options={}){super(label,{...options,fatal:false});this.strict=!!options.fatal;}
  get fatal(){return this.strict;}
  decode(input,options={}){if(this.strict){if(options.stream)throw Error('Streaming fatal decoding is not used by Rapier');const bytes=input===undefined?new Uint8Array():ArrayBuffer.isView(input)?new Uint8Array(input.buffer,input.byteOffset,input.byteLength):new Uint8Array(input);if(!isUtf8(bytes))throw new TypeError('Invalid UTF-8');}return super.decode(input,options);}
 }
 const native=process._linkedBinding('localparty_rapier');
 const abi={Instance:class Instance{},instantiate:async(bytes,imports)=>({instance:{exports:native['create'+dim](imports['./rapier_wasm'+dim+'_bg.js'])},module:null})};
 const filename=require.resolve('@dimforge/rapier'+dim+'-compat');
 if(require.cache[filename])return;
 const mod=new Module(filename,module);mod.filename=filename;mod.paths=Module._nodeModulePaths(path.dirname(filename));
 require.cache[filename]=mod;
 try {
  const source=fs.readFileSync(filename,'utf8');
  const factory=vm.runInThisContext('(function(exports,require,module,__filename,__dirname,WebAssembly,TextDecoder,Response,Request){'+source+'\n})',{filename});
  factory(mod.exports,mod.require.bind(mod),mod,filename,path.dirname(filename),abi,MobileDecoder,undefined,undefined);mod.loaded=true;
 }catch(e){delete require.cache[filename];throw e;}
};
