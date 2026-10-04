# Tabletop — latest full-height brief

Status: local implementation frozen; integrated screenshot acceptance pending shared/root header changes and a QA slot. Earlier screenshot acceptance is superseded.

Owned IDs: naval, poker, airhockey, mines. Exact presentation files: `games/naval/public/screen.css`, `games/tabletop/public/arena.css`, `games/tabletop/public/app.js`. Shared parent/header/bridge source belongs to root/shared HUD.

| Before | After | Why |
| --- | --- | --- |
| Naval short rail centered beside a taller formation | Rail height100% matches complete board stack; captain rows72px minimum with12px gaps; drawer owns remaining space and complete two-event feed stays bottom | Related content shares vertical bounds and has reading room without stretched type or images |
| Poker/Hockey field inset repeats the shared header reserve | Actual felt/rink top0 with local padding0 and active field marker | Shared screen-attached rectangular header owns its measured exclusion area |
| Hockey playfield shrinks for readouts | Full iframe-height rink with unchanged5:3 content mapping; last-touch labels in lower corners, included in name exclusions | Field remains primary and supporting names stay readable |
| Disabled Mines action fades green fill and ink together | Solid light lime with dark ink for enabled and disabled feedback | Declared contrast13.23:1 enabled,7.71:1 disabled; runtime styles still require visual confirmation |

Naval public oceans, dense B1–B15 identities, health/name grouping and standard44px phone cells retained. Poker art, seats, cards and rules retained. Hockey canvas world, physics, controls and actual-contact semantics retained. Mines actions, cooldown and drawn direction icons retained; no placeholder dashes added.

Impeccable layout/craft-floor and Emil guidance read. JS syntax and owned diff-whitespace checks pass. Existing Hockey last-hitter contact regression2/2 passes. Impeccable layout scan returns no findings.

Required fresh evidence after shared freeze: Naval1280/1920 rail/stack top-bottom alignment plus dense crew geometry; Poker/Hockey1280/1920 actual fieldtop0/full-height and measured header exclusions; Mines402/320 enabled/cooldown/already-open action paint. Open originals individually. DOM scroll evidence remains supplemental because the managed TV intercepts pointer input. Physical-device validation is separate.

## One named correction batch after first catalog review

Root accepted Naval full-height alignment and Mines contrast; neither changed again. Two named issues were corrected in tabletop presentation only:

| Before | After | Why |
| --- | --- | --- |
| Poker top-seat badge intersects the actual shared header at both TV sizes | A measured header intersection adds only enough seat-group clearance for8px separation; attached hand/chips move with the seat | Actual identity and cards stay clear without shrinking or shifting uniform table art |
| Hockey last-touch cards contain two decorative28×3px bars and empty tracks | Bar pseudo-elements removed at source; captions/names occupy a single text track | Removes decoration while preserving actual-touch meaning and team alignment |

Poker authored base positions, card values, field bounds and rules are unchanged. The correction uses `PARTY_HUD_EXCLUSIONS` in iframe CSS coordinates and updates after actual felt resize, viewport resize, fonts and shared geometry events. It affects only top seats that actually intersect the measured header. Examples from rejected first-review geometry require about26px clearance at1280 and20px at1920; fresh root images must confirm exact final bounds.

Exact changed files: `games/tabletop/public/app.js`, `games/tabletop/public/arena.css`. JS syntax and diff-whitespace checks pass. Source frozen; no browser launched. Fresh second root all36 capture remains the acceptance evidence.

## Explicit Poker purple-table correction

The user rejected the green oval over the supplied purple table and the seat-only header avoidance. This supersedes the earlier Poker layout/paint direction.

The actual `.felt::before` green texture/oval source was inspected and disabled entirely. The original `public/assets/gameplay/tabletop/poker-table.webp` was opened: its cloth, cushion and rim are purple/lime/metal. The current root `final-catalog-093806/poker-tv-live-1280.png` was opened and confirms the mismatched green oval.

The complete table/seats/cards now use one unchanged16:9 frame fitted below actual `--party-hud-bottom` plus12px separation, with16px bottom margin. The receiver environment remains fullheight in deepviolet. The previous Poker seat-only clearance helper/transform was removed completely; authored relative seat and hand anchors remain intact. Hockey, Naval and Mines work was preserved.

Shared HUD owner separately froze a gently rounded, shaded plum Poker panel with ivory ink/lime primary and quiet1px vertical metric separators inside existing gaps. No dashed lines or shape changes to local table art.

Local exact files remain tabletop `app.js` and `arena.css`. Syntax/diff checks pass; Impeccable layout scan returns no findings. Source frozen; fresh1280/1920 TV and native-frame proof is pending. Earlier green-table screenshots remain rejected.

## Mines outer-surface removal

Opened both actual `final-catalog-fullwash-1052/mines-tv-live-1280.png` and `mines-tv-live-1920.png` originals. Also opened the latest explicit Poker user reference `codex-clipboard-2f8ddb4b-8b0a-4b4c-b671-db3b8e32b5ae.png`; Poker source remains frozen at the correction above.

| Before | After | Why |
| --- | --- | --- |
| A hard rounded slate base encloses the Mines cap, instructions and all four ranking cards | Transparent rail with no visible rim, corner shape, shadow or backdrop; a quiet green-slate wash spans the receiver height and fades into the scene | Removes the extra enclosing box while retaining each meaningful card and the existing field composition |

Only Mines host selectors in `games/tabletop/public/arena.css` changed. A transparent border retains the exact existing box dimensions; rail padding, measured cap slot, individual cards, instructions, board, controls and proportions are unchanged. No JS or Poker/Hockey/Naval presentation changes. Owned diff-whitespace check passes. No browser launched; root's fresh canonical focused capture supplies final visual acceptance.

Frozen SHA256: `app.js` = `3e4f98c31971d27374eaa4e40373063ac74dba4a587ddd8edfe016a91f67b545`; `arena.css` = `26fc66ff3e9822f05b911499908633aa302d692a976b3a5c5ab999ce922bede6`.

## Naval crew, ship aspect and lower-board rim correction

The latest user Naval720 feedback prompted one bounded correction in Naval `screen.css`; all tabletop source remained unchanged. Impeccable typography/layout and Emil guidance informed the grouping.

| Before | After | Why |
| --- | --- | --- |
| Rank, avatar, name and two fact lines compete in one narrow row | A protected rank track and score track span two rows; avatar/name share the first row and facts span their combined width below | Identity, position, fleet facts and points have distinct reading positions |
| Native177×480 ship sprite is forced into a38×38 heading background | Native-aspect32px-high paint in a36px heading | Entire ship remains visible without squashing or cropping |
| Ocean square sizing excludes padding and border, reaching the card's rounded clip | Border-box square with six bounded cell rows | Full lower rim and sixth cell row fit within the existing16px stage margin |

Real normal-clock launcher/engine TV-only capture: `output/playwright/composition-round2-2026-10-03/naval-row-rim-1250/`. Both `naval-tv-live-1280.png` and `naval-tv-live-1920.png` originals were individually opened. All four crew cards, native-aspect ship, complete lower rounded ocean rims and16px bottom clearance confirmed. Actual1920 state includes250points,4health, hit/sunk facts and changing ranks. No injected scores/state; no physical-device claim.

No browser errors. Naval source hashes agree at capture start/end. The report notes concurrent `games/arcade/public/app.js` drift outside Naval dependencies; this is a qualified Naval proof, not a whole-catalog source freeze. Owned whitespace checks and Impeccable layout scan pass. Browser slot released.

Frozen SHA256: Naval `screen.css` = `41871b994b1e01eee0defaefc64ef687567142c1b40512d31c6fdfc456411064`; unchanged `broadcast.js` = `4d252de1469e4b6c7c84941d293044a7cdbffbe799f5fa7387385ee31269cad3`.

## Latest Hockey whole-field fit and Poker environment pass

Naval was explicitly accepted and remains frozen. Mines remains unchanged. Opened actual Hockey `review-tv36-edges/captures/airhockey-tv-live-1280.png` and1920 originals plus authored `hockey-field.webp` before the bounded correction.

| Before | After | Why |
| --- | --- | --- |
| Fullheight rink extends behind the cap; rounded9px canvas rim clips authored corners and unequal inner dimensions slightly stretch its bitmap | Whole5:3 rink fits below measured HUD bottom+12px with16px sides/bottom; extra rim/radius/backing removed | Preserves authored edges and one uniform coordinate transform |
| Every painted frame adds a dark1000×600 rectangle beneath the supplied art | Clear canvas then paint authored art; dark fill is retained only as missing-art fallback | Removes extra backing from the loaded field without changing objects or mechanics |

Exact product scope: Hockey selectors in tabletop `arena.css` and the Hockey canvas clear/fallback paint in `app.js`. Physics,1000×600 world, joystick input, player/puck positions, names, last-touch semantics and other games are unchanged. Syntax, scoped whitespace, Impeccable scan pass; existing actual-contact tests2/2 pass. No fresh browser proof yet; shared cap/logo freeze and root QA grant are required. Poker accepted table fit/art is unchanged, with backdrop integration awaiting root asset.

Existing tabletop capture helper gained an opt-in `QA_HOCKEY_FIT=1` verification: actual joystick hold/release, authoritative direction, equal X/Y scale, whole field safe bounds, measured cap separation, name/readout avoidance and striker world bounds. `QA_TV_ONLY=1` limits screenshots to the requested TV surfaces. This is a prepared check, not executed evidence.

Root supplied `public/assets/gameplay/round3/2026-10-03/poker-lounge-v1.png` (1672×941 opaqueRGB). The original was opened and integrated only as the Poker fullheight receiver's centered cover background. Supplied plum floor, lamps and lounge seating stay behind the original purple table/rim/cards/player groups; no new cloth/oval or darkening overlay. Accepted table geometry remains exact. Product frozen pending root GO for combined proof: `arena.css` SHA256 `70b5ef41330595c10d6829ac5f3a7469bf1eda659bd0e67a4fa378594bd3b4fa`; `app.js` SHA256 `1b45bd2ee4c7b34484f0a6f5ab573676d9fd353cf3d6512bc99190511c3850b7`.

### Granted local combined proof

Root granted SLOT2. Real normal-clock launcher/engine/built-in bots, actual controller pointer hold/release; screenshots restricted to TV. All four originals in `output/playwright/composition-round2-2026-10-03/tabletop-floor-rink-1444/` were individually opened:

| Original | Observation |
| --- | --- |
| `poker-playing-1280.png` | Lounge floor visible around intact purple table, all four seat/card groups whole, cap clear of top seat/cushion |
| `poker-playing-1920.png` | Environment covers entire viewport; uniform original table/rim intact, player and actual pot/hand/current-bet ink visible |
| `airhockey-playing-1280.png` | Complete supplied field corners/sides/bottom, no extra dark backing/rim; actual rink964.02×578.41 at125.58px below113.59px cap bottom, with16.02px bottom clearance |
| `airhockey-playing-1920.png` | Complete field and last-touch readout; actual rink1469.34×881.59 at182.38px below170.39px cap bottom, with16.03px bottom clearance |

Meaningful checks pass: equal X/Y world-to-screen scale (about0.9640 at720 and1.4693 at1080),12px measured cap gap, whole safe viewport bounds, transparent canvas CSS backing/border0, name/HUD/readout intersections0, authoritative striker coordinates within the existing world bounds. Actual up-right controller hold moved the player from(180,150) to(350.62,40); pointer release followed. No injected game state, scores or clock. No phone PNGs and no physical-device claim.

No browser errors; source hashes after capture agree with the frozen product hashes above. Slot released promptly after capture. This is verified local evidence before root's new micro-art integration; it does not claim final36 acceptance or source freeze for unrelated ongoing work.

## Naval whole-boat optical correction after micro pass

Opened root's actual `composition-round3-2026-10-03/final-tv36-micro/naval-tv-live-1920.png` and the original `sprites/ship.webp`. The tightly cropped177×480 overhead hull has a native portrait aspect. A32px-long vertical hull correctly preserves aspect but occupies only11.8px width and reads as a sliver beside the heading.

| Before | After | Why |
| --- | --- | --- |
| Entire portrait hull appears as a12px-wide vertical sliver | Entire native44px-long hull is oriented diagonally in a44px optical square (maximum rotated box42.6×42.6px), with8px text separation | Improves recognition while preserving hull aspect and avoiding crop/stretch |

Only Naval `screen.css` changes; the heading keeps its36px height and the accepted rail/four-board geometry remains unchanged. Product frozen SHA256 `63ca248d0045895f07b0a0ef42067ce57d098026f3f6ff95e92595d1418245f9`. Scoped whitespace check and Impeccable scan pass.

First granted TV-only pair attempt at `composition-round3-2026-10-03/naval-whole-boat-1540/` stopped before any gameplay capture: shared `public/tv.js:366` redeclared `tvFitFrame`, confirmed by WebKit and node syntax check. Browser closed/slot released; shared owner notified. Fresh actual1280/1920 proof remains pending shared repair and freeze. No corrected screenshot acceptance claimed yet.

Root repaired the shared duplicate and granted one retry. Actual normal-clock1280/1920 originals in `composition-round3-2026-10-03/naval-whole-boat-confirm-1554/` were captured and individually opened. Both show the complete recognizable diagonal hull with native proportions and clear heading separation; all four boards/crew remain whole and accepted rail/board geometry is unchanged. No phone PNGs. Browser closed and slot released promptly.

Retry report errors0, changedFiles[]; Naval CSS start/end hashes identical `63ca248d0045895f07b0a0ef42067ce57d098026f3f6ff95e92595d1418245f9`. This verifies the named whole-boat correction only; later common micro-adapter revisions and final36 proof remain root's separate work.
