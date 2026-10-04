'use strict';
// Source audit / contract fixtures, NOT captured gameplay results.
// Per-mode exceptions stay explicit; most producers emit no places at all.
const groups=[
 [['push','shrink','knives','bomb','western'],'games/party/server.js','outcome','finishMatch; round wins / knife points; Western reaction breaks equal round wins'],
 [['tanks'],'games/tanks/server.js','outcome','survival round winner; CTF team flags; coop personal contribution'],
 [['tankarena'],'games/tankarena/server.js','score','highest combat points'],
 [['chaos'],'games/chaos/server.js','score','shared completion score; everyone won'],
 [['kart'],'games/kart/server.js','score','race order already converted to descending place points'],
 [['monster'],'games/monster/server.js','score','drawing participation score with collective won'],
 [['spy'],'games/spy/server.js','outcome','winning role faction score1 vs0'],
 [['millionaire'],'games/millionaire/server.js','outcome','money level then correct-answer winner tiebreaker'],
 [['sinyakquiz','warsaw'],'games/quiz/engine.js','score','personal quiz points; explicit teams use shared teamScore'],
 [['crocodile'],'games/crocodile/engine.js','score','personal / team points; two people share coop score'],
 [['jenga'],'games/jenga/server.js','outcome','non-collapsing winners; successful moves plus winner bonus'],
 [['crane'],'games/crane/server.js','score','personal construction contribution; shared win for height>=8'],
 [['naval'],'games/naval/engine.js','outcome','remaining health decides winner before individual shot score'],
 [['drawguess'],'games/drawguess/engine.js','score','guessing and drawing points'],
 [['western_duel'],'games/western_duel/server.js','score','duel wins; reaction time remains a separate metric'],
 [['taprace','punchmeter','flappy','hungry','snakelines'],'games/arcade/server.js','score','distance / sum punches / survival distance / final mass / round wins'],
 [['carryball'],'games/arcade/server.js','teams','team goals assigned to player.score at finish; explicit teamScore'],
 [['marble_bloom'],'games/arcade_deluxe/core/common.cjs','outcome','coop personal contributions; versus cleared/last-survivor winner before points'],
 [['pocket_siege'],'games/arcade_deluxe/core/tanks.cjs','score','individual damage points including negatives; explicit teams use summed damage'],
 [['bow_club'],'games/bow_club/core/match.cjs','score','individual arrow points; coop shared won; teams summed arrow points'],
 [['poker','mines'],'games/tabletop/server.js','score','final chips / opened-cell points'],
 [['airhockey'],'games/tabletop/server.js','teams','team goals converted to identical team point score'],
 [['curling'],'games/sports_siege/match.js','teams','sum of team end scores'],
 [['bowling','peek_shoot','swarm_gate'],'games/sports_siege/match.js','score','frame points / target points / personal kills with collective gate outcome']
];
module.exports=groups.flatMap(([ids,source,kind,reason])=>ids.map(id=>({id,source,kind,reason})));
