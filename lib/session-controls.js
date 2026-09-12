'use strict';
class SessionControls {
 constructor(testMode=false){this.ready=new Set();this.votes=new Set();this.spectators=new Set();this.paused=false;this.testMode=testMode;this.startRequested=false;this.clockOffset=0;this.pausedAt=null;}
 eligible(ids){return ids.filter(id=>!this.spectators.has(id));}
 view(ids){const eligibleIds=this.eligible(ids);return {readyIds:[...this.ready].filter(id=>eligibleIds.includes(id)),exitVotes:[...this.votes].filter(id=>eligibleIds.includes(id)),spectatorIds:[...this.spectators],eligibleIds,paused:this.paused,testMode:this.testMode,startRequested:this.startRequested,clockOffset:this.clockOffset,pausedAt:this.pausedAt};}
 setPaused(value,now=Date.now()){value=!!value;if(this.paused===value)return;if(value)this.pausedAt=now;else{this.clockOffset+=Math.max(0,now-this.pausedAt);this.pausedAt=null;}this.paused=value;}
 resetReady(){this.ready.clear();this.startRequested=false;this.votes.clear();}
 setReady(id,value){if(value){this.spectators.delete(id);this.ready.add(id);}else this.ready.delete(id);}
 spectate(id,value){if(value){this.spectators.add(id);this.ready.delete(id);this.votes.delete(id);}else this.spectators.delete(id);}
 vote(id,value){if(value)this.votes.add(id);else this.votes.delete(id);}
 shouldStart(ids){const eligible=this.eligible(ids);if(this.paused||this.startRequested||!eligible.length||!eligible.every(id=>this.ready.has(id)))return false;this.startRequested=true;return true;}
 shouldExit(ids){const eligible=this.eligible(ids);return eligible.length>0&&eligible.every(id=>this.votes.has(id));}
}
module.exports={SessionControls};
