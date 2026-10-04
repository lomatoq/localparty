# Swarm Gate asset and render audit

Read-only art-direction inspection, 2026-09-28. Source `games/sports_siege/public/host.js` was not modified by this audit. Inspected actual turret, wall, muzzle and termite death images; alpha bounds measured with Pillow. Pixel landmarks below are visually estimated to ±3 px, not authored metadata.

| Asset | Image size | Alpha bounds | Useful anchor |
|---|---:|---|---|
| turret-head-long | 284×442 | (23,23)–(261,419) | Current pivot(.5,.31) = pixel(142,305); bore center≈(143,47) |
| turret-base | 359×367 | (23,23)–(336,344) | Complete circular base, no clipped edge |
| turret-pedestal-blue | 476×474 | (18,18)–(456,454) | Socket≈(238,76), bottomfoot≈(238,443) |
| wall-straight | 386×327 | (23,23)–(363,304) | Complete top cap and lower stones |
| muzzle-a | 432×560 | (78,185)–(408,416) | Bright core≈(195,300), center(.451,.464) |
| muzzle-b | 432×560 | (24,134)–(349,466) | Bright core≈(184,300), center(.426,.464) |

At head scale2.55×3.75 and current pivot, bore reach is (305−47)/442×3.75 ≈2.19 world units. Existing2.34 is about18 source pixels beyond the mouth. Muzzle frames have different core x coordinates; either adjust per-frame center or re-anchor once in the rendering helper.

The existing circular base cutoff comes from floor depth: billboard center y=.68, size4.25, 45° camera up vector, opaque bottom at y≈−.63, below floor−.30. Approximately41 source pixels are hidden. The asset is complete and the source viewport is not responsible for this cutoff. Raising the base center to≥1.02 gives floor clearance; alternatively explicit ordered sprite rendering without floor depth occlusion requires wall-order care. A taller replacement pedestal must anchor its socket separately from the head and place its full foot above the floor.

Turret aiming currently calls atan2 on NDC dx/dy, whereas projectile aiming uses pixel-space dx/dy. Multiply NDC deltas by viewport width/height for both. This is a functional diagonal-alignment correction.

Recommended limited finish: soft contact ellipse beneath the pedestal footprint, restrained wall foot/front ambient occlusion (peak opacity .12–.20), no per-brick shadows or wide opaque slabs. The full blue pedestal is suitable; its socket is a clear mechanical mounting point.

The existing termite death frames already show the insect collapsing/fading. Avoid a second large red live-enemy ghost over them. Preserve a short90–120ms projectile flight before the8-frame death sequence lasting about .55–.7s. Current dead-shot flightEnd=0 makes the killing projectile invisible immediately.

Pocket Siege reference is local `games/arcade_deluxe/public/siege-fx.js`: damage numbers23px italic900 with3px dark stroke, rise75px, small curved drift≤18px, brief fade. For Swarm reuse the motion restraint with approved Anybody, ivory damage and gold kill, no rectangular number cards. Values must come from server events, not invented scores.

## Independent final visual review

Personally inspected final real gameplay captures `.localparty-build/swarm-feedback-final/{swarm_gate,peek_shoot}-{720,1080}.png` and `.localparty-build/swarm-wall-final/swarm_gate-wall-720.png` after root's fixes. The complete circular turret rim and bottom are visible at both TV sizes. Gallery kill clouds, rays and gold +10 remain readable. The actual runner behind the gate has a restrained blue silhouette within the gate; open-ground enemies keep their normal colors. No visual blocker in this bounded change.

Audio's separate real-frame assertions passed lethal projectile visibility before impact, target retention until impact, score popup visibility and real server shot/death events. Popup computed HeyPalsDisplay24px900. Static frames alone do not verify cloud rotation or the brief red growth animation; those are present in the renderer and should not be represented as motion proven by a single screenshot. No production code was changed during this independent review.
