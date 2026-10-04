'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawnSync}=require('node:child_process');
test('credential-free beta entry is distinct from validated dynamic Wi-Fi invitations',{skip:process.platform!=='darwin'},()=>{
 const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'ios/Shared/JoinConnectionView.swift'),'utf8');
 const start=source.indexOf('enum JoinEntryURL {'),end=source.indexOf('\n#endif',start);assert(start>=0&&end>start);
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'heypals-entry-'));
 try{
  const invitation=fs.readFileSync(path.join(root,'ios/Shared/JoinInvitation.swift'),'utf8');
  const fixture=path.join(directory,'test.swift');fs.writeFileSync(fixture,invitation+'\n'+source.slice(start,end)+String.raw`
let clipID = "com.localparty.launcher.Join"
let base = URL(string: "https://appclip.apple.com/id?p=" + clipID)!
assert(JoinEntryURL.accepts(base, clipBundleID: clipID))
assert(JoinInvitation.decode(base, clipBundleID: clipID) == nil)
for value in ["https://appclip.apple.com/id", "http://appclip.apple.com/id?p=" + clipID,
 "https://other.example/id?p=" + clipID, "https://appclip.apple.com:7443/id?p=" + clipID,
 "https://user@appleclip.apple.com/id?p=" + clipID, base.absoluteString + "&p=" + clipID,
 base.absoluteString + "&join=", base.absoluteString + "&extra=1", base.absoluteString + "#fragment"] {
 assert(!JoinEntryURL.accepts(URL(string: value)!, clipBundleID: clipID))
}
assert(!JoinEntryURL.accepts(base, clipBundleID: "another.Clip"))
// Scan one host/network, then another: each QR carries its own current destination.
let first = JoinInvitation(version: 1, ssid: "First host", password: "first-password", security: "WPA", room: "https://first.lancert.dev:8080/")
let second = JoinInvitation(version: 1, ssid: "Another host", password: "second-password", security: "WPA", room: "https://second.lancert.dev:9443/")
for invite in [first, second] {
 let url = invite.url(base: base)!
 assert(!JoinEntryURL.accepts(url, clipBundleID: clipID))
 assert(JoinInvitation.decode(url, clipBundleID: clipID) == invite)
 assert(JoinInvitation.decode(url, clipBundleID: "another.Clip") == nil)
}
assert(JoinInvitation.decode(URL(string: "https://first.lancert.dev:8080/")!, clipBundleID: clipID) == nil)
print("PASS base beta entry, invalid URL boundaries, consecutive host/network invitations")
`);
  const result=spawnSync('swift',['-module-cache-path',path.join(directory,'cache'),fixture],{encoding:'utf8',timeout:60000});assert.equal(result.status,0,result.stderr);
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});
