# Spacing and alignment audit

Checked 20 existing games. Host active/countdown DOM measured at 1920×1080, 3430×1300, 1440×900. Mobile start, pause, rules and exit checked at402×874. Real screenshots inspected for all20 host active/countdown screens; full lifecycle is covered separately by visual_stage_audit, not claimed here.

## Fixed
- Uniform active title36px and64px reserved strip; waiting retains large title. Old160px active reserve shifted boxed arenas down96px.
- Monster, Millionaire and Chaos active content cleared from title.
- Quiz/Warsaw/Crocodile short question stage vertically centered alongside roster.
- Crane rail padding24px and gap16px, with rules inset like other rails.
- Phase class only explicit countdown/playing/reveal/results; pause preserves current layout.

## Validation
- All20 start/pause/rules/resume/exit passed after patch.
- No visible canvas/stage horizontal or bottom overflow in measured three desktop sizes. Naval collapsed standings descendants exceed their collapsed box geometrically but are not displayed; this is not a visible clipping failure.
- Kart and Millionaire fresh screenshots manually inspected after patch.
- Mobile waiting styling untouched.

## Intentional layout differences
- Full-screen party arena canvas has no64px inset; its geometry is centered and compact title occupies unused left corner.
- Boxed arena families reserve64px because their content spans title region.
- Naval16-grid cells use12px gaps and10px inset to fit all fields; ordinary rail uses16px gap/24px inset.
- Long settings panels can scroll internally; stage never shifts or scrolls with rail.

## Artifacts
- push: spacing-push.json; ux-host-game-push.png; ux-phone-game-push.png
- shrink: spacing-shrink.json; ux-host-game-shrink.png; ux-phone-game-shrink.png
- knives: spacing-knives.json; ux-host-game-knives.png; ux-phone-game-knives.png
- bomb: spacing-bomb.json; ux-host-game-bomb.png; ux-phone-game-bomb.png
- western: spacing-western.json; ux-host-game-western.png; ux-phone-game-western.png
- tanks: spacing-tanks.json; ux-host-game-tanks.png; ux-phone-game-tanks.png
- tankarena: spacing-tankarena.json; ux-host-game-tankarena.png; ux-phone-game-tankarena.png
- chaos: spacing-chaos.json; ux-host-game-chaos.png; ux-phone-game-chaos.png
- kart: spacing-kart.json; ux-host-game-kart.png; ux-phone-game-kart.png
- monster: spacing-monster.json; ux-host-game-monster.png; ux-phone-game-monster.png
- spy: spacing-spy.json; ux-host-game-spy.png; ux-phone-game-spy.png
- millionaire: spacing-millionaire.json; ux-host-game-millionaire.png; ux-phone-game-millionaire.png
- sinyakquiz: spacing-sinyakquiz.json; ux-host-game-sinyakquiz.png; ux-phone-game-sinyakquiz.png
- warsaw: spacing-warsaw.json; ux-host-game-warsaw.png; ux-phone-game-warsaw.png
- crocodile: spacing-crocodile.json; ux-host-game-crocodile.png; ux-phone-game-crocodile.png
- jenga: spacing-jenga.json; ux-host-game-jenga.png; ux-phone-game-jenga.png
- crane: spacing-crane.json; ux-host-game-crane.png; ux-phone-game-crane.png
- naval: spacing-naval.json; ux-host-game-naval.png; ux-phone-game-naval.png
- drawguess: spacing-drawguess.json; ux-host-game-drawguess.png; ux-phone-game-drawguess.png
- western_duel: spacing-western_duel.json; ux-host-game-western_duel.png; ux-phone-game-western_duel.png