# Performance244 — state-driven game UI

2026-10-07. Six runtime families, seven catalog games (Quiz and Warsaw share app.js). Read AGENTS, design contract, UI regression rules and G10/G11 audit. Applied [Addy Osmani performance optimization](https://github.com/addyosmani/agent-skills/blob/main/skills/performance-optimization/SKILL.md): frozen before sources, sequential isolated measurement, semantic presentation guards, then re-measure and behavior/capture checks.

## Evidence boundary

`scripts/performance244-ui.cjs` starts the real embedded launcher/workers and authenticates 16 separate game controllers. TV: 1920×1080; phone: actual `/play` at 393×852 with BOTH native controller-bridge.js and persistent tabs.js injection. The browser fixture normalizes id/token/name/avatar/hand from WS envelopes, exactly as production profiles do. Persistent web tabs intentionally stay hidden because Swift provides the visible tab bar.

The main CPU sample replays 100 cloned authoritative snapshots, three times in each phase. This is bounded unchanged-state stress, **not a real network snapshot rate, a 5–10× application-speed claim, or physical WKWebView/AirPlay proof**. Task CPU includes follow-up DOM observers/style/layout through two frames. Timers get a separate 2.1 s live window. Baseline/after source selection changes only the family JS; approved shared art/styles/effects remain served by the same working tree. No native app build or physical device measurement in this lane.

Before source files and SHA-256 manifest are in `output/playwright/performance244/ui/before/`. Current accepted and primary-replay source hashes, all repeated values and timer windows are in `summary.json`; raw per-game JSON includes CPU, mutations, behavior and page errors. Samples are sequential; no overlapping game/browser profiles.

## Kept changes

- Each family retains its latest presented semantic snapshot. Only top-level serverTime is omitted; deadlines and all public/private state fields remain included. Network state and clock offsets still update before presentation. Locale, profile fields, pending input/socket readiness/target and Millionaire suspense-hold state invalidate when relevant.
- Profile invalidation compares retained primitive id/name/avatar/testBot fields and a revision; it does not repeatedly serialize large avatar data URLs. The latest field array replaces the previous one.
- Monster roster and queue, Spy lobby/reveal/playing rosters, and Millionaire score ladder retain unchanged content across genuine unrelated updates. Millionaire avoids ladder append/read FLIP layout on unchanged ladder values; finite money count-up and reveal suspense remain.
- Raw timer text writes only when its displayed source value changes. This preserves existing translated text between ticks. Smooth time bars/rings keep their authored 120/100/250 ms cadence.
- Naval keeps disabled grid state, reload mode/label/count/aria unchanged when values match; shooter eligibility, target, shot IDs, cooldown updates, commands and 150 ms server tick stay intact. The 100 ms timer previously rewrote 36 disabled attributes and woke answer-decoration observers.
- Rejected/normalized local settings are still restored from the server even when the accepted server snapshot equals the previous one. This includes current DOM values in the guard condition, avoiding a stale invalid local draft.

## Chromium primary snapshot measurement

Median milliseconds per 100 identical playing snapshots; mutation values show three after repeats. This pass measured the six semantic guards before the additional narrow Naval component cache described below.

| Family | JS before | JS after | Task CPU before | Task CPU after | DOM mutations before → after |
| --- | ---: | ---: | ---: | ---: | --- |
| monster | 25.8 | 0.8 | 300.2 | 9.4 | 5404 → [0, 0, 0] |
| spy | 3.3 | 1 | 13.9 | 2.6 | 1304 → [0, 0, 0] |
| millionaire | 473 | 1.4 | 668.6 | 5.9 | 16220 → [1, 0, 0] |
| quiz | 37.3 | 1.5 | 141.3 | 7.2 | 15494 → [4, 2, 4] |
| crocodile | 30.1 | 1.4 | 133.2 | 4.1 | 14286 → [4, 3, 3] |
| naval | 177.2 | 3.9 | 3032.6 | 7.1 | 112187 → [1288, 4, 6] |

All six show Task CPU improvements well beyond these repeated sample ranges. Naval's first after battle sample normalizes local target once, producing 1288 mutations; subsequent samples contain only 4–6 timer/style mutations and 6–7 ms Task CPU. That remaining one-time render is recorded, not hidden. Crocodile lobby still produces 200 unchanged disabled writes per 100 calls via tick; its full roster rebuild is removed. No UI quality/pixel density/effect reduction is part of these changes.

Live 2.1 s timer windows: Spy 18→10 mutations, Millionaire 42→24, Quiz 102→28, Crocodile 34→20, Naval 1760→132. These are short windows; smaller timer mutation counts alone are not a broad CPU/device claim. Largest confirmed cause: Naval's prior 100 ms disabled writes cascaded into 1584 shared .party-display-answer mutations in 2.1 s.

## Behavior and visual verification

- All six: stable row identity on unchanged replay, literal `<bold> & Алекс` rename (no HTML execution), English→Russian→English, remove player 16→15 and restore 16, zero page errors. Avatar profile updates checked in the four families that show roster avatars (Spy/Millionaire/Quiz/Naval).
- Accepted lobby settings restore after an invalid local DOM draft in Monster/Spy/Millionaire/Quiz/Crocodile.
- Real native controller fixtures authenticated the same identity in all six; Quiz/Crocodile/Naval additionally exercised their shared app.js against private `me` state, row retention and literal rename.
- Existing rule/protocol tests: 33 distinct assertions passed across Monster, Quiz, Quiz pacing, Crocodile and Naval. Monster managed network test required local-listen execution outside the sandbox; this was a sandbox EPERM, then passed. No rules or input cadence changed.
- Opened and visually reviewed 19 fresh Chromium captures: six real TV waiting surfaces, six playing surfaces, Spy role reveal, and six native controller routes. Artwork, game color, glow, names, secret/private controller fields and existing geometry remain. Screenshots do not validate haptic hardware, physical cast performance or all later-game states.
- Final production sources passed the same six-family WebKit behavior/native-route checks with zero page errors. Opened and viewed all 19 final WebKit captures, plus the four accepted genuine Naval states and its paired before action screen. Source hashes and raw reports remain in the gallery. WebKit geometry/private fields match the authored surfaces; dense TV rosters and Spy reveal keep their inherited scrolling/truncation behavior.

## Genuine Naval counter/cooldown measurement — accepted

Three authoritative waves of 16 legal shots exercised real cooldown, public grids, normal shell/impact work and rank order. The first two were identical miss waves in the before and isolated candidate runs. Their results accepted the narrow host-only crew-facts/fleet-title cache:

| Matched miss wave | Task CPU before → after (ms) | Script CPU before → after (ms) | Created elements before → after | Crew mutations before → after |
| --- | ---: | ---: | ---: | ---: |
| 1 | 484 → 268 | 170 → 72 | 2606 → 302 | 3680 → 48 |
| 2 | 508 → 258 | 171 → 65 | 2608 → 304 | 3680 → 48 |

Both matched windows removed exactly 2304 element allocations from stable crew facts and fleet title artwork. Task CPU dropped about 47%; these are two matched actual-action windows, not a global app/cast speed claim. Public-grid writes remained 9216 per wave. The third wave proves hit-induced roster order; randomized fleets yielded sunk before versus hit after, so its CPU is excluded from the strict comparison.

The cache retains authored row text while decorated source values match, rebuilds facts/title artwork when health/hits/shots/sunk/locale/name/avatar/density labels change, and uses `insertBefore` only where row order differs from the authoritative order. WeakMap entries follow live nodes. Controller rows, commands, targeting, private fleets, public/controller grid updates, effects, eligibility and cadence remain as before.

Frozen pre-components sources, the isolated candidate and its guarded preparation script are retained in the artifact folder. The candidate is applied in production; its hashes match `summary.json`. All seven final source files have immutable copies and SHA-256 values in `final-source-manifest.json`. All original rename/locale/avatar/remove/restore/private-controller behavior checks passed with zero page errors. Final replay retains the one-time target normalization (884 mutations in the first sample, then 5/5), while its median Task CPU stays 6.8 ms per 100 repeated identical snapshots. Fresh genuine before/after screenshots retain the authored geometry; different avatars/cells reflect independent authenticated sessions and randomized fleets.

## Remaining boundaries

`public/bots.js` remains unchanged by this lane. Offscreen bot controllers run normal input/drawing/cadence; blanket RAF or document.hidden suspension is unsafe. Actual fallback event-canvas use in G11 is unproven because shared HeyPalsSprites may replace it; no speculative fallback pause change made. Actual AirPlay at the receiver resolution, thermal/GPU work and popup/native interactions remain separate root/device validation.
