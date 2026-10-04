# Renewed user direction — composition round 2

This records the latest human rejection after reviewing the previous gallery. Previous acceptance is superseded for the new requested scope. Preserve functional/gameplay work and good control structures; fix composition and material rather than reskinning everything arbitrarily.

## Common rules requested explicitly

- Review every released game, all 36. Shared implementation must fix all its consumers.
- Left information block plus leaderboard families (Bomb Tag and similar): center the complete group vertically relative to the frame. Do not center only a title or leave the whole information stack glued to the upper edge.
- Paired information/task/field areas should share sensible top and bottom bounds and a coherent height. Naval sidebar specifically must match the combined board stack height; quiz/Charades/DrawGuess sideboards should align to the real content/field rather than a heading.
- Remove arbitrary decorative dashed/stitch/dotted lines from headers and phone panels across all games. Remove unrelated corner brackets. Functional aiming/grid/trajectory guides are a separate game mechanic and must not be removed blindly.
- Recompose shared headers, not just combine the old notch and old metric card. Equal side negative space, coherent title/time proximity, label/value hierarchy, centered fact groups within the full panel height, safe italic numeric ink and meaningful group spacing.
- Prefer a rectangular panel attached directly to the top edge of the game, with square top corners and rounded bottom corners. Specifically Hockey, Poker, Pocket Siege, Marble Bloom and Carry Ball. Reuse the pleasant rounded Pocket panels wherever appropriate. Eliminate stretched sharp-angle silhouettes; latest preference supersedes earlier Naval trapezoid request.
- Good shading/materials must belong to each game. Western title must not be generic violet; lime remains an approved action/accent color. No arbitrary decorations merely because there is an empty area.
- Eliminate needless top and bottom dark bars. Fill available field height in games with full-field environments; avoid shrinking/changing physics coordinates or circular elements disproportionately.
- Use the existing design skills, specialized agents and independent image reviewers. Absence of overlaps is insufficient to approve placement.

## Specific reviewed defects

| Game | Required correction |
| --- | --- |
| Bomb Tag and other left-rail games | Complete rail/cap/top group vertically centered in frame, correct equal side spacing. |
| One Shot Western | Remove upper dash; material/title color belongs to Western; retain lime accents. |
| Local Tanks | Title and Points currently crowded at right; redistribute contents coherently within panel rather than independent glued parts. |
| Tank Arsenal | Top rounded/bottom abruptly chopped silhouette is incoherent. Use logical attachment or a complete rounded contour. |
| One Cursor Chaos | Remove arbitrary upper corner brackets and excessive title/Time Left separation. |
| Wi-Fi Kart Party | Remove decorative dashes; controller Place/Lap must use shared fonts with readable label/icon scale. |
| Pass the Monster | Remove stitches/dash motif; preserve useful drawing controls. |
| Spy | TV contents can be enlarged around 1.5× while maintaining comfortable room and centered composition. |
| Sinyak: Millionaire | Time Left and Turns groups need vertical centering within the title/status block. |
| Warsaw Discoveries / Sinyak Quiz | Leaderboard (Back for First Place) top/height aligned to real quiz content. |
| Charades | Top/leaderboard height and alignment match right task group; correctly distribute header values. |
| Careful, Jenga! | Find remaining hard backing, remove it. Only clean soft warm gradient; no vertically stretched texture/stain. Phone gray +/- incoherent with gold control group: use readable matching warm styling. |
| Night Shift / Crane | Remove extra dark backing/stacked gradient; retain the attractive blue-green surface alone. |
| Quick Battleships | Sidebar spans and aligns full combined board-grid height; distribute readable information instead of squeezing at the top. |
| Draw & Guess | Same shared-height/field alignment problem; anchor to drawing area, not Drawing heading. |
| Two at Sunset | Remove dashed top; simplify internal division. Draw/duel prompt belongs near center of the actual action field, not very high. |
| Tap Race | Remove dashes/bars, fix bottom-pressed field and upper reserved dead area. |
| Carry Ball / Marble Bloom | Remove unnecessary top/bottom dark cut-off bars; full-height field, screen-attached bottom-rounded header. |
| Pocket Strike / Pocket Siege | Use pleasant rounded panel geometry plus meaningful shading; common header contents need proper hierarchy and spacing. |
| Bowling | Main lane has different/no adjacent-lane gap on one side; make left/right spacing consistent. |
| Mine Together | Phone green backing with near-black controls is unreadable: light green distinguishable controls and clear states. |
| Air Hockey / Poker | Full available field height; top-attached rectangle with rounded bottom corners, game-specific shading. |
| Bow Club | Existing rectangular cap is acceptable in principle, but hierarchy, groups and label spacing need correction. |

## Coordination

Shared HUD owns `public/tv-information.css`, metadata and its tests. Root owns parent `public/tv.js` sizing and capture/gallery assembly. Sports/material owner owns `public/game-ui-themes.css/js` and local five sports games. Local owners own their engines only. At most three browser QA runs concurrently, allocated by root. No ownership overlaps, resetting user edits, gameplay changes, new publication/install/version bump, or stale evidence approval.

Implementation batch → fresh whole-catalog TV720/1080 and real native-bridge phone402 captures → independent image review with named findings → one focused correction/confirmation batch. Preserve comments and all previous original evidence. Report physical-device gaps explicitly.

## Additional human steering during final confirmation

The Naval close-up rejects the purple enclosure behind the crew cards and pale rectangular backplates behind place numbers/awards. Remove both from the shared ranking component across similar game lists. Keep individual cards readable with their authored game material, without changing rank order, dimensions or scrolling. Existing Jenga/Crane unboxed rows remain unboxed. Earlier confirmation images precede this new paint requirement and remain historical evidence.

Poker: remove the incorrect green oval overlay from the authored purple table. Uniformly fit and lower the entire table, including seats/cards, below the actual header; preserve the original table aspect and felt. Add quiet separators between Hand, Pot and Current bet and matching plum shading.

Night Shift: the latest request supersedes the earlier solid blue-green material. Remove the hard sidebar enclosure and extend a new minimalist night-city background across the entire viewport underneath information. Use only a dark navy/teal gradient wash that fades softly into the environment. Separate Floors/Lives/Points and Your block/Crew quietly. Preserve whole four-player rows and a usable sixteen-player scroller. Across games, scrolling content and popup bodies need dynamic soft gradient edge masks, with complete first/last rows at their respective scroll limits; keep fixed headings and actions clear.

Host Panel: remove the inner rectangular purple backing; retain one rounded outer panel, a fixed title/close button and a separate scrolling content body. Horizontal genre chips also need soft continuation masks that clear at the first/last scroll limit.

Night Shift and similar rail/task headers: preserve the now-acceptable structure. Make the game identity more prominent and higher inside its existing identity group. Keep a subtle background-toned highlight/gradient rather than adding an unrelated bright color or enclosure.

Wi-Fi Kart Party: the newest screenshot rejects the hard rectangular sidebar and cropped fourth card. Keep all four cards whole and retain their current arrangement. Extend the quiet road/forest navy-to-teal wash over the entire viewport height, blending into the full-height scenery without a sharp bottom edge. Check other comparable rails for the same hard-backing or cropped-bottom defect during the final whole-catalog review.

## Final TV delivery and final human findings

The latest delivery is TV only: 36 primary frames, one per released game. Alternate 1280×720 originals are available beside the primary 1920×1080 frames; no controller frames in this gallery. Earlier phone and Host evidence remains historical and separate.

Naval: enlarge only the top information background by five percent. The final close-up additionally requires readable captain-card identity/facts, a native-aspect bridge icon and whole rounded lower-board outlines with bottom clearance.

Night Shift: ground the crane/foundation shadows below their feet and begin the cable below the moving trolley hardware. Preserve physics and camera.

Kart: strengthen the full-height navy/teal wash and retain a sixteen-pixel right gutter. The newest close-up rejects the remaining straight seam between the canvas and wash; a wash behind the canvas is insufficient. Paint a single uninterrupted wash above scene painting and below the information. Recheck analogous decorative scene/apron rectangles, specifically Tap Race; retain actual lane boundaries and gameplay guides.

The prior Kart/Naval static acceptance is revoked for these exact details. Final closure must point to replacement originals and source-qualified unchanged catalog frames, with raw prior evidence preserved.
