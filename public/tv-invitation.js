/* QR addresses never contain Wi-Fi credentials; only the authorized image does. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HeyPalsTVInvitation=api;})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 function presentation(state,large=false){
  const room=state?.networkEnabled!==false?state?.urls?.[0]||'':'';
  const revision=['appclip','appclip-beta'].includes(state?.invitation?.mode)&&/^[a-f0-9-]{36}$/.test(state.invitation.revision||'')?state.invitation.revision:null;
  const appclip=!!room&&!!revision;
  return {room,appclip,src:!room?'':appclip?'/api/invite-qr?revision='+encodeURIComponent(revision)+(large?'&size=large':''):'/api/qr?'+(large?'size=large&':'')+'url='+encodeURIComponent(room),hint:appclip?(state.invitation.mode==='appclip-beta'?'Open HeyPals Join in TestFlight, then scan this QR inside it.':'Scan to join Wi-Fi and open your controller.'):'Connect to the same Wi-Fi, then scan with your camera.'};
 }
 return {presentation};
});
