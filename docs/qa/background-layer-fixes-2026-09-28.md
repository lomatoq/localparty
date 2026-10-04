# Background layers — final specification, 2026-09-28 / build92

This is the final user-approved placement specification from the annotated screenshots and subsequent corrections. It supersedes conflicting90/91background instructions. Screenshots are validation evidence, not user approval of untested gameplay states.

## Controller
- [x] Header backing starts at top0behind logo/buttons in render order. It remains fully opaque under all categories, then fades48pxbelow them. It does not darken the initial hero title.
- [x] Hero has a100pxtopalpha fade. Bottom image/wall crossfade spans90pxand centres on the START of What shall we play? End is actual title top+45px, measured after font loading and responsive layout.
- [x] Artwork preserves aspect ratio with object-fit:cover; brightness.82. No dark rectangular overlay crossing the image.
- [x] Good friends. Great games. sits ABOVE the main hero title in the dark region, with a small soft text shadow.
- [x] Next time, skip the QR moves down24pxwithout pushing the catalogue. Its shading is a100pxhigh/360pxmaxwidth ellipse with20pxblur and transparent edges. Add a small text shadow.
- [x] Search fill is90%opaque; text and SVG remain100%.

## Host hub
- [x] One measured background behind the full sticky stack: masthead, active game/Host’s Pick, search, categories. Only its bottom fades48pxafter the last attached row.
- [x] Remove competing row pseudo-element backdrops. Actual header/card/tool geometries do not intersect.
- [x] main/catalogue backgrounds are transparent so the quiet14%wall remains visible below cards. The sticky stack texture is much quieter, approximately5.5%.
- [x] Tonight’s Pick becomes a green SVG star in a32pxround badge at top-right. Genre gets a reserved left region; preserve accessible name without visible label text.

## TV
- [x] Gradient starts behind masthead contents and extends16pxbelow this short header. Finish before Host’s Pick; do not darken its text or player-count badge.
- [x] Retain quiet brick background behind catalogue and sidebars. Soft catalogue scroll masks remain.

## Host Panel
- [x] Global logo-header fade extends only12pxbelow its row, finishing before Your party.
- [x] Local panel-header gradient uses panel colour#211c2dand sits behind the header. No detached dark strip below the heading.
- [x] Inner cards stay fully opaque#242036, with no wall noise. Open Host tab at scrollTop0; panel title remains sticky during inner scroll.

## Implementation / repeatability
Shared surfaces: public/background-scene.css. Real native injected styles: public/native-shell/tabs.js. Sticky stack measurements: public/native-shell/host.js. Hero geometry: public/app.js. Recommendation badge: public/icons.js and public/icons.css.

Use the actual native-tabs user-script for QA, not only browser body classes. The script previously introduced opaque main backgrounds and conflicting header layers.

## Verification
- Actual server/WebKit controller320/393px: initial,80pxpartial scroll,500pxfull scroll, waiting; no page errors/horizontal overflow. Pinned header assertion and title-based crossfade endpoint assertion passed.
- Native host static shell+bridge state320/393/1440px: initial,100pxpartial scroll,650pxfull scroll. Header/Host’s Pick/tools geometry and star/genre separation assertions passed. Full native Host Panel initial+500pxinner scroll.
- Actual server TV720p/1080p: initial+500pxcatalogue scroll.
- Fresh captures and paired gallery: .localparty-build/background92/index.html. Root inspected host/controller/Host Panel/TV pairs and final controller readability. No claim of all game states checked.
- Reproducible guards: scripts/check-background-controller-tv.cjs and scripts/check-background-native-host.cjs. Run from repo root; set PARTY_PLAYWRIGHT to installed module if necessary.
- xcodebuild92 succeeded. Both product verifiers ok=true,36catalogue games. Final shared CSS/JS and native-tab scripts byte-identical to actual app product. Archive91 retained, final92archive saved.
