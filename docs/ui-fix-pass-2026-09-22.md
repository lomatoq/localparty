# UI and gameplay refinement — 22 September 2026

The existing violet, lilac and lime Rubik direction is retained. The approved Superdesign Now Playing reference was reused; no new design generation was needed.

## Implemented

- **1–5:** Host dock gets a continuous blurred backing, animated height, separate collapse/expand scroll thresholds and mutually exclusive menus. Compact order is title → Controller → round more button. Search is a capsule with an icon. Pause keeps an available Controller action; disabled controls are explicit. The notice uses a subtle solid border.
- **6–9:** Denser catalog and Fresh cards; compact controller waiting header with a gradient and the same height system as gameplay.
- **10:** Shared native feedback distinguishes selection, navigation and confirmation, with fallback feedback for game actions and suppression of duplicate short native pulses.
- **11–13:** TV readouts have outlined surfaces, the notch clips long labels, and the shared header reserves only its 64 px wing height. Its 104 px central notch overlays the game. The old 40 px strip is no longer reserved below the header.
- **14:** Shared party controller layout places instructions and status cards in separate flow regions; small-height landscape gets a two-column layout. Jenga selects remain inside their container.
- **15–17:** Pocket Siege removes repeated time/round information and adds bottom control space. Tank Arsenal shows numeric HP and a bar both beside tanks and in the scoreboard.
- **18:** Kart steering uses held left/right buttons, with pointer, keyboard, cancel, blur and reconnect release handling.
- **19–22:** Crane background framing, camera interpolation across turns, sway, retained drop rotation, contact response and off-centre stack torque are adjusted. Centered-stack stability remains tested.
- **23–24:** Western Duel has extra spacing under Shoot and a vertically centered responsive scene.
- **25–27:** Marble Bloom launchers are spaced farther apart; colored aim markers and contrast-backed trajectory dots clarify their direction.
- **28–29:** Bow Club target stands are removed. Motion ramps gradually after the opening volley; hit testing and rendering use the same authoritative moving positions.
- **30–31:** Consistent capsule search; existing sliding category selection is retained with the shared motion and feedback treatment.
- **32:** Production UI is English. Existing localization dictionaries remain the shared translation path; legacy language overrides cannot switch production UI to Russian. Missing translations use an English fallback and are recorded for auditing. Player names/initials remain unchanged. Static literal coverage and live dictionary-miss checks were strengthened.
- **33:** Logo placement can use the existing masthead brand slot. The replacement asset has not been supplied/identified; the current logo is retained.

## Verification

- Live WebKit controller audit: all 36 catalog games at 320/393 px; Jenga was corrected and rechecked.
- Additional 320×568 and 667×375 audits: Push Pit, Last Center, Kart, Western Duel and Pocket Siege; all controls reachable, no horizontal overflow or clipped button labels.
- TV header tests: all 36 catalog entries, correct ownership for custom HUDs, no gap between shared header and game frame. Four information families also checked at 1280/1920 px, plus pause/reconnect and long names.
- Host dock: 320/390 px, scrolling, compact touch targets, pause/results, selection changes and confirmation. Tested with reduced motion and full animation.
- Live localization audit covered all 36 games (waiting, controller, shell and TV). One remaining Millionaire waiting phrase was added and its game rechecked separately.
- Static translation literal audit covers 189 files, with no uncovered literals. This is a complementary scan, not proof of every possible dynamic text combination.
- iOS simulator build and bundled-product verification passed. No physical device installation was performed.

Artifacts are under `.localparty-build/ui-fix-*`; the shared-header screenshot is `ui-fix-recheck/pocket_siege-tv.png`.

## Practical limits

Haptic feel and AirPlay appearance still need a physical iPhone/TV session. Gameplay difficulty and tower feel need human playtesting; automated tests verify mechanics and stability, not subjective balance. The initial concurrent full test run had one timing-sensitive camera tracking failure; the camera test passed in isolation. Final full-suite status is recorded below.

Final `npm test`: **219 passed, 0 failed**, followed by all six engine suites passing. Held-input recovery audit passed all 11 scenarios/game-control entries, including both new Kart directions. Final simulator rebuild and product verification passed after the last copy/layout changes. `git diff --check` passed.

## Branding follow-up

Working display name is **Hi Pulse**; bundle identifiers and the app icon stay unchanged. The supplied HeyPals wordmark is used as provided. Old mascot references were removed from the web/native mastheads. The phone masthead is now a single row with room count and rankings on the left, a truly centred logo and the profile on the right; Connected is hidden. Both phone filter tracks fill their containers and share the capsule/animated-selection treatment.

The supplied illustration is full bleed with soft vertical fades. The separate `/tv` interface uses the full artwork without vertical cropping, a right-hand fade, a full-width hero row and invitation/roster cards constrained to its 300 px height. Redundant TV hero metadata was removed. The wide phone page is not used as a TV or tablet design reference.

Visuals: `.localparty-build/branding/{native,phone,tv}.png`. Small-controller checks: `.localparty-build/branding-controls/report.json`. Final simulator build and bundled-resource verification passed; installed display name verified as Hi Pulse. No device installation performed.

### Visual correction after user review

Restored the TV catalog to the left column and the original gold headline accent. The decorative image now extends 170–180 px beyond the hero into the following content, with a fading mask rather than a clipped hero boundary. TV artwork has feathered edges; the phone eyebrow is below the gold headline. The catalog and its labels render above the decorative layer. Verified final phone and `/tv` screenshots and rebuilt the simulator successfully.

Latest alignment pass: phone headline group moved down 18 px, Next time moved down, and a corner gradient added behind the heading. Profile geometry is explicit at the right edge. The TV category track is centred against the viewport, the catalog heading is smaller, and its count now reports the full visible catalog (36) instead of just the first arcade section (19). Phone and TV screenshots visually checked.
