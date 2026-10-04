'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawnSync}=require('node:child_process');
test('native Wi-Fi QR encoder escapes credentials and rejects invalid inputs',{skip:process.platform!=='darwin'},()=>{
 const source=fs.readFileSync(path.join(__dirname,'../ios/LocalParty/LocalPartyApp.swift'),'utf8');const start=source.indexOf('func wifiQRPayload(');assert(start>0);
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'heypals-wifi-'));try{
 const input=path.join(dir,'test.swift');fs.writeFileSync(input,'import Foundation\n'+source.slice(start)+String.raw`
assert(wifiQRPayload(ssid: "Party room", password: "password", security: "WPA") == "WIFI:T:WPA;S:Party room;P:password;;")
assert(wifiQRPayload(ssid: "A;B:C", password: "abc;defg", security: "WPA") == "WIFI:T:WPA;S:A\\;B\\:C;P:abc\\;defg;;")
assert(wifiQRPayload(ssid: "Open", password: "", security: "nopass") == "WIFI:T:nopass;S:Open;P:;;")
assert(wifiQRPayload(ssid: "", password: "password", security: "WPA") == nil)
assert(wifiQRPayload(ssid: "Test", password: "short", security: "WPA") == nil)
assert(wifiQRPayload(ssid: String(repeating: "я", count: 17), password: "password", security: "WPA") == nil)
assert(wifiQRPayload(ssid: "Test", password: "pass\nword", security: "WPA") == nil)
assert(wifiQRPayload(ssid: "Test", password: String(repeating: "a", count: 64), security: "WPA") != nil)
`);const r=spawnSync('swift',['-module-cache-path',path.join(dir,'cache'),input],{encoding:'utf8',timeout:60000});assert.equal(r.status,0,r.stderr);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
