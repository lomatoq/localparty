# Visual polish after build 122 — review, not a release

Current working tree on `heypals/ux-polish`, 2026-10-04. These changes have not been built or installed on the physical iPhone. Existing Claude changes were retained.

## Latest visual direction

- Keep the game-coloured glow, bevel and soft shading of the main TV cards. Remove the partial travelling reflection and reduce decorative props to the hero area.
- Match Join the Party, Our People and On Top as one family of shaded outer cards, while keeping inner roster rows quieter. On Top uses the existing transparent trophy artwork.
- The final Our People count is **31 px**, down from 46 px. Its green text starts at 50% alpha and fades completely at the bottom. It sits behind and just above the centred foreground heading. Player and ranking rows use **40% alpha dark fills**, with a warm tint reserved for the leader. Text and photographs remain fully opaque.
- Retain the Host Pick green player-count pill; align its number and italic label.
- Small catalogue-card descriptions use regular KardiaFit, tinted from the card's own glow accent at 78% opacity. On Top is centred, with the existing `arrow-up-right.svg` from the icon pack instead of a text arrow; its original white heading colour is preserved.
- Fixed shell headers have a transparent dark tint and two graduated backdrop layers, strongest at the top and absent at the bottom. Foreground controls remain sharp. Active-game headers retain their existing bounds.
- The latest instruction supersedes the earlier opaque numeric wells: backed values now use **50% alpha** flat, game-tinted fills, with fully opaque digits. Outer notch shapes and shading remain intact.
- The final catalogue review found a real Local Tanks display defect: an explicitly untimed survival match advertised `0:00`. Its shared metadata now omits that clock. Timed survival, CTF, co-op and expired timed matches preserve their timer semantics. Only the Tanks screenshot needed replacement.

## Menu verification

`output/playwright/polish123-home/count-refined/`: eight actual launcher captures covering 0, 4 and 12 joined players at 1280×720 and 1920×1080, plus the four-player scrolled state at both sizes. `count-refined-pick/`: two actual Host Pick captures, initial and scrolled, at 1280×720. All ten originals independently opened and reviewed after the count/row correction; no sidebar clipping, horizontal overflow or browser errors. The subsequent description/On Top correction is recorded by the equivalent final matrix in `copy-confirm/` and `copy-confirm-pick/`; these are the menu originals packaged for delivery.

The broad `browse×sidebar` rectangle probe includes the intentionally shared browser container bounds; it is not a visual card overlap. Actual sidebar sections have no intersections. Earlier `count-layer/` originals are superseded. Its transient 1080p catalogue overlap was a capture-settle issue and is absent in this final set.

The harness now waits only for visible image decoding with a bounded deadline, and waits for the unscrolled catalogue transition before its screenshot. It does not alter product behaviour.

Final menu acceptance: all ten `copy-confirm` / `copy-confirm-pick` originals were independently opened after their reports finished. The regular purple/cyan/warm/lime descriptions remain legible below their logos; the centred white On Top/arrow group clears the trophy. The accepted Our People count, translucent rows and avatar badges remain intact. No new clipping or overlap was found. Both capture reports have empty page-error and failed-resource arrays.

## Focused game work

- Bowling: a continuous camera spring, ordered deadwood sweep and rack set-down, and clearer pin scatter. Eight real browser throws across normal/reduced motion were reviewed. Camera movement dropped from a 3.25 m maximum frame step to 0.48 m in the sampled normal run. See `polish123-bowling-motion-review.md`.
- Pocket Siege: team-coloured drone with a coherent body, rotors, supports and lens. Clouds integrate their displacement instead of recalculating it from turn time; slight opposing wind no longer reverses the prevailing flow. Real two-player browser launch/drop checks and ten focused tests passed. See `polish123-pocket-drone-weather.md`.
- Curling: chairs face the rink; spectators clear their own seats while remaining readable from the game camera. Six original views reviewed, with the measured geometry retained in `polish123-curling-seating-review.md`.
- Don't Bite the Gate and Punch Meter: the latest artwork and spacing correction is documented separately under `polish123-gate-punch/`. The user's final cannon direction is a **circular pedestal and rounded swivel housing**; both the first small-cannon pass and the later rectangular pedestal are superseded and must not enter the final gallery.

## Automated and device evidence

The final general suite passed **710/710**, including new Swarm turret anchor/ray tests. Log: `output/playwright/polish123-tests-final.log`. A sandbox-only run was stopped after local-server `listen EPERM`; the complete permitted run above is the test result. The subsequent narrow Tanks clock correction passed **16/16** shared metadata tests, including untimed/timed/expired cases and stale deadline suppression; it did not require repeating the other 33 unaffected game captures. Native shell/tab tests passed 41/41. These counts cover different scopes and must not be added together as one suite.

Chromium renders the graduated header blur. The bundled WebKit fails even a plain, unmasked blur control, so its captures establish geometry but do not validate blur pixels. Physical Safari/WKWebView, AirPlay smoothness and device GPU composition are still unverified. See `shell-header-fade-2026-10-04/review.md`.

The pre-transparency Bowling/Pocket/Curling motion study frames are retained as feature-specific evidence; they must not be labelled as the final shared HUD appearance. Use the subsequent complete half-alpha TV capture set for that appearance.

## Complete current TV gallery

`output/playwright/polish123-hud/half-alpha-final720/`: 36 unique actual game originals. All 36 were individually opened by an independent reviewer; exact image hashes are in `independent-visual-review.json`. Source provenance is per capture lane, not one atomic whole-tree freeze. The original 34-game run completed without page or HTTP errors. Its Tanks frame was replaced after the untimed-clock correction; Swarm and Punch come from their definitive focused captures. The Swarm idle frame precedes only the isolated reward-popup avoidance change, which the final dense 16-player frame verifies. Punch retains a startup WebSocket console warning in its raw evidence; it did not produce a page or HTTP error.

These originals show sampled playing states at 720p. They do not independently establish all lifecycle states, physical motion input or hardware performance. See `polish123-hud-followup.md` and `polish123-gate-punch/user-correction-proof.md` for the exact scope.
