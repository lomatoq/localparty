# HeyPals interface contract

Status: implementation contract, not a claim that every screen has passed visual review. User decisions take precedence over this document.

## Direction and sources

A playful console with rounded, deliberate shapes, distinct typography and readable controls. Modernity is not a year label, a blur filter or a universal radius.

Read on 2026-09-27:
- Google, [Expressive Design research](https://design.google/library/expressive-material-design-google-research): use shape, colour, scale and grouping to direct attention; preserve recognisable interaction patterns. Apply those principles, not a wholesale Android visual skin.
- Apple, [Design great interfaces for handheld games](https://developer.apple.com/videos/play/meet-with-apple/243/): adapt game interfaces to the handheld surface and input method rather than shrinking a desktop layout.
- Apple, [Designing for games](https://developer.apple.com/design/human-interface-guidelines/designing-for-games/): safe areas, legible text and controls appropriate to the device.

The sizes and shapes below are HeyPals decisions based on its real screens; they are not purported universal research findings.

## Non-negotiable user decisions

English first. Anybody true italic + CAPS for game names, mode names, state titles, card titles and large action titles. Oxanium for numeric readouts. Onest upright for player names. Descriptions, rules and hints use Anybody Italic 400 in normal sentence case (latest explicit user decision). Unbounded only for restrained secondary section accents. No blanket italic/uppercase on all descendants.

The user approved the current visual design of Pause and In lobby. Preserve their appearance while checking function, safe-area placement and clipping. Their mobile backdrop must fade from transparent into the shell background; never replace it with a hard solid strip. Reserve layout space for the footer so its fade cannot hide essential controls.

No generic blurred gradient blobs behind every game. Preserve authored field art and effects tied to actual game events. Rounded panels must not become square strips when grouped.

## Hierarchy

Each screen has one dominant action or task. A countdown can be equally prominent when it determines the player's action.

| Role | Phone baseline | TV at 1280×720 |
| --- | --- | --- |
| Main action label | 20–30 px, italic | As required by interaction |
| Game/state title | 20–28 px, italic CAPS | Game 22–26 px; secondary phase 16 px |
| Main timer/score | 24–32 px, Oxanium | 28–32 px, Oxanium |
| Player identity | 15–17 px, upright | 16–20 px, upright |
| Instruction | 14–16 px, lighter italic | 16–20 px, lighter italic |
| Supporting label | 12–13 px | 12–14 px |

Do not enlarge generic GAME over the actual game title. Never shrink an important timer to metadata size. Long state titles wrap or use a deliberate smaller title style; they must not silently become BETWEEN ROUN… . Names are not numeric data and must not inherit the score face. Single-word weapon names must not wrap their final letter onto another line.

## Shape, spacing and surfaces

- Use a limited radius family: 28 px for major control areas, 22 px for content cards, 18 px for compact grouped stats, and capsule geometry for the approved session buttons. These are role tokens, not separate per-game guesses.
- Passive information cards use one semantic role: a fine rim, a restrained lavender/pink pearlescent surface, and short soft lines centered on both top and bottom edges. Keep the lines visible but quiet; no offset notches or continuous pulse. Do not apply this treatment to buttons, joystick surfaces, canvas fields or containers holding interactive controls.
- A grouped panel has one complete outer contour. Inner dividers stay inside that contour; their backgrounds cannot paint square corners outside it.
- Space scale: 4/8/12/16/24/32 px. Related label/value pairs use 4–8 px; separate groups use 16–24 px. Do not call a huge unused middle region 'air'.
- Separate title, instruction, input and outcome logically: title above its instruction, instructions grouped by purpose, related controls together, and feedback beside the action that caused it. Use weight and spacing before adding another box. In long rules, keep a compact section label and an 8–14 px gap between instruction groups.
- Nested panels are exceptional. Avoid a border inside another border unless it separates a genuinely different task or interactive surface.
- Gameplay surfaces are quiet and solid; colour belongs to the main action, team identity, selection and meaningful feedback. Disabled controls remain distinguishable from selected controls.
- Selected state must have shape/outline or a check in addition to colour. Focus has its own visible outline.

## Input, selectors and scrolling

- Icon + label buttons use a dedicated decorative icon element (aria-hidden), 20 px standard icon box, 10 px gap, and centered alignment. Do not embed navigation arrows into the label string. Large primary actions can explicitly opt into a larger icon token; icon-only directional pads keep their intentional larger scale. Dynamic counts and translations must update the label without destroying the icon.
- Large repeated action controls use 20–24 px labels; 14 px is a minimum floor, not a default for a large button. Compact utility controls use 16 px where they fit. Explicitly check long labels at 320 px; do not reduce them silently to fit.
- All action targets remain at least 44×44 CSS px, preferably 52 px for repeated touch controls.
- A three-way choice is a single coherent segmented control, not three unrelated heavy cards. Current selection is obvious before interaction.
- A short ordered range (such as a Jenga layer) uses a clear stepper or direct selection with the current value prominent. Preserve native keyboard/accessibility semantics and existing server validation.
- Range controls have a visible track, generous thumb and a nearby label/value. Do not rely on an unexplained tiny browser-default slider.
- Scroll the content region, not essential session actions. Avoid nested scrolling in a gameplay controller. Long results and catalogues can scroll; their final item must remain reachable.
- Mobile reading regions keep native touch scrolling without visible scrollbar gutters. Show a soft edge fade only on the edge that has more content; remove it at the scroll boundary. Never fade or clip the collapsed rules control or essential actions.
- Critical gameplay controls must fit at 320×568 without requiring a scroll to shoot, move, select or confirm. Safe areas and the shared footer reduce the available region and must be included in the calculation.

## Motion and feedback

90–150 ms immediate feedback, around 180–240 ms transitions. Input sends immediately, independent of visual animation. Respect reduced motion. A persistent pulse cannot stand in for clear hierarchy. Event effects are bounded and cannot cover instructions or other players' names.

## Acceptance workflow

1. Capture the real state after fonts load at phone 320/375/393 and TV 720/1080 as applicable.
2. Inspect the image for composition, rhythm, hierarchy, shapes and clarity. Geometry checks alone cannot pass design.
3. A second reviewer checks the screenshot; enlarge suspicious areas. Record the game and state, not 'looks fine'.
4. Test actual interactions, timing and state changes separately. Guard discovered repeatable failures with a focused regression assertion.
5. Recapture affected screens after changes. Keep source revision and capture time. Do not carry old approval onto a new screenshot.
6. A prototype is labelled as a prototype. A gameplay screenshot is not evidence of untested results, alternate roles or physical-device behaviour.

## Kardia update — user decision, build 88
This supersedes previous typeface roles. Use only the supplied Kardia family for interface text across launcher, native host, TV, controllers, rules, menus and canvas labels. Primary headings and primary actions use Kardia Fat Runner, uppercase and authored slant. Fit is the thinnest permitted face: supporting text uses Fit, descriptions use Fit Runner; never use Slim. Legacy font names may exist only as compatibility aliases pointing to Kardia font files. Verify actual font resource URLs, not only CSS family names. The approved logo artwork stays unchanged.

Use supplied Game Icon Pack SVG silhouettes for menu and gameplay symbols, with consistent optical boxes and icon-label gaps. No atlas is required. Buttons showing votes/readiness/exit votes display the actual ratio as a lighter fill inside their rounded bounds; no unrelated decorative progress or invented timers. Audio Mute belongs below Music/Effects and is centered as a label-checkbox pair.
