'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {parseDefinitions,summarize}=require('../scripts/analyze-pocket-reference.cjs');

test('DONE excludes stale duplicate declarations left in decoded source buffers',()=>{
 const source='WEAPON: Example\n{\n TRIGGER: Root\n}\nTRIGGER: Root\n{\n COMMAND: Shot\n TYPE: BULLET\n}\nBULLET: Shot\n{\n DRAW_SIZE: 1\n}\nDONE\nBULLET: Shot\n{\n DRAW_SIZE: 999\n}\n';
 const blocks=parseDefinitions(source,'fixture');
 assert.equal(blocks.length,3);
 assert.equal(summarize(blocks)[0].chain.find(n=>n.type==='BULLET').values.DRAW_SIZE,1);
});

test('command reachability stays aligned when TYPE is absent and names use mixed case',()=>{
 const blocks=parseDefinitions('weapon: Example\n{\n trigger: Root\n}\ntrigger: Root\n{\n TIMEDELAY: 0\n COMMAND: First\n TYPE: EXPLOSION\n TIMEDELAY: 0\n COMMAND: Second\n TIMEDELAY: 0\n COMMAND: Third\n TYPE: BULLET\n}\nEXPLOSION: First\n{\n DAMAGE: 1\n}\nMAGICWALL: Second\n{\n WIDTH: 10\n}\nBULLET: Third\n{\n DRAW_SIZE: 2\n}\n','fixture');
 const graph=summarize(blocks)[0].chain;
 assert.deepEqual(graph.map(n=>n.name),['Root','First','Second','Third']);
 assert.equal(graph[0].commands[1].TYPE,undefined);
 assert.equal(graph[0].commands[1].resolvedType,'MAGICWALL');
 assert.equal(graph[0].commands[2].resolvedType,'BULLET');
});

test('nested loops and conditions retain structure and assignment order',()=>{
 const [root]=parseDefinitions('TRIGGER: Root\n{\n AX: SET 0\n LOOP 5\n IF INFIX AX < 3\n TIMEDELAY: 10\n COMMAND: Shot\n TYPE: BULLET\n AX: INFIX AX + 1\n ELSE\n TIMEDELAY: 20\n COMMAND: Other\n TYPE: BULLET\n ENDIF\n ENDLOOP\n}\n');
 assert.equal(root.program[0].AX,'SET 0');
 assert.equal(root.program[1].op,'loop');
 assert.equal(root.program[1].count,5);
 const branch=root.program[1].commands[0];
 assert.equal(branch.condition,'INFIX AX < 3');
 assert.equal(branch.commands[0].COMMAND,'Shot');
 assert.equal(branch.elseCommands[0].COMMAND,'Other');
 assert.deepEqual(branch.commands[0].statements.map(s=>s.key),['TIMEDELAY','COMMAND','TYPE','AX']);
 assert.equal(root.commands.length,3);
});

test('genuine malformed control flow is reported, never silently repaired',()=>{
 const [root]=parseDefinitions('TRIGGER: Root\n{\n COMMAND: Left\n TYPE: CRUISER\n ELSE\n COMMAND: Right\n TYPE: CRUISER\n ENDIF\n}\n');
 assert.deepEqual(root.parseWarnings,['Unmatched ELSE','Unmatched ENDIF']);
 assert.equal(root.program[1].op,'unmatched-else');
});

test('numeric debris does not hide an otherwise explicit declaration or property',()=>{
 const [root]=parseDefinitions('TRIGGER: Crystalize\n{7\n TIMEDELAY: 0\n 6 COMMAND: Crystal\n TYPE: DIRTBALL\n}\n');
 assert.equal(root.commands[0].COMMAND,'Crystal');
 assert.equal(root.parseWarnings.length,2);
});

test('regenerated graphs retain source loops and no longer lose Hot Foot or Bouncy Wall definitions',()=>{
 const reference=require('../games/arcade_deluxe/core/pocket-reference.generated.json');
 assert.equal(reference.weapons.length,321);
 const hot=reference.weapons.find(w=>w.id==='hot_foot');
 assert.equal(hot.chain.find(n=>n.name==='HotFootSpreadTrigger').commands.length,3);
 const wall=reference.weapons.find(w=>w.id==='bouncy_wall');
 assert.equal(wall.chain.filter(n=>n.type==='MAGICWALL').length,2);
 const seat=reference.weapons.find(w=>w.id==='hot_seat');
 assert(seat.chain.some(n=>n.program?.some(row=>row.op==='loop')));
});
