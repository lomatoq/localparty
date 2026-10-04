# UI surfaces — build 0.11.6 (91)

## Changes
- Fully opaque Host Panel inner cards; very faint texture only on outer panel.
- Opaque search background, preserving vector search icon.
- Wall visibility reduced at least20% on every shared wall surface: body18→14%, mastheads7.1→5.5%, dark cards5.9→4.3%, outer panel2.7→2%.
- Opaque backing under complete sticky control stack;32pxfade starts outside controls.
- WebKit controller sticky header fixed by avoiding overflow-x:hidden scroll ancestor.
- Hero artwork owns an opaque backdrop; mobile artwork/tools separated.
- Start label and SVG centered together with6pxgap.

## Verification
Local WebKit real server: controller lobby/waiting at320/393px, scrolling500pxwith pinned header assertion, TV lobby720p/1080p; no horizontal overflow or page errors. Native host HTTP fixture: lobby at320/393/1440px, scrolled catalog and Host Panel at320/393px; no horizontal overflow. Screenshots in `.localparty-build/wall91/`. Viewed Host Panel393, host scrolled393, controller scrolled393, TV1080. This does not claim all gameplay states were inspected.

## Delivery
Build91 includes the preceding90 resources and these shared surface fixes. Preserve archive90 as rollback backup. Product/resource verification and physical installation logged in `/tmp/heypals-build91-*`, `/tmp/heypals-install91.log` and `/tmp/heypals-launch91.log`.

Result: xcodebuild succeeded; both product verifiers ok=true, catalog36; shared CSS/JS byte-identical to source; build version91. Archive91 saved, archive90 retained. devicectl installation and launch succeeded on the connected iPhone. Standalone codesign verification reported CSSMERR_TP_NOT_TRUSTED for the local certificate trust chain; device installation accepted the signed product.
