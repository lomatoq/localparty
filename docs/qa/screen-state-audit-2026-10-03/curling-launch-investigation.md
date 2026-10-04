# Curling launch investigation — 2026-10-03

Read-only production analysis. No changes to server.js, lib/session-controls.js, sports engine, controller, live phone or user room. All tests used isolated temporary embedded launchers, no bots, no injected readiness, no force-start and normal clock. Browser/server closed after both runs.

Physical112 lifecycle log confirms Bowling launch17:15:06Z, Curling17:21:23Z and repeated17:22:54Z; Curling renderer frames continued. It does not record per-instance parent handshake readiness, worker presence, user-ready votes or the phase at failure. A render loop is not proof of successful matchmaking. The historical two-human waiting failure remains unconfirmed; current tests cannot reconstruct those missing facts.

## Actual browser cases

| Case | Evidence | Result |
| --- | --- | --- |
| Bowling playing→Curling directly, no Stop | curling-launch-races/curling-direct-switch-1280.png | Playing,2 online/2 present/2 ready |
| First-ready Curling controller reload | curling-launch-races/curling-reload-1280.png | Playing,2 online/2 present/2 ready |
| Browser offline simulation/back | curling-launch-races/curling-offline-1280.png | No stall, but existing WebSockets stayed connected until recovery. Not accepted as true offline prestart hold. |
| party-native-resume browser event before iframe re-handshake | curling-launch-races/curling-native-resume-1280.png | Playing,2 online/2 present/2 ready; browser bridge path only, not physical native validation |
| Actual controller close→same-storage reopen with host suspended | curling-prestart-rejoin/curling-suspended-rejoin-1280.png | Waiting correctly held with1 online/1 present. Second vote recorded. Rejoined lobby preceded game presence, paused/startRequestedfalse retained. Host resume +real presence produced Playing2/2/2. |

All five Curling originals personally opened: actual Throw, end1/3 stone1/8, timer and both player cards appear; no readiness overlay remains. Reports preserve sampled phase/session/roster state and source fingerprints. First batch8 alternating Bowling/Curling launches started; second batch2 launches started. Both report errors:[], drift:[], ok:true.

## Source reasoning

checkSession separately requires online roster, parent game-status ready, worker presence, and user-ready votes. Direct embedded switches create a fresh run and reject old-instance packets. SessionControls does not consume startRequested while paused. All confirmed sequences exercise those guards without changing them.

The initial paused→waiting hypothesis was rejected for Curling: sports uses the paused game scheduler, and its onPause broadcasts the snapshot without publishing paused launcher UI. Its last launcher phase remains waiting; resume can recheck normally. No speculative fix applied. Other engines are outside this narrow investigation.

A physical-only mismatch could still involve controller transport/native lifecycle ordering not present in these browser runs. Further diagnosis would need the actual stalled run's readiness/presence/phase snapshot, not more arbitrary source changes. No optional logging expansion performed.

## Source fingerprints

| File | SHA256 |
| --- | --- |
| `server.js` | `85b1d78a5b63b13cae9bb79437a23edac586535f0344872b9d3d93e0fe09cfec` |
| `lib/party-runtime.js` | `f1379701a182bdb6076f3d4efa16a680776fb7a2903471399dba7468a9f79f91` |
| `public/tv.js` | `64a2de98033a9faf99ee62841424e3c711d2a37cf59a25848f787df532800d77` |
| `public/app.js` | `74cb619cfdceb0afe2e9e2acd205eb3368bf3806efe76286cf72cfdde49750f5` |
| `lib/session-controls.js` | `4ad5a2efc3448fad2a61d4ad4967a11009ff624cc5339de65a26379300288313` |
| `games/sports_siege/server.js` | `869ace6cf8137690364d0f953a39cd227175b6d3ddb2a7d6b13b542ce871a5f4` |
| `games/sports_siege/public/controls.js` | `b5f419936542cb3f226eba63ecec08962857c3c2f8ce3c26f484c61d08363aef` |
