'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const swift=fs.readFileSync(require('node:path').resolve(__dirname,'../ios/LocalParty/LocalPartyApp.swift'),'utf8');
const section=(from,to)=>{const a=swift.indexOf(from),b=swift.indexOf(to,a);assert(a>=0&&b>a,`missing ${from} … ${to}`);return swift.slice(a,b);};
test('native page changes use adjoining opaque slides, never cross-fade WebKit',()=>{
 const code=section('func updateNavigation()','override func viewDidLayoutSubviews');
 assert.doesNotMatch(code,/web\.alpha\s*=\s*0|snapshot\.alpha\s*=\s*0|outgoing\.alpha\s*=\s*0|finishAnimation\(at:\s*\.current\)/);
 // Menu <-> controller: two live pages slide together; same-page changes slide a snapshot out.
 assert.match(code,/web\.transform = \.identity; outgoing\.transform = CGAffineTransform\(translationX: -direction \* width, y: 0\)/);
 assert.match(code,/web\.transform = \.identity; snapshot\.transform = CGAffineTransform\(translationX: -direction \* width, y: 0\)/);
 assert.match(code,/snapshot\.isOpaque = true/);
});
test('a tab tap answers at once and never waits on a synchronous WebKit commit',()=>{
 const begin=section('func beginTransition(to tab: String)','#if DEBUG');
 assert(begin.indexOf('clearScreenTransition()')<begin.indexOf('paintTabs(tab)'));
 assert.match(begin,/snapshotView\(afterScreenUpdates: false\)/);
 assert.doesNotMatch(swift,/snapshotView\(afterScreenUpdates: true\)/);
 // The incoming surface is un-hidden (parked off-screen) before JavaScript prepares it.
 assert(begin.indexOf('incoming.isHidden = false')<begin.indexOf('snapshotView('));
 const select=section('func selectTab(_ tab: String)','private func signalController');
 assert(select.indexOf('beginTransition(to: tab)')<select.indexOf('callAsyncJavaScript'));
});
test('cancellation invalidates callbacks and normalizes both persistent surfaces',()=>{
 const cleanup=section('private func clearScreenTransition()','func beginTransition(to tab: String)');
 assert(cleanup.indexOf('transitionID += 1')<cleanup.indexOf('stopAnimation(true)'));
 assert.match(cleanup,/outgoingScreen\?\.removeFromSuperview\(\); outgoingScreen = nil/);
 assert.match(cleanup,/outgoingWeb = nil/);
 assert.match(cleanup,/for web in \[store\.menu, store\.controller\] \{ web\.alpha = 1; web\.transform = \.identity \}/);
 assert.match(cleanup,/store\.menu\.isHidden = store\.showingController/);
 assert.match(swift,/guard let self, self\.transitionID == epoch else/);
 // Game/menu shortcuts go through the same animated path instead of an instant swap.
 assert.match(swift,/if type == "menu", player, message\.frameInfo\.isMainFrame \{ selectTab\("games"\); return \}/);
 assert.match(swift,/case "controller": selectTab\("controller"\)/);
});
