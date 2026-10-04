# Segmented insets and catalogue ordinals — 87

Scoped source change: `public/branding.css` only. No JavaScript or gameplay changes.

Actual WebKit phone lobby at320 and393 showed the original top track had5px endpoint gaps but2px vertical gaps. The selection pseudo-element now owns a4px inner inset (5px including border) and preserves the42px button hit target and46px track. Native category rail uses the same paint inset, starts at its content edge, and distributes spare space through tabs rather than outside endpoints. The existing guest three-way switch already had5px equal insets and was preserved.

Measured after first, middle and last selections on both widths:
- Controller top:5px top/bottom, first left5px, last right5px.
- Native host catalogue:5px top/bottom, first left5px, last right5px, including after horizontal scrolling.
- Guest categories:5px top/bottom/endpoints (subpixel error≤.04px).
- TV read-only header labels:5px equal at720;7px physical equal at1080 after stage scaling/raster rounding. TV labels are spans, not an interactive slider; no simulated click claim.

Catalogue art ordinals now use registered HeyPalsDisplay true italic850 on web/native/TV. Computed native and TV faces/styles verified. The web controller's ranked guest cards do not contain decorative ordinal elements; none were invented. Titles, copy, card geometry and colours were preserved.

Evidence: `.localparty-build/segments87-before/report.json`, `.localparty-build/segments87-after/` (18phone/native states plus initial TV metrics), `.localparty-build/segments87-tv-final/` (fully loaded TV screenshots, not startup frames). First/last phone and native screenshots, middle393 states, guest320 endpoint and both fully loaded TV resolutions visually inspected. Native host uses the existing bridge fixture; phone/TV use actual launcher sockets.

Reproduction: `docs/qa/art-direction-v2/capture-segmented-insets.cjs`. It asserts equal vertical/end gaps and loaded catalogue numeral role. `QA_TV_ONLY=1` limits the pass to fully loaded TV.
