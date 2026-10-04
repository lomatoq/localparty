# Round TV arenas — latest targeted closure, 1 October 2026

Owner: marble_ui. Only `games/party/public/host.js` changed. Existing measured `--party-field-inset-top` CSS is preserved. Server physics, player positions/radii, phone controllers, footer, other games and root-owned common header/background are unchanged by this owner.

Push Pit, Last Circle and Bomb Tag use a TV-only projected enlargement around the authored world centre. Requested maximum is 1.3; actual fit includes a complete puck crossing the rim by its normal elimination tolerance and an 8px screen gutter. The projection is based on the initial radius, so Last Circle still visibly shrinks. Identity font size remains 14 CSS px at 720 and scales proportionally at 1080; measured names and event callouts use the projected safe rectangle.

The current launcher has a separate upper brand strip. Its measured notch bottom is 168px at 720 and 252px at 1080; the usable midpoints are 444px and 666px. The original canvas already occupied the below-notch region, so its safe CSS centring was retained. A literal 1.3 enlargement would exceed the remaining 552/828px height. Actual Push/Shrink enlargement is 1.0655/1.0761; Bomb is 1.0401/1.0505. These are explicitly fitted increases, not a claimed 30% change on 16:9.

The normal-clock `scripts/capture-party-round-arena-tv.cjs` launches actual players, real built-in bots and pointer controls. `final-2`/`final-16` contain 44 manually opened TV frames:720/1080 playing, real upward rim input, authored fast-shrink radius below 230, natural Bomb death and actual Pause/Resume. All bounds guards pass; owner/shared sources stayed unchanged inside both runs, with no browser errors. Every accepted image has its own SHA and specific observation in `visual-review.json`.

That inspection found one introduced presentation defect: top-clamped Bomb icon could cover its own puck. That exact old `final-16/bomb-tv-1080-death.png` holder presentation is rejected. A minimal lateral 64-unit offset applies only when vertical clamping occurs. `final-holder-offset-v2-2` has two freshly opened originals at 720/1080 on the current production hash, reached with actual joystick input and verified `holderIcon.clamped=true`: the bomb sits beside the complete puck/glow, with the literal name/fuse below the notch. The first retry reached `clamped=false` and does not claim this branch.

Root's final 64px right-wing alignment is separately captured and manually opened in the four `final-right64-2/16` Push playing originals. It does not alter field/notch geometry. Later root revisions remain outside these exact captured approvals. Root second review is pending for these new hashes.

`node --check games/party/public/host.js` passes. Final production hash is 13c9c90776ae3d0c5f78861baee4fc2be4e8a0f4d014fa7415f3f4176682b589. `production-freeze.json` records that source and unchanged CSS. No further capture expansions or production changes are planned for this build closure. The 52 manually inspected frames include rejected/transitional history; they are not an all-states or hardware approval.


## Final build101 correction: 92–93% visible rim

The latest user decision replaces the previous ×1.3/max-fit target: ordinary Push/Shrink/Bomb round rims occupy92.5% of the measured height between the actual central notch bottom and the TV bottom. The game canvas remains centered in that region. Physical radii, collisions, knockout thresholds, controllers and shared files are unchanged.

A constant hypothetical knockout envelope previously made the field unnecessarily small even when every puck was inside. The renderer now fits actual player bounds. It starts with the requested rim size and only eases outward when a real edge event needs more room; it holds that zoom until a new round or viewport. This prevents repeated camera breathing during ordinary collisions. The shrinking arena remains visually smaller as its real radius falls.

RAW pixel spans, measured independently of the projection model:

| Game / roster |720p diameter |720p top/bottom gaps |1080p diameter |1080p top/bottom gaps |
|---|---:|---:|---:|---:|
|Push /2or16 |509.5px (92.30%) |21 /21.5px |765.5px (92.45%) |31 /31.5px |
|Bomb /2 |510px (92.39%) |21 /21px |765.5px (92.45%) |31 /31.5px |
|Bomb /16 |510px (92.39%) |21 /21px |765px (92.39%) |31.5 /31.5px |

The older frozen Push720 rim measured480.5px; the corrected rim measures509.5px, a6.04% increase relative to that already enlarged revision. The initial no-projection PNG measured about450.5px: the final509.5px is13.10% larger than that baseline. Neither is claimed as×1.3; the final explicit92–93% request is what governs acceptance.

Color Knives previously had a separate0.82 renderer shrink and was excluded from the common round framing. The TV now uses one uniform camera fitting the complete wheel, all16actor bodies, every authored arm pose, held/flying knives and safe name/count labels. Wheel radius225world pixels and actor scene extent about373–378world pixels make a92.5%-height wheel impossible while preserving the full cast. Its720 wheel grows from about282.9px to322.5–325.1px (14.0–14.9%);1080 is488.5–492.5px. Actor arrangement and the real projectile world stay unchanged. The whole visible scene, rather than only its inner wheel, occupies the available height.

Current manual record: `.localparty-build/design-round3/party-round-arena-tv/percent925-final-review.json`,26individually opened images and exact SHA256 hashes. Normal-clock captures include2real browser humans and14real built-in bots for16, real Throw at both resolutions, real Push rim exits and actual Pause/Resume. The first two-player upward rim probe was blocked by the stationary rival; the successful final horizontal exit uses `percent925-rim-final-2`. Its screenshots truthfully show between-round state after elimination. The16-player north exit is still playing with15alive and the full outside ghost.

Root second review accepted seven source-identical PNGs listed in the ledger: four initial priority frames and three later real edge/pause frames. Failed probe reports are retained; they do not count as successful action evidence. Bomb `holder-rim` filenames are joystick attempts and do not claim the top-clamped icon branch. No new Shrink timed replay, physical-device rendering, final-result or every-game approval is asserted in this last targeted pass.

Production freeze: `games/party/public/host.js` SHA256 `284c58c7572dabf9ef807d8fe1b09247432ef6a25adf6e39719e0049a7324cb5`; `host.css` remains `eb7568d2dca58dc82388e5b3a19990f2dd4ff9430561d0ccd770ebd56057dba0`. Shared sources remained unchanged during these captures.

## Reopened after native build101: camera recovery

The previous freeze and its promise to hold the reduced camera until the next round are superseded by this correction. The installed build101 bundled exactly the previous `284c58…` host and `eb7568…` CSS. Its installation log reports success; its automatic launch attempt was refused because the device was locked. That launch log does not establish which process the user subsequently opened manually.

The native external-display source opens the same local `/tv` route in a nonpersistent WKWebView (`ServerModel.externalDisplayURL`, `PartyTVRenderer.load`). It loads server resources from the current app bundle. `/tv` publishes `PARTY_DISPLAY_ONLY`, which the same-origin game bridge reads. The native-style replay showed both the display-only/session-active classes and the parent flag, so a missing TV flag was not reproduced. The game now sets its own `party-round-arena-tv` canvas-layout marker from the local class or actual parent flag, removing a dependency on the complete shared class chain.

The reproducible defect was camera retention. Eliminated pucks remain active in authoritative game state for the rest of the round; the old renderer continued fitting them forever and never restored zoom. In a normal-clock,16-player Push round, the camera remained at86.369% of the safe height after2300ms, before any viewport resize (715.14px model diameter in828px). The old later resized PNGs measured88.99%/89.88% by the projection model and are retained as diagnosis, not accepted final evidence.

Only the TV renderer changed. An eliminated puck and its name fade over the existing1400ms knockout-effect lifetime; once invisible they stop constraining the camera. The live roster count still changes immediately. The camera retains the hard safety fit, waits300ms while more space remains available, then restores with240ms easing. This preserves a complete visible knockout while avoiding a field permanently reduced by an invisible eliminated player. Ghost age uses authoritative visual time, which stays frozen while paused. Player positions, collision/elimination rules, controls, shared files and Swift files are unchanged.

`native-sustained-after-16/report.json` confirms recovery within the same playing round1 before viewport resize:765.23px model diameter in828px (92.418%), with no visible expired ghosts. The subsequent fully settled720/1080 screenshots reach the92.5% projection target. Independent RAW raster measurements of those recovered rims are510px/766px (92.39%/92.51%), with equal21px/31px gaps from the actual notch bottom and TV bottom. Bomb sibling rims measure510px/765px, with equal21px/31.5px gaps. Antialiasing accounts for the subpixel difference from the510.6px/765.9px projection target. Color Knives keeps the previously accepted complete actor/wheel/projectile fit; this correction does not claim a92.5% inner wheel.

Final evidence is recorded in `.localparty-build/design-round3/party-round-arena-tv/native-recovery-final-review.json`:14 individually opened AFTER originals, two personally opened rejected BEFORE diagnosis originals, exact image/source hashes and per-frame findings. Push has real rim elimination and same-round recovery; Bomb has real joystick movement; Knives has actual Throw at both resolutions. All three runs report no browser errors, no source change and no shared-source change. `node --check` passes for the host and helper. Root second review of these new hashes is pending; the earlier build101 approvals are not transferred.

The replay uses Playwright WebKit with an iPhone user agent, mobile/touch context and the actual local `/tv` launcher. Native Swift routes, flags and bundled source hashes were inspected separately. This is not a physical AirPlay/WKWebView rendering approval, a new timed Shrink audit, or an all-game/all-state claim.

Current production freeze: `games/party/public/host.js` SHA256 `e6074b8dac2f865d8b97f0ee259597578411eaec1e6af2780a95e48c335b4ec0`; `games/party/public/host.css` SHA256 `122c172391fd05f11caf5faabab7631b9d9c5cc7a2a783894b9eca8dbff5a1a8`. The `production-freeze-native-recovery.json` artifact records this supersession. No further production edits or expanded audit are planned by this owner.

## Physical build102 reopened: 4K receiver units, build103 freeze

The user's external-TV report was correct. A log copied from the installed iPhone app at `Library/Application Support/LocalParty/lifecycle.log` records build102, a phone launch of Bomb with one external display, and the actual `/tv` receiver viewport **3840×2160, DPR1**. The game route is `/games/bomb/host`. Earlier 720/1080 mobile-user-agent captures did not exercise this physical receiver size. Installed bundle hashes matched the prior host/CSS freeze; this correction does not attribute the defect to cache or user error.

At4K the shell displays a1920×888 child iframe at scale2, occupying3840×1776 receiver pixels from y384. The central notch ends at receiver y504. Its120px overlap is therefore **60 child CSS pixels**. `public/bridge.js` previously applied the120 receiver pixels directly as120 child pixels. That shortened the usable canvas and displaced its midpoint downward. The production change divides parent-rectangle distances by the measured iframe scale before publishing the existing stage/native/field inset variables. It runs only in the display-only branch, retains the current ResizeObservers, and changes no Swift code, phone control layout, physics, player positions or arena radii. Party host/CSS are unchanged in this correction.

The fresh normal-clock actual `/tv` route reproduces the defect with the old bridge and verifies the corrected bridge on the same4K viewport:

| Receiver measurement | Build102 bridge | Corrected bridge |
|---|---:|---:|
| Published child inset |120px |60px |
| Canvas height in child CSS pixels |768px |828px |
| Circle diameter in receiver pixels, projection |1420.8px |1531.8px |
| Fraction of1656px below-notch height |85.797% |92.5% |
| Circle centre / required centre |1392 /1332px |1332 /1332px |
| RAW Bomb rim diameter |1420px |1532px |
| RAW Bomb upper / lower gap |178 /58px |62 /62px |

Independent RAW RGB scans also measure the corrected Push rim1532px at4K,510px at720 and766px at1080, with equal62/21/31px gaps respectively. Bomb measures the same corrected RAW spans on these originals. Inclusive raster spans differ by at most about1px from the fractional projection because of antialiasing. The before/after RAW result is a112px increase at4K and a60px upward correction, not another unchanged initial720/1080 screenshot.

All four Party round games are covered by the current bridge correction. Push/Bomb ordinary round rims reach92.5%. Color Knives retains its full actor/wheel/held-and-flying-knife fit; its inner wheel alone is not promised92.5%. Last Circle's authored shrinking mechanic remains visible: the fast setting starts shrinking immediately, so its first captured authoritative radius is287.611 rather than the initial292. At4K that RAW rim is1512px (91.304% of safe height), centred with72px gaps. Natural shrink reaches radius228.503 and a1204px RAW rim with equal226px gaps. The smaller later diameter is gameplay, not a layout regression. A real north knockout and actual Pause were also captured with the full ghost/name and winner overlay fitting below the notch.

The manual ledger `native4k-final-review.json` records43 individually opened originals with exact image/source hashes:3 BEFORE diagnosis/baseline and40 AFTER. The31 arena AFTER frames cover720/1080/4K,2/16 real players, real Push knockout, Bomb joystick input, acknowledged Knives Throw and natural Last Circle shrink/pause. The early4K Knives throw sample is accepted only for layout and is superseded as action evidence by `native4k-knives-ack-2/knives-tv-2160-throw.png`, which waits for the authoritative5→4 decrement. Bomb `holder-rim` filenames do not claim the top-clamped-holder branch. The16-player north knockout temporarily reduces Push to87.145% while preserving the complete visible ghost; ordinary-round92.5% is not asserted during that safety fit. No final-result or all-state approval is added here.

The remaining9 AFTER originals check shared-inset consumers Spy, cooperative Marble Bloom and Sinyak Quiz at4K plus their actual320/393 phone controls. Their specific question/role/answer or track/aim/ammo/button/footer layouts fit; no production files in those games changed. Root's subsequent phone CSS is separately owned and is not implicitly approved by these captures. All completed runs report zero browser errors and unchanged watched production sources. Root personally confirmed the exact4K Bomb BEFORE diagnosis and accepted the exact corrected4K Bomb composition; other new image approvals are not transferred from previous freezes.

`scripts/capture-party-round-arena-tv.cjs` now defaults to720,1080 **and3840×2160**, maps child bounds back to receiver units and asserts the actual notch/TV midpoint and inset. `node scripts/qa/check-party-native-4k.cjs` additionally rejects the saved build102 inset/centre errors and accepts31 current arena frames, including real shrinking/edge states. `node --check` passes for bridge, host and capture helper. The saved regression report is `native4k-regression-check.json`; RAW measurements are `raw-pixel-measurements-native4k.json`.

Production is frozen for build103: bridge SHA256 `82fdfac20f269da538ae92aa02b9f64e4585a7c84ef5141d4aeca4881c577f67`; host/CSS remain `e6074b8…` / `122c172…`. `production-freeze-native4k.json` records the exact hashes and source supersession. **The physical AFTER build103 is pending live external-TV telemetry.** The fresh AFTER evidence is the actual local route replay at the receiver dimensions obtained from physical build102, not a claim that the new app has already been observed on the user's TV.
