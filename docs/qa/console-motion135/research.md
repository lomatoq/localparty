# Console motion direction — 2026-10-06

## Sources read and applicability

- Nintendo developer interview, Mario Wonder, Chapter2: https://www.nintendo.com/au/news-and-articles/ask-the-developer-vol-11-super-mario-bros-wonder-chapter-2/ — animation communicates state and direction; audiovisual timing follows the displayed action. Applied as state-specific silhouettes and synchronized result beats, not copied characters or game rules.
- Masahiro Sakurai official channel, Menus Define Your World: https://www.youtube.com/watch?v=pivfg2DrFfY — official description links menu design to a game's world. Applied as our own violet/lime materials, existing crown/portrait art and event hierarchy.
- Nintendo official Switch HOME Menu introduction: https://www.youtube.com/watch?v=B8g2-ZtbjXk and support https://www.nintendo.com/au/support/articles/home-menu-overview/ — catalog/navigation reference. We retain fast browsing; acknowledgement belongs to confirmed choice, not every focus move.
- Sakurai official Eight Hit Stop Techniques: https://www.youtube.com/watch?v=tycbMSjDDLg — reference located; full video timing was not analyzed frame-by-frame. No simulation pause introduced into this networked game suite.
- Open skill reviewed: https://github.com/jammyfu/open-game-skills/blob/main/skills/disciplines/juice-vfx/SKILL.md — event identity, anchoring, finite resource budgets, reduced-motion alternatives and teardown. Read as public implementation guidance, no installer or external scripts executed.
- Local skills: improve-animations used for read-only audit; animate used for implementation. User already authorized implementation, so audit findings flow into implementation without a separate approval gate.

## Authored direction (our choices, not claimed Nintendo timing values)

1. Selection: confirmed choice emits one inset accent; no replay on snapshot refresh/initial hydration and no animation for browse focus.
2. Combat: brief actor-local impact marks, readable elimination stamp, no universal fullscreen flash.
3. Achievement: HUD-based score feedback, distinct success/turn/recovery cues only when public state proves the event.
4. Results: group rank reveals, shared beats for ties, winner crown emphasis; refreshed profiles do not replay ceremony.
5. Common safeguards: non-blocking input; bounded simultaneous VFX; no physics edits; cleanup on hidden/teardown; soft masks preserved; reduced-motion information remains readable.

## Evidence boundaries

Research includes primary text and official video metadata; no claim of extracting exact Nintendo curves or measuring Nintendo video frame times. Visual and runtime acceptance uses fresh local captures/tests. Physical iPhone/AirPlay performance remains a separate check.

## Typography follow-up

User requested cleaner secondary colors and compact native Replay. Reviewed official Impeccable Colorize: https://github.com/pbakaus/impeccable/blob/main/plugin/skills/impeccable/reference/colorize.md (and matching installed skill). Preserve established palette, derive secondary labels from surface/game hue, avoid stacked opacity on readable labels, verify contrast. Native replay now mint-shaded secondary action with44px minimum target; foreground#edffdc has5.14:1 against the lightest#557245 gradient stop. Shared result Replay remains approved original.
