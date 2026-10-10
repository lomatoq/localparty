# Graphics251 — accepted QR reuse, unpromoted TV candidate

2026-10-10. Baseline `dfe3a836021b5a2a4a4da93f39362feefe31af49`.
Only the two-line native QR context-lifetime change is accepted. Its actual
CoreImage proof, platform boundary and root review are in
[native-graphics251.md](native-graphics251.md). Native regression45/45 passed;
iOS Release153 built successfully. This is not physical-phone/cast FPS acceptance.

## Remote check

GitHub's live main ref remained `dfe3a83` during the work. Remote
`network-optimisation` at `488b20fb707734193b33bd531583cdd183ce1a5c`
contains two commits absent from main: `11f890d` (network workflows) and
`488b20f` (optimization and removal of the four problematic games). The comparison
is diverged, two ahead/two behind. This round does not merge that work or modify
the friend's game/network architecture. Other retained remote branches are
`heypals/ux-polish` at `87dd64f` and `heypals/tanks-projectiles` at `19f69a9`.

## TV podium: concrete discarded image preparation

`public/tv-show.js` builds detached portraits, mascot/photo images and crowns for
all rows when a board's fields change. If its result key is stable, existing
reconciliation then retains old seats with the same player/rank and old portraits
with the same name/avatar key; the new portraits are discarded. The isolated candidate hoists the previous
seat map and skips portrait preparation only for this already-retained case.
Initial/fresh boards, rank changes, missing seats and changed portrait keys still
use the original creation path. It changes no CSS, assets, motion, shader, blur,
resolution, quality setting, game mechanics or network protocol.

Frozen baseline source SHA256:
`d92d60a3497ed1b3c0c7fd19b8f9ef6e4346372eb85f1f94ab888766fb3b3c7b`.
Candidate:
`7f55875bee7639d80623d65db78c80d85fd086c33f17881946d30e1a047e9a24`.
All preparation/diagnostics remain ignored under
`.localparty-build/performance251/podium/`. Public podium source is unchanged.

## One bounded raw CPU comparison

Only one timing experiment ran, after the native experiment released its slot.
Shipped TV markup/styles/avatar/coin code and `LocalPartyShow.update` use a
deterministic server-state fixture at1920×1080. Effects are disabled in both
variants. Each browser/count has eight ABBA/BAAB blocks, sixteen frame-separated
score updates per cohort, matched warmups and identical preparation. These are
synchronous update wall times; deferred observer/layout/GPU work is outside the
interval. No constructors/vendor hooks/capture/readback exist in timed cohorts.
This does not establish active casting, GPU savings or popup latency. Independent
review subsequently found `lib/tv-director.js:123` includes `[id,rank,points]` in
the real company board key. Real company coin updates therefore make the board
fresh, bypass this retained-seat condition and receive no candidate savings.
The timing fixture's stable `company251` key is an artificial retained-result
path, not a measured shipped company coin update. Stable match results and
name/avatar updates can reach that condition; their real frequency was not
measured. This is an additional independent reason not to promote the candidate.

| Engine / rows | Baseline sample median ms | Candidate sample median ms | Paired block mean savings ms | Positive blocks |
| --- | ---: | ---: | ---: | ---: |
| Chrome /7 | 1.0 | 0.9 | .109–.178 | 8/8 |
| Chrome /16 | 1.9 | 1.6 | .159–.372 | 8/8 |
| WebKit /7 | 2 | 2 | 0–.406 | 7/8, one tie |
| WebKit /16 | 3 | 3 | .219–.563 | 8/8 |

WebKit's clock samples are quantized to1ms; its median is neutral. Arithmetic
means show smaller update work, but must not be described as a median/FPS gain.
Separate Image-constructor diagnostics counted256→0 discarded images across
sixteen16-player updates in both engines. Those counts are allocation-work
diagnostics, not measured GPU passes. Raw samples:
`output/playwright/performance251/podium-timing/report.json`.

## Visual gates failed; candidate remains rejected

1. `podium-attempt01/report.json`: initial16 and score-update16 full-viewport
   RGBA pairs are exact. DOM, geometry and natural image dimensions matched
   through name/photo/rank updates. The seven-row ties capture failed strict
   equality at five pixels with maximum channel delta1. Root viewed both initial
   and ties originals: no visible layout/art difference. No timing cohorts ran
   in this first probe.
2. `podium-control/report.json`: identical baseline source in both slots passed
   all24 state/motion checks. Its Chrome match capture differs at77 pixels,
   maximum delta1; other Chrome pairs and all four WebKit pairs are exact. This
   establishes that exact screenshot equality is not universally deterministic,
   but does not by itself explain every candidate difference.
3. `podium-settled/report.json`: a separate snapshot-only attempt completes finite
   animations/cancels infinite ones. Initial/score-update pairs remain exact;
   strict ties equality fails again. Production timing/easing is untouched.
4. `podium-review/report.json`: a full read-only review used the observed control
   bound rather than calling all small differences harmless. Initial/score/ties
   pairs are exact in this run, but Chrome match differs at410 pixels (409 with
   channel delta1, one with delta3), exceeds that bound and stops the
   gate. No broader tolerance or new timing run was introduced. WebKit candidate
   correctness was not reached in these stopped comparisons.

All originals and failures are retained in sibling
`output/playwright/performance251/podium-*` directories. The first ties delta was
repeated in the settled attempt; the later exact ties result does not justify a
claim that the entire candidate passed. Root stops this hypothesis and does not
promote it, despite favorable allocation/CPU results. Further work requires a
fully controlled rendering comparison and a measured actual producer/update path.
The independent reviewer found the conditional source safe for shipped unique
IDs and no visible shifts/missing portraits/crown damage in the originals, but
noted changes on portrait rings as well as text. It recommends rejection under
the failed gate and producer-path limit; favorable synthetic timing is insufficient.

## Additional read-only investigation

The eligible smooth-logo canvas count from shipped source is native Menu0, TV
lobby0/waiting1, ordinary web at most2 mounted waiting/last-match logos. Discovery
logos and Host Pick artwork are outside that renderer's selector. Caching its
ancestor styles therefore does not address native Menu popup stalls. A suggested
eligible-image dispatch set was not measured or implemented in this round.

No excluded game was optimized and no artwork/blur/effect/FPS quality was reduced.
Physical iPhone and separate active-TV measurements remain open. Current device
inventory shows a disconnected network tunnel, so build153 is not reported as
installed or physically profiled by this round.
