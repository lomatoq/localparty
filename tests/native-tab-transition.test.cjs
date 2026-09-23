'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const swift=fs.readFileSync(require('node:path').resolve(__dirname,'../ios/LocalParty/LocalPartyApp.swift'),'utf8');
test('native page changes use adjoining opaque slides, never cross-fade WebKit',()=>{
 const code=swift.slice(swift.indexOf('let snapshot = outgoingScreen'),swift.indexOf('override func viewDidLayoutSubviews'));
 assert.doesNotMatch(code,/web\.alpha\s*=\s*0|snapshot\.alpha\s*=\s*0|finishAnimation\(at:\s*\.current\)/);
 assert.match(code,/translationX: direction \* view\.bounds\.width, y: 0/);
 assert.match(code,/translationX: -direction \* self\.view\.bounds\.width, y: 0/);
 assert.match(code,/snapshot\.isOpaque = true/);
});
test('cancellation invalidates callbacks and normalizes both persistent surfaces before snapshotting',()=>{
 const cleanup=swift.slice(swift.indexOf('private func clearScreenTransition()'),swift.indexOf('func prepareTransition()'));
 assert(cleanup.indexOf('transitionID += 1')<cleanup.indexOf('stopAnimation(true)'));
 assert.match(cleanup,/outgoingScreen\?\.removeFromSuperview\(\); outgoingScreen = nil/);
 assert.match(cleanup,/for web in \[store\.menu, store\.controller\] \{ web\.alpha = 1; web\.transform = \.identity \}/);
 const prepare=swift.slice(swift.indexOf('func prepareTransition()'),swift.indexOf('func tabTransitionDiagnostics()'));
 assert(prepare.indexOf('clearScreenTransition()')<prepare.indexOf('snapshotView('));
 assert.match(swift,/guard let self, self\.transitionID == epoch else/);
});
