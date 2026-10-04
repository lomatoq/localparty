'use strict';
const crypto=require('node:crypto');
const QRCode=require('qrcode');
const clipBundleID='com.localparty.launcher.Join';
const invalid=()=>new Error('Invalid App Clip invitation. Create a fresh invitation for this room.');
const controls=/[\u0000-\u001f\u007f-\u009f]/;
function validateInvitation(value,room){
 if(typeof value!=='string'||Buffer.byteLength(value)>3072||!room)throw invalid();
 let url;try{url=new URL(value);}catch{throw invalid();}
 const payload=url.searchParams.get('join');
 if(url.protocol!=='https:'||url.hostname!=='appclip.apple.com'||url.port||url.pathname!=='/id'||url.username||url.password||url.hash||
    url.searchParams.getAll('p').length!==1||url.searchParams.get('p')!==clipBundleID||url.searchParams.getAll('join').length!==1||
    [...url.searchParams.keys()].some(k=>!['p','join'].includes(k))||!payload||payload.length>2048||!/^[A-Za-z0-9_-]+$/.test(payload))throw invalid();
 let invite;try{
  const bytes=Buffer.from(payload,'base64url');
  if(bytes.toString('base64url')!==payload)throw invalid();
  invite=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
 }catch{throw invalid();}
 if(!invite||invite.version!==1||invite.room!==room||typeof invite.ssid!=='string'||!invite.ssid||Buffer.byteLength(invite.ssid)>32||controls.test(invite.ssid)||
    typeof invite.password!=='string'||controls.test(invite.password)||!['WPA','nopass'].includes(invite.security)||
    (invite.security==='nopass'?invite.password!=='':Buffer.byteLength(invite.password)<8||Buffer.byteLength(invite.password)>63))throw invalid();
 // The active server room is authoritative, never an address supplied by a guest.
 let destination;try{destination=new URL(room);}catch{throw invalid();}
 if(destination.protocol!=='https:'||destination.username||destination.password||destination.search||destination.hash||destination.pathname!=='/')throw invalid();
 return url.href;
}

// Session-only credentials. JSON snapshots expose only an opaque revision.
class ClipInvitation {
 #value=null;
 clear(){this.#value=null;}
 set({url,room,beta=false},currentRoom,scope){
  if(room!==currentRoom||!scope)throw invalid();
  const value=validateInvitation(url,currentRoom);
  this.#value={url:value,room:currentRoom,scope,beta:beta===true,revision:crypto.randomUUID(),images:new Map()};
 }
 metadata(room,scope){
  if(this.#value&&(this.#value.room!==room||this.#value.scope!==scope))this.clear();
  return this.#value?{mode:this.#value.beta?'appclip-beta':'appclip',revision:this.#value.revision}:null;
 }
 async image(revision,large=false){
  const value=this.#value;
  if(!value||value.revision!==revision)return null;
  const size=large?720:240;
  if(!value.images.has(size))value.images.set(size,QRCode.toBuffer(value.url,{margin:2,width:size,errorCorrectionLevel:'M'}).catch(()=>{throw new Error('Could not create the invitation QR.');}));
  const bytes=await value.images.get(size);
  return this.#value===value?bytes:null;
 }
}
module.exports={ClipInvitation,validateInvitation};
