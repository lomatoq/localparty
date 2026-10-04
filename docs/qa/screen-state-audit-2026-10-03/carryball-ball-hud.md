# Carry Ball: keep the ball out of the HUD

Latest explicit user observation: players correctly cannot enter the top information notch, but the loose ball can roll/fly underneath it and become unreachable. The implementation lives in `games/arcade/simulation.js`; there is no `games/arcade/match.js` in this checkout.

## Authoritative correction

The existing CarryHudReceiver accepts sequenced, finite world-space exclusion rectangles only from the active authenticated TV host. Existing host camera projection and44-unit player envelope are retained. The ball now uses the SAME normalized exclusion rectangles with a13-unit circle, half the existing26-unit authored ball sprite.

When layout changes cover a ball, existing pure `recover()` finds a legal nearest position. Only inward normal velocity reflects; tangential/outgoing motion remains intact. The loose-ball step sweeps against rectangle sides and rounded circle corners BEFORE moving, finds the earliest contact, reflects normal velocity using the existing outer-wall coefficient0.65, and consumes the remaining timestep. This prevents a fast pass from crossing an entire blocked rectangle with a clear final endpoint. A tiny outward contact epsilon avoids repeat zero-time collisions; the bounded eight-contact loop handles multiple exclusions.

The held-ball path also checks visibility, preserving ownership. Player movement, pickup distance, tackle/pass semantics, lock times, scoring/teams, reset position, existing outer-wall coordinates/restitution, damping and other modes are unchanged. Reset/layout updates recover the ball only if the actual HUD covers it. No DOM physics or new position messages were added.

## Fresh verification

Before correction the existing three-test Carry suite passed, including an obsolete assertion that the ball must ignore HUD geometry. That assertion was changed explicitly for the new user request; outside-HUD momentum remains compared against a no-HUD engine.

`node --test tests/carryball-visible-hud.test.js`:10/10 pass. Adjacent raw output is `carryball-ball-hud-tests.txt`.

The tests cover both1280×720/1920×1080 projections, human/bot player visibility, authenticated/finite/sequenced geometry, unchanged movement beside the cap, loose-ball recovery/reflection inside a resized HUD, normal600-unit and fast8000-unit passes, complete tunnelling across an interior box with a clear endpoint, rounded-corner reflection and outgoing escape, held possession/pass, near-edge player pickup, tackle release, HUD resize, both goals, original outer-wall bounce and outside-HUD trajectory equality.

`node --check games/arcade/simulation.js`, Punch motion/platform/sensitivity checks and six arcade metric checks pass. Existing broader arcade-simulation Flappy countdown assertion failed before this correction and remains separately recorded in the Punch report; it is not described as a passed full regression.

## Source freeze and scope

Baseline simulation SHA256 `8a99d754d1147303ea6eb49230a0fa3660d703fc1728ddbd71d8afb6640779b0`; Carry-only freeze `e6c37686f84b08fcc411d5d3fd94fb2aa045a00b16d14f3a4ed7e404f75f63ee`. Focused test SHA256 `521caf9ac70b3f569efceea941e4fb7b80d009d442efc7b09af955f263988313`.

Group06 independently owns Hungry constructor/addFood changes in the same simulation file; this whole-file hash is the Carry freeze snapshot, while the Carry collision methods themselves are frozen. Shared_hud/Group06 own subsequent Flappy/Hungry app.js work; this Carry patch does not edit app.js or disturb the Punch gain correction.

No browser, physical-phone test, build or installation was performed here. These are authoritative geometry/behavior tests, not a new visual approval. Root owns any actual combined-source capture and assembly.
