# Phone gameplay visual audit

Reviewed actual phone gameplay captures for all36 catalogue games from `.localparty-build/approved-type-final/captures` in labelled contact sheets, with individual screenshots enlarged for concrete issues. The captures are real joined clients, not visual fixtures. This review covers the captured gameplay/intro state, not every role, every transition or all final results.

## Findings and ownership

- Party Push/Shrink/Bomb/Knives: stat group looked like a square cut-off strip. Root restored a single rounded18px outer contour and solid panel; fresh Bomb screenshot confirms the contour and unchanged session button shapes. Textual states IN/OUT/SAFE still need state typography instead of numeric typography; assigned to shared component owner.
- Tank Arsenal: FLAMETHROWER split the final R onto another line. Root changed the weapon label to upright readable body type, retaining numeric face for Health/Points; included in targeted recapture.
- Crane, Kart, Spy, Western Duel: several large state/action labels retained upright legacy type despite the approved italic action role. Assigned shared semantic role coverage.
- Quiz/Crocodile/DrawGuess: secondary instructions and answers still inherit broad italic/uppercase overrides. Dedicated family CSS cleanup assigned; large titles retain approved typography.
- Jenga: geometry fit alone is insufficient. Native layer select, disconnected block buttons and gesture directions lack a coherent control composition. User explicitly rejected it; full scoped redesign assigned to Astra. Do not mark the old screen approved.
- Pocket Siege, sports Sound and session footer: small action labels need a14px minimum, including nested spans. Shared readability pass assigned; approved footer shapes remain.
- Mines: separate320px audit found OPEN TILE clipping. Scoped short-screen layout fixed and recaptured; button52px tall remains wholly inside the game iframe.

## Other inspected surfaces

Tap Race, Flappy, Hungry, Snake Lines, Carry Ball, Marble Bloom, Bow Club, Poker and Air Hockey: current captured screens have usable hierarchy and no visible clipping in these393px captures. This is a bounded observation, not blanket aesthetic approval or evidence for320px/landscape/alternate roles.

The screenshots and user feedback remain review evidence. Automated runtime success does not override the unresolved findings above.
