# Results choreography, 2026-10-06

Implemented under animate guidance after read-only audit and build128 freeze release. No build or commit.

TV: tv-show owns presentation entrance/exit and podium sequence; removed the competing podium callback/observers from tv-motion only. Parent reversal samples current opacity/scale. Result identity is separate from content signature: same-board avatar/name/score updates preserve keyed seats and their live animations, including crown on avatar replacement. Fresh result cancels prior reveal. Equal ranks receive equal beats (other ranks0ms, bronze80, silver160, gold240); plinth settles, portrait joins, crown lands last. Score values stay authoritative and plinth opacity is not hidden. Existing art/material/crowns remain.

Phone: shared match-results uses the same rank-group timing and a winner medal settling accent. Final scores remain readable from the first frame; removed reset-to-zero count-up and nth-child entrance hiding/glint override for this surface. Same-layout content refresh preserves rows/animations; same result after hide does not repeat entrance. Existing bounded fireworks remain, with existing once-per-result semantics.

Lifecycle: tracked result animations cancel on reduced-motion changes, pagehide, and replacement; phone also cancels on native hide. TV parent exit retains its generation guard and reopens from live pose. No new heavy effects, layout animation, dependency, or input delays.

Verification:
- tests/browser/podium-motion136.cjs: Chrome+WebKit actual TV/controller DOM fixtures, 1/3/7/16 TV seats, tied gold/silver/bronze group delays; name/avatar refresh preserves seats and animations; rapid80ms exit/reopen continuity; reduced motion at startup and mid-reveal. Phone seven-row tied result verifies immediate final scores, full opacity, same rows/animations on refresh and reduced cleanup. Fresh seekable WAAPI filmstrips at0/240/600/1100msTV and0/240/500/900msphone. output/playwright/podium-motion136/report.json.
- 60 tests passed: shared-result-contract, result-ranking, tv-podium-catalog.
- tv-podium-logos-browser.cjs:36 logos, company title, missing-image fallback and late-load race passed WebKit reduced motion.
- result-celebration.browser.cjs: real two-player Tap Race finishes;320/393, normal/reduced, once-per-key, cleanup all passed. Evidence .localparty-build/design-round2/results/.

Visual review: TV crowns readable above both equal winners, retained medal material and portrait hierarchy. Phone393 final scores remain stable beside names; list scroll/fade remains for lower places. Controller filmstrips use actual index.html with only app transport blocked; TV fixture uses tv.html with only tv.js blocked and explicit normal1920→1280logical stage fit. Thus choreography checks are controlled renderer evidence, not physical iPhone/AirPlay performance measurements. Existing live TapRace test supplements fixtures. No broad all-game gameplay claim.
