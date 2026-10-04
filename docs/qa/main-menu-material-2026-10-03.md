# Main menu material refinement — 2026-10-03

Production scope: `public/tv-menu-polish.css` only. SHA256 `22caf75ac2736b983ebc8f0dd0101ffc159beeabd3d32c1cf087d0cd2b8a2a4b`. No build performed. Root independently opened QR-off1280 and QR-on1920 and accepted the materials for the gallery; final gallery review remains with the user.

Join uses a quiet mint highlight over teal; Our People uses violet/slate depth with darker inset rows. Existing rounded22px shapes, fonts, panel geometry and player-summary behavior are retained. QR is the only live invitation content; addresses remain visually clipped. The shared glow is now a radial lobby background, outside the scrolling sidebar clip, so its left edge fades without a rectangular seam. Removed the old tiny diagonal corner reflection; added no assets or edge cuffs.

## Actual evidence

Reused the real isolated-room harness from `scripts/qa/group01-menu.cjs`, adapted at `/private/tmp/menu-material-capture.cjs`. Players joined actual lobby WebSockets; network-set used the real admin API. The QR image exactly matched the authorized network URL and opening that URL completed a real player join. Leaderboard history was seeded through ProfileStore.record in isolated QA data, not claimed as played wins. Arrival notices were allowed to clear naturally.

Baseline: `output/playwright/main-menu-material-2026-10-03/baseline`. First pass: `.../refined`. Final confirmation: `output/playwright/main-menu-material-2026-10-03/confirmation/report.json`. Final12 originals were personally opened, as were first-pass12 and baseline2. Both capture passes had zero page errors and zero source drift. The final computed metrics confirm no micro nodes, no clipped sidebar glow pseudo, radial lobby wash,18logical heading sizes and hidden-address clip. Baseline1-player off images retain identical sidebar/card/heading boxes at both sizes. Impeccable mechanical detector returned no findings.

## Per-original inspection

| Final original | Observation |
| --- | --- |
| `menu-off-1-1920.png` | Wi-Fi setup instruction readable; QR hidden; one intact name/avatar row. Mint/teal and violet/slate distinct; softly fading left wash, whole rounded contours, no arrival overlay. |
| `menu-off-1-1280.png` | Wi-Fi setup instruction readable; QR hidden; one intact name/avatar row. Mint/teal and violet/slate distinct; softly fading left wash, whole rounded contours, no arrival overlay. |
| `menu-on-1-1920.png` | Crisp QR only, no address or supporting live-invite copy; one intact name/avatar row. Mint/teal and violet/slate distinct; softly fading left wash, whole rounded contours, no arrival overlay. |
| `menu-on-1-1280.png` | Crisp QR only, no address or supporting live-invite copy; one intact name/avatar row. Mint/teal and violet/slate distinct; softly fading left wash, whole rounded contours, no arrival overlay. |
| `menu-on-4-1920.png` | Crisp QR only, no address or supporting live-invite copy; all four names/avatars remain visible with intentional long-name ellipsis. Mint/teal and violet/slate distinct; softly fading left wash, whole rounded contours, no arrival overlay. |
| `menu-on-4-1280.png` | Crisp QR only, no address or supporting live-invite copy; all four names/avatars remain visible with intentional long-name ellipsis. Mint/teal and violet/slate distinct; softly fading left wash, whole rounded contours, no arrival overlay. |
| `menu-off-4-1920.png` | Wi-Fi setup instruction readable; QR hidden; all four names/avatars remain visible with intentional long-name ellipsis. Mint/teal and violet/slate distinct; softly fading left wash, whole rounded contours, no arrival overlay. |
| `menu-off-4-1280.png` | Wi-Fi setup instruction readable; QR hidden; all four names/avatars remain visible with intentional long-name ellipsis. Mint/teal and violet/slate distinct; softly fading left wash, whole rounded contours, no arrival overlay. |
| `menu-on-16-1920.png` | Crisp QR only, no address or supporting live-invite copy; real16 count and existing explicit +12/+10 overflow summary intact. Mint/teal and violet/slate distinct; softly fading left wash, whole rounded contours, no arrival overlay. |
| `menu-on-16-1280.png` | Crisp QR only, no address or supporting live-invite copy; real16 count and existing explicit +12/+10 overflow summary intact. Mint/teal and violet/slate distinct; softly fading left wash, whole rounded contours, no arrival overlay. |
| `menu-off-16-1920.png` | Wi-Fi setup instruction readable; QR hidden; real16 count and existing explicit +12/+10 overflow summary intact. Mint/teal and violet/slate distinct; softly fading left wash, whole rounded contours, no arrival overlay. |
| `menu-off-16-1280.png` | Wi-Fi setup instruction readable; QR hidden; real16 count and existing explicit +12/+10 overflow summary intact. Mint/teal and violet/slate distinct; softly fading left wash, whole rounded contours, no arrival overlay. |

## Craft sources

Read the project regression/design contracts and [Impeccable](</Users/hlebhlyaba/.codex/skills/impeccable/SKILL.md>) layout/craft-floor references, Emil design engineering, and the saved HeyPals screenshot-review skill. [better-ui SKILL.md](https://raw.githubusercontent.com/jakubkrehel/skills/main/skills/better-ui/SKILL.md) and [surfaces.md](https://raw.githubusercontent.com/jakubkrehel/skills/main/skills/better-ui/surfaces.md) informed restrained surface depth and optical coherence while preserving the established radius, type and density. Latest human scope overrides stale PRODUCT.md bottom-controller-only scope.

This is browser visual/runtime evidence for MAIN TV only. Physical iOS/AirPlay and gameplay were not reverified by this CSS-only pass. Other game headers and the cancelled decorator integration were untouched.
