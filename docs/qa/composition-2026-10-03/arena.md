# Arena composition — 2026-10-03

Status: local implementation and current-source browser/visual review complete. Root-wide independent acceptance and physical-device validation are separate. QA slot 1 has been released.

Scope: Push Pit, Last Circle, Color Knives, Bomb Tag, One Shot Western, Local Tanks, Tank Arsenal. Existing mechanics, inputs, scoring/ties, authoritative world coordinates, assets, public main/native shell/footer/logo remain intact. Shared HUD changes belong to the shared-HUD owner.

## Evidence and diagnosis

Opened every complete TV gameplay PNG for these seven games in `output/playwright/ui-rework-2026-10-02/final-catalog-1734/`. These are incumbent evidence, not approval of current or future composition.

| Game | Observed grouping problem | Primary spatial thesis | Supporting structure |
| --- | --- | --- | --- |
| Local Tanks | Title and team score are centered; timer/alive/points float in a separate top-right slab. | Keep the full uniformly scaled 16:9 battlefield. Make title, team score and real time one centered match anchor. | Alive/points are subordinate elements in that same anchor; no independent side slab. |
| Push Pit | Large circular field, title/time on its rim, split score wings separated from the arena by dark space. | One uniformly scaled circular playfield and one nearby attached scoreboard rail. | Real round/alive/time form one match anchor. The complete ordered roster reads down one axis. |
| Last Circle | Same split wings; arena rim/participants share the old header's vertical zone. | Same circular family, preserving actual shrinking radius and camera behavior. | One ordered roster, knockouts still visible for the authored ghost interval, then fade. |
| Color Knives | Top-left round/alive and top-right title/time disconnect; radial characters compete with remote score wings. | Keep the wheel plus launchers as one uniformly scaled radial world, with one attached ordered roster. | Use the circular family's one match anchor; preserve knife throws, ammo, ring identities and collision-aware names. |
| Bomb Tag | Circle nearly fills height but remote split rails fragment scoring. | Same circular family with one rail close to the field. | Holder icon, heat and passing effects remain on stage; match status stays together. |
| One Shot Western | Attractive full scene, centered title/time, separate top-right match stats; long instruction competes with match status. | Preserve the full scene and uniformly scaled character lineup. One centered match anchor. | DRAW/false-signal state remains the primary event on stage; round/alive belong to match anchor. |
| Tank Arsenal | Uniform world and terrain apron already occupy full height; field and right rail are close. Header/status and roster compete vertically in rail. | Preserve full-height uniform terrain and flush rail. Compact one match-status group at rail head. | Ordered roster starts immediately beneath; event feed remains roster footer outside playable cells. |

## Approved family decision from root and shared-HUD owner

1. Full-world family: Local Tanks and Western, common centered match-status anchor. Tanks includes the actual team score and timer together.
2. Circular family: Push/Shrink/Bomb/Knives, one attached roster rail instead of left/right wings. Shared owner supplies field width, rail width and status reserve. Title/time/round/alive share one curved cap attached to the actual rail top. The centered composition envelope keeps rail close to the circular field rather than placing it at the distant viewport edge.
3. World + rail family: Arsenal retains its existing full-height receiver and uniform 1200×720 world projection. Shared owner supplies rail status reserve without a local parent-CSS exception.

Use a tight 4/8px relationship within metrics, 12/16px between match-status and roster, and 16/24px between the primary playfield and supporting rail. Primary field remains optically dominant. Names remain readable with complete accessible identity and explicit truncation. Longer rosters scroll in their one rail; first/last rows remain reachable.

## Planned verification after family grant

- Real launcher states at TV1280×720 and1920×1080; phones402×874 and320×568 if shared HUD/controller-visible scope changes.
- Source hashes before/after captures; note shared changes during capture instead of combining revisions silently.
- Open each accepted full PNG, recording attachment/proximity, optical balance, field use and HUD clearance separately from geometry checks.
- Check 4 players plus large roster, longest names, actual active action, pause/resume and reload. Preserve scoring/tie semantics.
- No browser start until root grants one of the maximum three QA-process slots. No mechanical-green-only visual acceptance.

## Skills and context

Read AGENTS.md, design contract, regression rules and Impeccable layout guidance. Impeccable context's older rankings-only scope is superseded by the current user's broad composition request; it is not current composition authority. Memory grouping guidance was used for diagnosis; current sources and actual screenshot evidence determine implementation.

## Local build evidence

Changed only `games/party/public/host.css`, `host.js`, `games/tankarena/public/host.html`, `style.css`, and a presentation marker on `games/tanks/public/host.html`. Circular split wings became one ordered rail; original sorting and tie calculation remain in use. Rail consumes an intrinsic shared-cap height, its independent bounding box never moves in response to that height. Scene receiver is near viewport-height width inside a centered scene/rail envelope and uses a bitmap receiver with the same aspect ratio as its CSS box. The world transform remains uniform; authoritative coordinates and camera fitting/knockout behavior are preserved. The CSS fill therefore maps equal-aspect receivers rather than stretching a 16:9 bitmap.

Roster has bounded keyboard/gesture scrolling, explicit complete accessible names, preserved scroll offset during score updates and edge masks only where content continues. Arsenal retains full-height receiver and uniform authored-world projection. Its whole rail is marked for shared cap; the former top margin became an intrinsic cap slot.

Local material mapping was authored with cyan titanium, plum carbon, smoked steel and tactical slate variables. The shared game theme wins parts of the actual cascade: accepted Push/Shrink rows are cyan slate; Bomb/Knives rows are warm smoked metal with colored lower-rank variation; Arsenal rows are subdued tactical metal. Actual rendered material styles accompany the PNGs. Arsenal's experimental terrain raster was removed from the roster after image review found it competed with names. No new art or blur layers. Tanks and Western use the shared HUD owner's centered cap.

Syntax check passed for party host JS. One Impeccable scan recorded existing standalone Inter, old phone bounce, old glow and pre-cascade side-border declarations. This scan does not accept composition. The initially introduced roster texture was rejected and removed during the one named product correction batch.


## Current-source evidence and correction

Accepted originals and adjacent composition/material/geometry records: `output/playwright/composition-2026-10-03/arena-final/report.json`. The aggregate contains 52 opened complete PNGs: 28 normal four-player TV/phone states across all seven games, and 24 actual sixteen-player states in Push/Shrink/Knives/Arsenal (both TV sizes at roster start/end and both phone sizes). Bomb has actual four-player evidence from two browser humans and two built-in controllers; there is no Bomb sixteen-player claim.

Every accepted PNG was opened at its complete original size, including both TV widths and both phone widths. Source SHA-256 start/end fingerprints are recorded per originating run and unchanged within those captures for the watched local and shared source files. Screenshots retain their own SHA-256 and capture time. This does not fingerprint every repository asset.

The first live pass was rejected because a narrow scene receiver still held a 16:9 bitmap: its rectangular bounds clipped circular rims and actors. One named product correction changed the logical bitmap height to match the actual receiver, translated the uniformly scaled world to its true center, retained world/camera fitting, and removed the competing Arsenal roster texture. The confirmation originals show complete circular rims and the radial launcher/ammo envelope at both sizes. A later repeat corrected only the capture helper's roster-end timing after resize; it made no product changes.

The normal confirmation sequence hit a Tanks launcher playing-state timeout. An isolated current-source Tanks retry passed all four captures, Fire, pause/resume and phone reload; its originals replace the missing sequence evidence in the aggregate. The initial unprivileged local-server listen EPERM was an environment failure, followed by an authorized isolated capture. No accepted capture run reported browser page errors.

## Whole-image visual findings

| Family | Accepted original-image findings | Qualification |
| --- | --- | --- |
| Push/Shrink/Bomb | The field dominates a centered scene-and-rail envelope. A single cap aligns exactly to the rail top/width; all title/time/round/alive values are readable. The near rail removes the old remote split wings. Entire circular rim visible, actors and holder/effects stay on their uniformly projected world. | Normal-clock Push/Shrink knockout ghosts and spark effects briefly approach the top boundary; their authored fade/camera behavior is retained. Labels use collision-aware anchors and explicit long-name truncation. |
| Knives | Complete wheel, launchers, held/flying knives and ammo fit at four and sixteen players. The warm metal roster provides one ordered comparison axis beside the world; real penalties/tied places appear. | No injected scoring. Sixteen-player labels are intentionally replaced by local colored ammo/identity marks plus the full roster. |
| Tanks | One centered top cap contains title, primary team 0:0, clock, alive and points. Full battlefield receiver stays uniformly scaled; actors and bases remain visible. | A temporary real joined-player toast appears at the lower-right in these early-launch originals. It is separate from match composition and was not changed locally. |
| Western | One centered match cap balances the full uniformly scaled scene; instruction and DRAW/false signal state remain primary field events. Four actors and their labels fit. | Phone402 captures active Fire; phone320 captures the actual next-round result, rather than a forced active state. |
| Arsenal | Full-height uniform world with terrain apron, close flush rail and stable cap. Roster/health/name cards remain legible while real combat and pickup effects occupy the field. Combat feed is below the roster, outside playable cells. | Existing authored theme controls final row metal. At sixteen players the event feed reserves its own height; scrolling still reaches the final row. |

All sixteen-player roster-end records have actual 16 DOM rows and `scrollHeight - clientHeight - scrollTop = 0` at each TV size. Start images show the first player, end images show the last player; continuation masks appear only at the appropriate edge. Full accessible names remain on the DOM rows.

All phone originals retain stats above controls and clear shared footer actions at402×874 and320×568. Push/Shrink normal and max screenshots show genuine OUT states; this lane does not claim their active joystick action was exercised during confirmation. Arsenal max screenshots show respawn with appropriately disabled controls. Bomb and Arsenal normal runs exercised actual joystick hold/move/release; Knives/Tanks/Arsenal exercised actual action clicks. All normal game captures exercised shared pause/resume and outer phone reload. Western's action privacy/timing flow and untouched engines are not newly certified by these layout captures.

Automated evidence: party host JavaScript syntax passed. The root `check-composition-evidence.cjs` checker passed the final seven-game aggregate with seven distinct rendered cap paints, no attachment/bounds/title/value findings. This is separate from the whole-image review above; no physics/tie algorithm or phone input implementation was changed. No physical-device validation was performed in this lane.


## Named independent-review correction — Arsenal phone controls

The independent review of `final-catalog/tankarena-phone-live-402.png` correctly found Move/Aim below the joystick and a high control row leaving roughly 250px before the footer. The bounded correction changes only `games/tankarena/public/style.css`, scoped to managed Tank Arsenal player portrait phones at 600px and below. Main consumes the actual iframe height; stats stay first, the existing control row uses the lower available region, and the existing Move/Aim hint sits 12px above the joystick. Existing joystick/Fire dimensions and all input JavaScript are preserved.

Current evidence superseding the aggregate's earlier Arsenal phone images: `output/playwright/composition-2026-10-03/arsenal-phone-correction/report.json`. Native controller bridge and persistent tabs are initialized in WebKit as in the existing native browser harness; these are actual normal-clock launcher/controller states, not physical-device evidence. Both phone 402×874 and 320×568 originals, plus both TV originals, were opened completely. Phone 402 joystick measures 180.89×180.89px, phone 320 measures 144×144px, matching prior dimensions. The hint is visibly above interaction; stats and shared footer remain clear. The 320 control row ends with safe clearance before the footer rather than pushing it off screen.

At each phone size actual pointer joystick hold/move/release and Fire press/release sent real input packets. Recorded nonzero movement returns to{x:0,y:0,fire:false}; Fire true returns to Fire false and knob transform resets to its centered value. Shared pause/resume and outer phone reload passed. No page errors or watched source hash changes during captures. TV composition checker remains passed. QA slot 2 was released to root and sports_controls; product sources are frozen after this exact correction.
