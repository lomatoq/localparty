# Marble Bloom — actual gameplay review, 30 September 2026

Owner: `marble_ui`; production scope is `games/arcade_deluxe/public/**`. Neighbour changes, game mechanics, the approved session footer, rules, main menu and matchmaking are preserved. Root owns common masthead and effects.

The old renderer cropped entrances twice: the 1280×720 path cache excluded negative path coordinates, and the TV camera fitted only the nominal world. The cache now includes an 80-unit border, while `marble-layout.js` fits the path, petals, gate rims and reachable aim-cross geometry. The camera remains stable for each level. Its quiet margins let a phone player aim at the whole world without hiding extreme geometry; they do not move with the ball chain.

Co-op reserves the actual score strip and masthead protrusion. Versus uses equal-size cards, with a full third card centered below two upper cards. Names and explicit Points values sit in headers outside each world. Numeric values use FatRunner900 italic; literal names use upright Fit. Duplicate bottom scores are hidden only in versus because they competed with the third board. Native 1080 TV scales logical labels and margins consistently with its field. Inverse aiming uses the same CSS-pixel projection.

`scripts/capture-marble-round3.cjs` launched a real normal-clock server and browser humans, used actual Ready/Swap/Fire, verified authoritative shot changes, froze deadline and chain during Pause, resumed and reloaded the same identity. The final accepted owner capture set is `.localparty-build/design-round3/marble/final-scroll`: 28 screenshots across co-op1/3 and versus2/3, TV1280×720/1920×1080 and phone393×852/320×568, including actual post-shot and pause frames. Every frame was freshly opened in labelled contact sheets and separately recorded with SHA256 and a specific observation in `visual-review.json`. Report errors and owner source changes are empty.

The two focused layout tests pass: all six authored track geometries fit including negative entrances/rims; inverse conversion is exact at world extremes; versus2/3 cards have equal dimensions and clear upper/lower boundaries. The existing deluxe renderer regression also passes uniform aspect, inverse aiming, Pocket camera and bounded map/pose transitions.

The actual screenshots show Orbital Garden level1, not all six levels. Pure geometry guards for other paths do not substitute for their visual review. A real Marble finish and local-host versus pointer aiming were not driven in this round. Browser screenshots do not validate physical native haptics. Root’s earlier review of another directory is not transferred to the new frames; the current four priority images require their own second-review hashes.

Shared metric target: co-op `#scores .score-readout strong`. Versus values are canvas text and its duplicate DOM score strip is hidden; common DOM score pulse must skip hidden targets.

## Truthful versus clock — subsequent targeted correction

Root's current screenshot review exposed a real metadata gap: TV read `duration−t` from the versus snapshot while the published UI had no deadline, so phone showed GAME. The local deluxe server now publishes a deadline only for actually playing versus. Co-op remains untimed. Its local Pause listener also republishes UI immediately because the game interval stops during Pause; otherwise the engine freezes while old `playing/endsAt` metadata remains stale. No shared runtime or mechanics were changed.

`final-deadline-2/report.json` passes normal-clock playing/resume/reload deadline comparisons for all four scenarios: versus published remaining differs from actual duration−t by less than180ms; co-op endsAt remains null; Pause freezes chain/t and publishes phase=paused with null deadline. The34fresh frames, including320 pause and320/393 reload for versus2/3, were all manually opened and separately recorded in their current `visual-review.json`. The previous28frame geometry approval does not approve these new hashes. These captures include root's developing TV metric chips; final shared HUD freeze review remains root-owned.

## Frozen TV chip review

`final-tv-chips/report.json` completed at21:39:30UTC:16 fresh TV frames across co-op1/3 and versus2/3, before/after real shots at720/1080. All16 were manually opened and individually recorded in `visual-review.json`. The eight local source hashes and shared tv.js/tv-information.css hashes stayed unchanged within the capture. Root's subsequent Poker-only hand-chip exclusion has no Marble rendering branch change; that causal scope does not transfer screenshot approval. Whole paths, entrance/gate rims and three equal versus fields remain within the canvas, with numeric Points separate from player identity.

Root personally opened the two current `final-deadline-2/versus-3-phone-320.png` and393 frames and accepted their visible2:57/2:58 clocks, Swap/Fire controls and footer composition. Their exact current PNG and source hashes are recorded under `secondReview`. A shared ranking change later in the round is separate from these layout/deadline captures.

## Final outside-field background freeze

The final authorised change exposes the root-owned common brick/glow backdrop outside the authored world: deluxe canvas now uses alpha and clears the frame before drawing its existing opaque world, and the outer arena/controller wrappers become transparent. Path, terrain, sky, controls and camera calculations are unchanged. `node --check games/arcade_deluxe/public/render.js` and the existing `tests/deluxe-render-regression.cjs` pass after this change, including aspect ratio/aim mapping, settled tank pose, map crossfade lifecycle and bounded snapshots. Production stopped for the local iPhone build immediately afterwards. Earlier screenshots remain evidence for their exact captured composition; no fresh manual final-background approval is inferred.
