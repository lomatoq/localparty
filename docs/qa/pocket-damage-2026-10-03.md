# Pocket Siege damage and effects — 2026-10-03

Two authoritative damage defects were reproduced and fixed in `games/arcade_deluxe/core/pocket-runtime.cjs`. No renderer, UI, weapon definition, live phone session, build or installation was changed in this lane. Pocket Siege scores damage; it has no HP depletion rule. No health rule was added.

| Reproduction | Before | After |
|---|---|---|
| SonicBlastMiniBullet swept tank contact | Authored damage1 multiplied by1/18, discarded by score rounding; no hit event |1 point and visible +1 |
| SniperRifleBullet swept contact |6 points from authored100 |100 points and visible +100 |
| LaserBullet swept contact |7 points from authored70 |70 points and visible +70 |
| Ten ChalkDustParticleFog entities at tank center, each1 DPS for0.1sec | Each entity loses its own0.1 remainder; total0 | Shared attacker/target remainder reaches1 point |
| One same fog entity |0 points |0 points; no invented minimum |
| WackyTankShrapnel, authored damage0 |0 points with visual impact |0 points with visual impact |

Confirmed direct tank collision provenance travels through that impact's trigger commands only. Full authored contact damage applies only to the contacted target at the unchanged impact location, and only while that target remains within the existing damage envelope. Offset effects and other targets retain radial falloff; new child bullets never inherit the target identity. Throw impulses retain their existing radial scaling. Delayed effects cannot hit a target that has moved beyond the envelope.

Authored material fractions now accumulate across entities per attacker/target within one turn. The ledger resets on turn/round change, prunes removed participants, and stays bounded by the roster. Disconnected participants retain the existing target behavior. DPS, lifetime, radius, whole-point scoring and score signs remain unchanged.

## Evidence

All evidence is under `output/qa/pocket-damage-2026-10-03/`.

- `baseline-tests.txt`:19 pre-fix tests passed, showing the prior execution audit did not detect lost damage.
- `baseline-damage-audit.json`:pre-fix contact behavior reconstructed by reversing only the direct-contact patch in an isolated module; raw report retained. Its material probe window was capped at2seconds, so do not compare its material totals against the final full-lifetime probes.
- `damage-audit.json`:321 weapon definitions,1134 damage/effect nodes,629 positive-damage/DPS nodes. Every declared bullet's actual swept-contact routine was exercised:1393 routes,759 confirmed tank contacts.61 additional routes immediately award scored hits (377→438); remaining contact outcomes retain declared zero-damage, child or delayed behavior.91 positive radial stages previously scored no hit at the tank surface. All confirmed-contact damage contracts now pass. This is controlled source-node coverage, not a claim that every conditional child is reachable in ordinary cannon play.
- `final-tests.txt`:24 passing tests, including321 weapons×cannon/drop/oblique=963 complete simulations, contact/miss/offset/other-target/new-child controls, zero-damage stages, unchanged falloff/throw/friendly signs, and material fraction ownership/reset/removal checks.
- `catalog-browser-report.json` / `runtime-browser.txt`:current WebKit replay of321 actual server-generated cannon shots,187629 events,50224 material events,0 missing material profiles,0 unsettled shots and0 browser errors. `catalog-effects.png` was opened at original size; real Mud Pie growth, Magic Forest growth and Burn Barrel material pixels are visible. The other318 cases establish event/profile integration rather than pixel equivalence.
- `browser-confirm/report.json`:18 screenshots,9 representative authoritative collision/handler fixtures×1280×720/1920×1080. `errors:[]`, `changedFiles:[]`, explicit start/end hashes including `.cjs`. Actual score events were measured as nontransparent glyph pixels. All18 originals were individually opened. Swept-contact fixtures use the actual server collision routine and12 authoritative simulation steps; material/beam fixtures invoke declared server handlers in a controlled scene. These are not live-room or physical-device screenshots.

Representative originals in `browser-confirm/`: `sonic_blast-{1280,1920}.png`, `sniper_rifle-{1280,1920}.png`, `laser-{1280,1920}.png`, `pebble-{1280,1920}.png`, `zapper-{1280,1920}.png`, `tesla_coil-{1280,1920}.png`, `burn_barrel-{1280,1920}.png`, `chalk_dust-{1280,1920}.png`, `wacky_tank-{1280,1920}.png`. Damage text is legible beside the target at both sizes; beam spans paint visibly. Chalk Dust's sampled short-lived material phase is not a claim of persistent fog visibility; its +1 feedback and source-profile loading are proven. The prior `browser/` fixture capture is retained; `browser-confirm/` advances real explosion time and gives beams a visible80-unit span without changing production sources.

## Source intent and remaining limits

The engine uses Canvas2D particles and indexed-mask feedback, not GPU shaders. Current replay found no reproducible decoder/profile/renderer exception, so no effects source was changed. Known original-engine fidelity limitations remain documented in `docs/pocket-effects-deep-audit.md` (emitter trajectories, zap selection/flashing, lightning segmentation, fog and coating fidelity). Passing this audit is not exact original-engine emulation.

47 definitions have no positive authored damage/DPS node (terrain, movement, tracer and utility programs). Those are listed in the audit and were not converted into damaging weapons. Individual weapons may also contain zero-damage launch, dud, dust or utility stages before later damage. The archive's absent BubbleGunDudExplosionBullet and RoboticWormDudBullet remain diagnosed compatibility no-ops; StarCruiser's malformed branch remains a source ambiguity. The existing catalog compatibility duplicate remains intact.

The user's exact weapon names and physical-phone reproduction are still unspecified. These concrete defects can explain visual hits without scored damage, but the checks cannot establish that they are the only cause in build112. No deployment claim is made.

## Freeze

Only production file changed here:

`games/arcade_deluxe/core/pocket-runtime.cjs` SHA256 `e107a675f890ae5ef2c0b5b9d856cb28524b6d47f1f8abda60c4327c5ad937a2`.

Added verification sources: `scripts/audit-pocket-damage.cjs`, `tests/pocket-contact-damage.test.cjs`, `tests/pocket-damage-feedback-browser.cjs`. The browser report records unchanged renderer/core companion hashes. `pocket_layout` owns `public/host.js` and `style.css`; its earlier layout capture used the intermediate direct-contact-only runtime hash `f3900dc8de8de0202b7e5ea6dfae625f6b46ee88bc02c26fa813ade00a31cf12`, owner-attested because that harness does not auto-watch `.cjs`. Do not replace that provenance with the final engine hash.

All browsers/test servers closed. Browser slot released. No build/install.
