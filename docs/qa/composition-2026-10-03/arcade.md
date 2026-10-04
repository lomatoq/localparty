# Arcade, Chaos and Kart composition — 2026-10-03

Status: all eight games accepted at TV 1280×720 / 1920×1080 and native-route phone 402×874 / 320×568. Product source frozen; QA slot 3 released.

Read AGENTS.md, UI regression rules, design contract and Impeccable layout guidance. Opened all eight original actual TV captures in `output/playwright/ui-rework-2026-10-02/final-catalog-1734/*-tv-live-1920.png`; these are baseline observations, not acceptance of new work.

| Game | Spatial thesis and bounds | Noticeable, quiet material |
|---|---|---|
| Tap Race | Timing/title and live stats share one top origin. Runner lanes lead; lane name bubbles stay beside their runners. Existing player scores occupy a reserved compact timing fascia below track rather than an unrelated cramped stripe. Delete eight hovering light slabs; retain track perimeter lamps. Preserve responsive lane positions, runner proportions and authoritative progress. | Trackside timing fascia: violet enamel, narrow checker edge and sparse route ticks. |
| Punch Meter | The bag and its swing lead the center. Title, attempt, timer, leader and current actor share one centered overhead gym placard. Preserve uniform 1200×720 world and swing; scoreboard feedback retains room below. | Smoked plum vinyl with a restrained stitch line at the outer edge; leather/red accent ties to the bag. |
| Multiplayer Flappy | Sky continues behind the edge-attached HUD. Birds, gaps and attached labels lead. Titles/stats use one flight-desk origin; clamp player labels away from measured HUD exclusion rectangles without moving birds or pipes. | Frosted lavender flight-desk surface, tiny feather/pipe-rim silhouette on outer edge, supplied sky art preserved. |
| Hungry Arena | Uniform 1200×720 arena fits below actual measured HUD bottom so top-edge mouths and labels cannot hide. Food-court floor remains the main field, labels near bodies. | Plum snack-bar docket, an embossed cutlery line confined to panel edge; no extra food obstacles. |
| Snake Lines | Uniform arena and collision boundaries remain fully visible below measured semantic HUD. Trails lead, names remain attached to heads. Same title/stat origin with consistent clear action-space edges. | Cyan/violet circuit-console fascia with etched terminal/corner ticks. |
| Carry Ball | Team score shares the title/stat top dock; uniform field and goals remain complete. Player labels avoid actual HUD rectangles; ball and possession remain unaltered. | Graphite stadium scoreboard, restrained turf/chalk edge motif and meaningful team accents. |
| One Cursor Chaos | Mission and real progress become one compact lab-console row adjoining HUD, rather than a disconnected bottom caption. Uniform 1000×600 world fits below combined actual bounds. Targets, cursor, hazards and inputs are unchanged. | Laboratory instrument casing, sparse circuit traces on outer surface and quiet calibration ticks outside targets. |
| Wi-Fi Kart Party | Right player table occupies a real grid column; left canvas fits uniform 1600×900 world within its own cell. The title/time/race cap occupies the same right rail, attached at its actual top edge. Name, lap and speed stay grouped in each driver row; max roster remains reachable. | Asphalt/plum pit-board sidebar with narrow checkered edge, subtly machined dividers, no decorative obstacles. |

Approved synthesis: Kart uses measured rail-cap; all other seven use one unified centered-scoreboard. Parent HUD owns the opaque title/time/metric contour. Child CSS does not duplicate parent panels.

Applied changes: arcade canvas anchor, real Tap Race timing row with 12px field separation and trackside material, removal of eight hovering light slabs, precise `PARTY_HUD_EXCLUSIONS` avoidance for name labels only, six distinct controller instrument readouts. Kart marks the full side rail, uses true non-overlapping grid cells and reserves measured `--party-hud-height + 16px` inside a stable rail top; its canvas draw loop keeps the 1600×900 uniform world. Chaos anchors the viewport, moves mission/progress into one material instrument below actual HUD bottom and uniformly fits the unchanged 1000×600 world beneath this semantic content. Descriptive mission text is visible again.

Changed local files: `games/arcade/public/host.html`, `games/arcade/public/app.js`, `games/arcade/public/style.css`, `games/kart/static/host.html`, `games/kart/static/styles.css`, `games/chaos/static/host.html`. Existing dirty user work was retained; no shared source files edited.

Pre-browser checks: arcade packet contract and both Kart road-barrier assertions passed (3 tests); arcade/Kart scripts and all Chaos inline scripts passed syntax checks. Initial Kart lap test was blocked by sandbox `listen EPERM`; permitted loopback rerun passed with a real 31.26s lap and zero off-road frames. Four focused tests passed in total. Impeccable mechanical layout scan returned no findings before edits; final general scan reports inherited inactive small labels/glows and an advisory for the authored track/stitch/circuit motifs. Final rendered checks must distinguish actually visible surfaces from inherited cascade declarations.

Fresh verification: baseline round `output/playwright/composition-2026-10-03/arcade-round1/report.json` captured all eight games, with all 32 core originals opened. One bounded product correction followed: Punch Meter's turn spring/sheen now belongs to its rounded instrument card rather than the open `.arcade-readout` wrapper. Earned elimination particles and outer-card score feedback remain intact.

Final accepted evidence comes from `arcade-confirm2/report.json` for Chaos, Kart, Tap Race, Hungry, Snake Lines and Carry Ball, plus `arcade-fixture-confirm3/report.json` for Punch Meter and active Flappy. Both reports have zero browser page errors and an empty `changedFiles` array. All 32 final core originals and all eight Kart input held/released originals were opened individually. All measured 320px controls remained inside the viewport; all host and 402px child surfaces had no body overflow.

| Game | Opened final core proof directory | Visual acceptance |
|---|---|---|
| One Cursor Chaos | `arcade-confirm2` | Shared cap and adjoining task/progress instrument clear; description restored; complete uniformly fitted cursor/target field. Both phone sizes retain readable task and complete joystick/actions. |
| Wi-Fi Kart Party | `arcade-confirm2` | Actual grid cells: 980px field + 300px rail at 1280; 1500px field + 420px rail at 1920. Rail starts at 0 with actual cap bounds ~152/228px; standings begin after cap +16px. Entire course and names visible, no field/rail overlap. Four actual steering/throttle held/released states opened on phone and TV; pressed styling releases. |
| Tap Race | `arcade-confirm2` | Four complete runner lanes, attached names and separated timing fascia; eight hovering slabs removed. All four timing cards readable; field-to-fascia gap intentional. Phone readout and track strip fit above action. |
| Punch Meter | `arcade-fixture-confirm3` | Centered title/attempt/time/current actor cap; full bag and gym scene visible. Phone stats are one rounded stitched instrument; no rectangular sheen across title/help. Motion permission and hold/release controls remain visible. |
| Multiplayer Flappy | `arcade-fixture-confirm3` | Sky continues under attached cap; active birds, readable attached labels and complete gaps visible. Both phones show Flying and enabled FLAP. Seven actual touchscreen flaps, no state/score injection; final read-only engine proof alive=true, time=2.97s, earned score=30. |
| Hungry Arena | `arcade-confirm2` | Whole mouth/food court fits below measured cap; top bodies and labels clear; real scene retains uniform scale. Phone status/stat/joystick grouping fits both sizes. |
| Snake Lines | `arcade-confirm2` | Complete collision field and readable trail/head labels; uniform world preserved. Elimination phone state remains clear at both sizes; transient earned elimination particles retained. |
| Carry Ball | `arcade-confirm2` | Both goals, complete pitch and crowded possession labels readable. Two real browser controllers plus built-in bots; actual team score stays authoritative. Both phones retain team/readout/joystick/pass grouping. |

For each core row the opened filenames are `<game>-tv-live-1280.png`, `<game>-tv-live-1920.png`, `<game>-phone-live-402.png`, and `<game>-phone-gameplay-320.png`, under `output/playwright/composition-2026-10-03/<directory>/`. Kart action proofs are `kart-{phone,tv}-{steer,throttle}-{held,released}.png` in `arcade-confirm2`. `compositionProofs` records measured HUD exclusions, rail/task boxes and overflow.

Preserved fixture failures: in `arcade-confirm2`, Punch Meter never started because all three test bots stayed gameReady=false; its waiting image is not accepted gameplay. Flappy stayed alive in TV and 320px screenshots but died naturally before 402px capture (final alive=false at 5.33s), so that run's final active-flight assertion failed. A fresh room and timing-safe direct touchscreen taps resolved both coverage gaps in `arcade-fixture-confirm3`, without further product changes or altered game state.

Native-route evidence uses the existing controller bridge and persistent tabs with simulated Swift readiness in WebKit. It verifies browser routing and layout, not a physical iPhone, motion sensor, haptic hardware or native packaging. No physical-device evidence is claimed.


## User rejection revision — pending fresh validation

The earlier acceptance above belongs to its captured source and is superseded by the user's new composition direction. Local files are revised; no new visual pass is claimed yet. Shared header remains screen-top attached with a rounded bottom; local data groups no longer introduce dash trims.

| Before | After | Why |
|---|---|---|
| Tap track starts at world126 with only24px below; independent outer light/dash bars. | Same570px lane region centered at75/75, outer bars removed; actual header clearance and close timing row. | Center the actual racing content without changing runner/track proportions. |
| Uniform arcade worlds can extend beneath the header; Hungry's remaining-height centering omits half of its top reserve. | Punch/Flappy/Hungry/Snake center uniformly below actual headerbottom+16; camera uses the midpoint of the remaining region. Carry Ball retains full-frame uniform fit behind the cap with measured exclusions for names only. | Keep active world objects visible and center the available field; preserve the explicitly requested full-height Carry Ball field. |
| Kart field+rail stretches to viewport height; cap/standings begin at top. | Stable centered whole track frame, height based only on viewport/track ratio; short rail is intrinsic cap+rows and centered as a complete group. Long rosters scroll inside the bounded frame. Cap follows actual rail bounds, measured height reserves its internal slot. | Center the entire composition without a header measurement feedback loop. |
| Kart Place/Lap labels inherit small bold sans and20px glyph limits. | Kardia Fit15–18px labels and actual existing24px stat glyph pseudos. | Clear hierarchy and readable artwork while preserving values and controls. |
| Chaos mission repeats shared calibration title in a tall decorated panel pinned above its arena. | Compact instruction/progress row, no duplicate title or dash trim, centered together with the unchanged uniform1000×600 world. | Keep the task and actual field together; do not reposition targets to disguise intrinsic gameplay space. |
| Arcade instrument readouts have decorative perimeter dashes. | Existing semantic body/rim and game-object artwork carry identity. | Remove arbitrary decoration while preserving readable stats and earned feedback. |

Syntax checks passed for arcade and all Chaos inline scripts. Fresh real TV1280/1920 and native-route phone402/320 evidence remains pending shared-source freeze and a root-granted browser slot. No gameplay rules, controller packets, held/released input logic, motion permission, native footer or game-object proportions were changed.
