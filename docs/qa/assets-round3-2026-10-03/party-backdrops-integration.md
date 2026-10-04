# Party backgrounds and Western mascot integration

Source-ready frozen at2026-10-03T13:01:22.761Z; actual fresh gameplay approval remains pending root/art-director captures. No browser was started in this lane. No physical-device claim.

Push Pit and Last Circle were generated separately with the built-in image_gen tool. Both requested1920×1080; actual originals are1672×941 RGB, opaque. Workspace copies are byte-identical, without cropping, resizing, recoloring or alpha editing. Exact prompts, original paths, size, mode and SHA256 are in `public/assets/gameplay/round3/2026-10-03/push-shrink-provenance.json`.

Personally opened all four workspace environment originals. Push uses a broad quiet sandstone floor, cyan perimeter architecture and no baked ring. Last Circle uses a dark teal floor, restrained corner crystals and no circle or boundary guide. Director's Knives environment uses plum stone with peripheral training props; Bomb uses a charcoal crate yard. All four omit actors, UI, numbers and floor guides. Texture is environmental material; engine geometry remains overlaid.

The approved game canvas is narrower than the full viewport to leave space for the ranking rail. A new passive full-view `roundEnvironment` element sits before that canvas. Its background uses centered cover, retaining image aspect. The active mode alone decodes its image; lobby, missing or undecoded assets retain the existing fallback. CSS handles viewport changes without re-rasterizing a static image each frame. The arena receiver stays transparent above the environment. Existing playing circle/floor/rim, wheel, actors, obstacles, camera fit, identity labels, state and effects are unchanged.

Western loads Pocket's independent `WesternMascotRig` before host.js and passes the existing x/y/height/color/flip/shotAge/early/fall values. Its returned muzzle feeds the existing shot effects. The prior v2 implementation remains the fallback until the new atlas and metadata are ready. The helper's native-aspect body/arm frames, alpha hull and separate muzzle metadata belong to Pocket's asset provenance. This lane opened the actual atlas but does not substitute asset preview for live joint/shot/fall acceptance.

The helper script uses `../../assets/...` because the launcher rewrites absolute HTML src paths and injects a `/games/{id}/` base. A source-level assertion checks global helper resolution under all five Party modes.

Syntax checks, existing engine action tests and visual-clock tests passed. A focused VM check verifies active-only decode, fallback, correct passive layer, mode change cleanup, lobby cleanup and decoded reuse. Exact eleven checks and nine dependency hashes are in `party-integration-source-ready.json`. This is source and original-asset evidence, not a claim of fresh gameplay approval.

Files owned: new Push/LastCircle images/provenance, Party host.js/host.html and this report. Director owns Knives/Bomb asset provenance; Pocket owns the Western rig assets/helper. No common styles, engine server, controller or gameplay geometry were changed by this lane.
