'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawnSync}=require('node:child_process');
test('Bonjour finds and updates LAN rooms, rejects unsafe destinations, removes departed hosts',{skip:process.platform!=='darwin',timeout:40000},()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'heypals-lan-'));
 try{
  const source=fs.readFileSync(path.join(__dirname,'../ios/LocalParty/NearbyRooms.swift'),'utf8').replace('import UIKit','');
  const invitation=fs.readFileSync(path.join(__dirname,'../ios/Shared/JoinInvitation.swift'),'utf8');
  fs.writeFileSync(path.join(dir,'main.swift'),invitation+`\nstruct UIDevice { static let current = UIDevice(); var name: String { "LAN test" } }
struct Game { var id: String; var title: String }
struct UI { var phase: String }
struct Active { var id: String; var ui: UI }
struct ServerState { var networkEnabled=false; var urls:[String]=[]; var catalog:[Game]=[]; var active:Active?; var players:[String]=[] }
`+source+String.raw`
@MainActor func testRooms() {
 let client=NearbyRooms(); var found:[NearbyRoom]=[]
 client.onChange={found=$0}; client.update(state:ServerState(),foreground:true)
 let id=UUID().uuidString
 func record(_ url:String,_ game:String="",_ phase:String="lobby")->Data {
  NetService.data(fromTXTRecord:["v":"1","id":id,"name":"Friends’ room","url":url,"game":game,"phase":phase,"players":"3"].mapValues{Data($0.utf8)})
 }
 func wait(_ predicate:()->Bool) {
  let deadline=Date().addingTimeInterval(8)
  while !predicate() && Date()<deadline { RunLoop.main.run(until:Date().addingTimeInterval(0.05)) }
  assert(predicate(),"Bonjour state did not arrive")
 }
 let service=NetService(domain:"local.",type:"_localparty._tcp.",name:"HeyPals-test-"+id,port:8080)
 service.setTXTRecord(record("https://room.lancert.dev:8080/"));service.publish()
 wait{found.contains{$0.id==id}}
 assert(found.first{$0.id==id}?.players==3)
 service.setTXTRecord(record("https://room.lancert.dev:8080/","Push Pit","waiting"))
 wait{found.contains{$0.id==id && $0.game=="Push Pit" && $0.phase=="waiting"}}
 service.stop();wait{!found.contains{$0.id==id}}
 let bad=NetService(domain:"local.",type:"_localparty._tcp.",name:"HeyPals-bad-"+id,port:8080)
 bad.setTXTRecord(record("https://attacker.example:8080/"));bad.publish()
 RunLoop.main.run(until:Date().addingTimeInterval(1));assert(!found.contains{$0.id==id})
 bad.stop();client.update(state:nil,foreground:false);assert(found.isEmpty)
 assert(NearbyRooms.roomURL("http://192.168.1.2/")==nil)
 assert(NearbyRooms.roomURL("https://room.lancert.dev/admin")==nil)
 assert(NearbyRooms.roomURL("https://user:password@room.local/")==nil)
 print("PASS Bonjour find, active update, removal, guest without own sharing, URL boundaries, background cleanup")
}
MainActor.assumeIsolated { testRooms() }
`);
  const compile=spawnSync('swiftc',['-module-cache-path',path.join(dir,'cache'),path.join(dir,'main.swift'),'-o',path.join(dir,'test')],{encoding:'utf8',timeout:20000});assert.equal(compile.status,0,compile.stderr);
  const run=spawnSync(path.join(dir,'test'),[],{encoding:'utf8',timeout:20000});assert.equal(run.status,0,run.stderr+'\n'+run.stdout);console.log(run.stdout.trim());
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
