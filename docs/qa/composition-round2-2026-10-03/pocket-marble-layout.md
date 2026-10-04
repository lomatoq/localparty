# Pocket Siege / Marble Bloom — local scene pass

Status: local implementation frozen; fresh real-state image review pending the shared-header and frame pass. Previous accepted pictures are baseline evidence only.

## Spatial thesis

The authored field is the primary surface and spans the entire host viewport. Pocket shot equipment and crew remain compact overlays under the shared header, separated from the live trajectory. Marble crew remains a centered group below the track. The parent header attaches directly to the screen with rounded bottom corners; it does not consume another flow row or shrink the canvas. Existing world transforms stay uniform, preserving circles and input mapping.

| Issue | Before | After implementation |
| --- | --- | --- |
| Top/bottom dark bars | Accepted originals show 12px at 1280 and 18px at 1920, matching parent frame gutter. Local arena already fills the iframe. | Root owns removal of the parent gutter. Explicit local full-viewport main/arena guards prevent incidental engine flow padding, height caps, radii or shadows from recreating bars. |
| Pocket equipment shading | Separate 12px side-edge strips over a diagonal fill; abrupt material changes near edges. | Existing rounded crew and weapon cards use a continuous shaded enamel surface with restrained top light and lower inset shading, retaining violet equipment/lime accents. |
| Marble crew shading | Strong 12px top transition and generic violet POINTS label. | Continuous teal ceramic shading and a teal-tinted readable label, retaining brass rim and existing crew grouping. |
| Header silhouette and hierarchy | Shared sharp notch plus corner decoration; outside local engine. | Shared HUD owner handles screen-attached rounded-bottom rectangle and balanced title/timer/stat spacing. No local duplicate header. |

## Scope and preservation

Only `games/arcade_deluxe/public/style.css` changed in this pass, specifically managed TV Pocket/Marble selectors. `render.js`, `host.js`, physics, weapons, projectile/effects code, authoritative coordinates and controllers are unchanged. Existing shared edits in these files were preserved.

Baseline originals inspected directly: both games TV 1280x720 and 1920x1080; Pocket native phone 402x874. Marble versus keeps its authored per-board header and hidden duplicate crew; the uniform MarbleLayout fit is unchanged.

## Verification

- `node --test tests/marble-layout.test.cjs`: 2/2 passing (six authored tracks, entrance balls/gate petals; versus bounds/header clearance).
- Impeccable detector completed once over the changed stylesheet. Two inherited warnings remain: legacy `.retro-tanks` Arial at line 32 and an existing motion easing at line 171. Neither belongs to this managed TV scoped change; supplied Kardia roles and existing motion are preserved.
- Fresh host screenshots and complete-screen visual approval remain required after the shared layout batch. A source-level full-height guard is not image acceptance.
- No physical-device, AirPlay or alternate-results claim.

## Frozen local source

`games/arcade_deluxe/public/style.css` SHA-256: `8ef401fc84989dd39fc29daca9436f4183983e2bcd29e84e0d32b5ad70203582`.
