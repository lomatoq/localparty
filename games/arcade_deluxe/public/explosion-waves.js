import './explosion-timeline.js';
const {waveSample}=globalThis.PocketExplosionTimeline,TAU=Math.PI*2;

// Persistent, snapshot-driven rings. No wall-clock age, particle budget or
// sprite bounds: a late host sees exactly the same wave as an existing host.
export function drawExplosionWaves(ctx,state,weapons={}){
 let drawn=0;
 for(const wave of state.explosionWaves||[]){
  if(!Number.isFinite(wave.x)||!Number.isFinite(wave.y))continue;
  const sample=waveSample(wave,state.t);if(!sample.active)continue;
  const inner=Math.max(0,sample.innerRadius),outer=sample.outerRadius;
  // DRAW_COLOR is a palette index, not RGB. Until the actual original palette
  // is verified, explicitly use the weapon's authored fallback color.
  const candidates=[wave.color,weapons[wave.weapon]?.color],color=candidates.find(v=>/^#[0-9a-f]{6}$/i.test(v||''))||'#d8dec4';
  ctx.save();ctx.translate(wave.x,wave.y);ctx.fillStyle=color;ctx.globalAlpha=.94;
  ctx.beginPath();ctx.arc(0,0,outer,0,TAU);if(inner>0){ctx.moveTo(inner,0);ctx.arc(0,0,inner,0,TAU,true);}ctx.fill('evenodd');
  // Subtle concentric bands make the source's expanding/erasing annulus
  // readable without pretending its palette32/48 colors have been recovered.
  ctx.clip('evenodd');ctx.strokeStyle='#000000';ctx.globalAlpha=.13;ctx.lineWidth=1;
  const spacing=Math.max(4,Math.min(16,Number(wave.drawColorLength)||12));
  for(let radius=Math.ceil(inner/spacing)*spacing;radius<outer;radius+=spacing){if(radius<=0)continue;ctx.beginPath();ctx.arc(0,0,radius,0,TAU);ctx.stroke();}
  ctx.restore();drawn++;
 }
 return drawn;
}
