'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawnSync}=require('node:child_process');
test('App Clip invitation round trip, credentials and destination boundaries',{skip:process.platform!=='darwin'},()=>{
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'heypals-join-'));
try {
 const source=fs.readFileSync(path.join(__dirname,'../ios/Shared/JoinInvitation.swift'),'utf8');
 const input=path.join(dir,'test.swift');fs.writeFileSync(input,source+String.raw`
let base = URL(string: "https://appclip.apple.com/id?p=com.localparty.launcher.Join")!
let invite = JoinInvitation(version: 1, ssid: "A; B / café", password: "p@ss;word", security: "WPA", room: "https://pelican-dune.lancert.dev:8080/")
assert(invite.isValid)
let url = invite.url(base: base)!
assert(JoinInvitation.decode(url, clipBundleID: "com.localparty.launcher.Join") == invite)
assert(!url.absoluteString.contains("p@ss;word"))
assert(JoinInvitation.decode(url, clipBundleID: "another.Clip") == nil)
assert(JoinInvitation.decode(URL(string: url.absoluteString.replacingOccurrences(of: "appclip.apple.com", with: "evil.example"))!, clipBundleID: "com.localparty.launcher.Join") == nil)
assert(invite.url(base: URL(string: "https://evil.example/id?p=com.localparty.launcher.Join")!) == nil)
for room in ["https://evil.example/", "https://127.0.0.1/", "https://10.0.0.1/admin", "https://10.0.0.1/?admin=secret", "http://10.0.0.1/", "https://user:pass@10.0.0.1/"] {
 assert(!JoinInvitation(version: 1, ssid: "Room", password: "password", security: "WPA", room: room).isValid)
}
for room in ["https://10.0.0.1:8080/", "https://192.168.1.20/", "https://172.16.0.2/", "https://room.local/"] {
 assert(JoinInvitation(version: 1, ssid: "Room", password: "password", security: "WPA", room: room).isValid)
}
assert(!JoinInvitation(version: 2, ssid: "Room", password: "password", security: "WPA", room: invite.room).isValid)
assert(!JoinInvitation(version: 1, ssid: "Room", password: "short", security: "WPA", room: invite.room).isValid)
assert(!JoinInvitation(version: 1, ssid: String(repeating: "é", count: 17), password: "password", security: "WPA", room: invite.room).isValid)
assert(JoinInvitation(version: 1, ssid: "Open", password: "", security: "nopass", room: invite.room).isValid)
assert(!JoinInvitation(version: 1, ssid: "Open", password: "password", security: "nopass", room: invite.room).isValid)
assert(JoinInvitation.decode(URL(string: url.absoluteString + "&join=abc")!, clipBundleID: "com.localparty.launcher.Join") == nil)
print("Invitation validation passed")
`);
 const r=spawnSync('swift',['-module-cache-path',path.join(dir,'cache'),input],{encoding:'utf8',timeout:60000});assert.equal(r.status,0,r.stderr);
}finally{fs.rmSync(dir,{recursive:true,force:true});}
});
