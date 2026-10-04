# Arena group — renewed composition

Status: complete local implementation batch; fresh browser and independent image acceptance pending shared source freeze and root QA slot. Previous gallery acceptance does not accept this revision.

Read the exact renewed user brief in this directory, Impeccable layout/craft floor, and Emil design engineering guidance. Scope: Push, Shrink, Knives, Bomb, Western, Local Tanks, Tank Arsenal, and newly exclusively assigned Two at Sunset. Pocket Siege, CarryBall and MarbleBloom belong to their prior owners. Shared parent header/metadata/theme changes remain with their owners.

| Before | After | Why |
| --- | --- | --- |
| Short circular cap/rosters attached near frame top despite their large fullheight marker | Intrinsic cap + 12px + ordered roster group centered at frame midpoint; maximum height bounded | Centers the meaningful group, rather than an empty fullheight envelope. Full party still scrolls. |
| Arsenal receiver retains local 12px top/bottom padding; rail backdrop ends without a single contour | Fullheight receiver, centered intrinsic panel, quiet continuous gunmetal silhouette with 16px rounded bottom | Field uses available height and related cap/roster share one coherent material/contour. |
| Two at Sunset cue hard-pinned 24px near stage top | Cue centered at actual stage midpoint | Places the reaction task near the duel action. Actor proportions and input timing remain intact. |
| Two at Sunset fullheight sidebar and extra queue separator | Centered intrinsic cap/queue/standings rail, bounded independently of field height; extra dividing rule removed | Tournament information reads as one compact unit. Dense rosters remain reachable. |
| Two at Sunset host draws cinematic black strips during focus | Host scene retains its full height through focus; phone behavior retained | Removes decorative field cutoffs without changing the duel mechanics. |

Circular rail marker describes its entire actual cap+roster group. Intrinsic padding uses only the published cap height. Parent cap anchors to that stable marker's x, width and top; no reciprocal top offset or global field inset is introduced. Short group dimensions follow real roster content; dense content is capped by frame height and scrolls within the board. Arsenal and Two at Sunset use the same stable width/height-only reservation protocol.

Local Tanks already has a bitmap matching its full receiver and uniformly fits the unchanged 1280×720 world, extending nonplayable wall/terrain when necessary. Western already fills its authored fullheight scene receiver. Their remaining previous-gallery frame gutters originate in the parent, assigned to root. No camera, engine, input proportions or controller JavaScript is changed by this local batch. Arsenal's earlier named phone correction remains intact.

Files edited in this batch: `games/party/public/host.css`, `games/tankarena/public/style.css`, `games/western_duel/public/style.css`, `games/western_duel/public/app.js`. All pre-existing user edits were retained. Decorative dashed cap trim and Western title color are shared header/theme ownership.

Mechanical scan: Impeccable layout detector returned no findings. Duel presentation JavaScript syntax passed. This is source validation, not visual approval. Fresh normal-clock eight-game TV720/1080 and native-bridge phone402/320 captures, plus relevant actual maximum rosters and opened originals, await the assigned browser slot. Physical hardware remains unverified.

## Named first-review phone correction

The independent mechanical review identified a roughly 250 CSS pixel separation between Arsenal's stats and Move/Aim. Directly opened the current full original `catalog/tankarena-phone-live-402.png` and confirmed the detached grouping. The bounded correction edits only `games/tankarena/public/style.css` in the portrait phone rules.

| Before | After | Why |
| --- | --- | --- |
| Stats at the top; flex-growing controls and up to 220px internal top padding leave context far above the action | One intrinsic stats/instruction/control group aligns toward the lower receiver; a 56px reserve places Move/Aim above the joystick, with extra height outside the group | Keeps lower thumb placement while attaching game context to its controls. Existing joystick/Fire dimensions and input coordinates are untouched. |

Product source frozen at SHA256 `410fe8c1df8e819c83562fb26856fe130c57b3bd193411c185420aa9ce37d9e6`. Static brace/scope assertions passed. No browser was launched for this correction by parent instruction. Fresh native-bridge 402/320 screenshots and independent actual grouping acceptance are pending root's final catalog capture; source reasoning is not visual approval. Native footer sources and all other games remain untouched by this correction.

Focused final confirmation completed in `output/playwright/composition-round2-2026-10-03/arena-phone-confirm`: real normal-clock engine, two real browser humans plus two bots, native controller bridge and persistent tabs, actual pointer move/release + Fire press/release at 402×874 and 320×568. Both whole originals opened. Stats→Move/Aim gap is 26.16px at both sizes (stats→joystick 56px); joystick remains 180.89px / 144px square, Fire 156.77px / 124.80px. All controls/labels stay inside the receiver, document matches receiver width/height, and both images retain footer clearance. Actual movement and Fire packets clear on release; knob neutral, pause/resume/reload succeeds, browser errors and source changes empty. Named local grouping finding resolved visually in this focused evidence; independent final review still belongs root. Browser/server closed and QA slot 3 released.

## Fullheight Arsenal atmosphere — local source delta

New human rail feedback and director review reject the extra hard outer Arsenal card. Opened both current `final-catalog-fullwash-1052/tankarena-tv-live-{1280,1920}.png` originals and read the Impeccable craft floor.

| Before | After | Why |
| --- | --- | --- |
| Rounded slate enclosure surrounds cap, IN THE ARENA and all individual standings cards | Transparent borderless enclosing rail; quiet game-blue/gunmetal wash spans the full receiver height and fades inward | Removes the redundant outer-card silhouette while retaining individual readable player cards and the existing field/card geometry. |

Only product delta: `games/tankarena/public/style.css` SHA256 `37d324fd5be34e7a101c931e762b9945aec810afc3aad6ec626db06a073f5c28`. Desktop host rules only: enclosing rail background/radius removed, existing zero border/shadow retained, scene-level pointer-inert fullheight gradient added. Individual card styling, host world/inputs, marker geometry and the confirmed phone arrangement are unchanged. Frozen promptly while root final capture was already past this game; the existing all36 gallery therefore does not visually accept this local delta. Focused fresh 1280/1920 confirmation is pending root capture completion and browser-slot grant.

## Two at Sunset matching exterior correction and combined confirmation

The same newly rejected outer rail also surrounded the Duel queue and four standings cards. Only `games/western_duel/public/style.css` changed: common outer fill/rim/radius/shadow removed, while a fullheight warm sunset wash fades inward. The former one-pixel border becomes one extra inset pixel, preserving individual card width/placement. No queue, player-card, world, engine, header or phone styling changed. Frozen Duel hash `0c438a836013a1478a5e89dcc2506afb785800a1dcc1e1d405e8776197781cbc`; Arsenal remains `37d324fd5be34e7a101c931e762b9945aec810afc3aad6ec626db06a073f5c28`.

| Before | After | Why |
| --- | --- | --- |
| Duel queue and four cards enclosed by another rounded warm panel | Separate queue and player cards retain geometry over a fullheight warm atmosphere, with no common enclosing rim | Applies the human's analogous-rail feedback without rebuilding game content or input. |

Canonical fresh combined evidence: `output/playwright/composition-round2-2026-10-03/arena-duel-curling-fullheight-final/report.json`, finished 2026-10-03T10:55:39Z; all 595 guarded sources stable (`changedFiles:[]`), browser errors empty, three successful rows with three compositionScreens each. All nine actual 1280/1920 TV and native-bridge phone402 originals directly opened. Arsenal and Duel common outer rail backgrounds are transparent, borders zero and radius zero; individual four-player cards remain legible, groups centered, and world receivers fullheight. Native phone composition retained. Normal-clock Duel TV phase transitions (reveal/countdown) are explicit in raw metadata and not claimed as settled final results.

Root requested Curling in this combined capture to replace its prior failed readiness fixture. No Curling source edited: second actual browser controller joined, loaded and ready; live roster contains two browser humans plus three built-in bots. Actual engine reached playing; phone correctly shows spectator Alexandra while Morgan throws. All raw reports, source revisions and screenshot hashes remain intact, and separate verification.json records opened originals. Browser/server closed and slot2 released. Root will compose final all36 provenance using these qualified replacements while retaining the older raw drift/failure evidence. Physical devices remain unverified.
