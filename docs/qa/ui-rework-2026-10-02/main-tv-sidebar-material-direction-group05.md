# Main TV sidebar — material direction and independent review

2026-10-02. Group05 creative/read-only reviewer; group01 alone implements `public/tv-menu-polish.css`. Reference: user clipboard `codex-clipboard-a8ba284b-764d-4568-b607-8bfcd9f08e74.png`, personally opened at1920×1080, plus actual tv-menu-polish/polish/tv-show/tv/rankings-theme sources. Applied Impeccable colorize/delight and Emil design engineering guidance. This extends established violet/lime/Kardia identity through material roles; it does not reconstruct accepted layout.

Fixed contract: all card geometry/proportions and relative order,18logical-pixel headings,128logical-pixel QR, dense4+12 roster and all3leaders. QR white background/scannability and real state/copy are unchanged. Hero's tilted soft mask is accepted; separate latest request to move it slightly up/left and widen/soften the mask belongs to group01, without brightness filters or geometry changes to sidebar. No new UI controls, logo/fonts, image generation or raster cost needed.

## Three coordinated materials

| Panel | Material mechanism, not colour alone | Bounded source targets | Visual dose and exclusions |
|---|---|---|---|
| JOIN THE PARTY | Polished enamel invite plaque: olive-neutral/champagne surface, one broad ivory-lime soft specular band across upper face, subtle inset bevel, restrained embossed diagonal cornerstroke echoing existing arrow. Base#263129, quiet edge#697354; highlight#edf3c3 at low alpha. | #tvSidebar>.tv-invite and its existing decorative pseudo layers | Header/QR stay primary. Reflection belongs behind content; no texture on QR and no extra arrow/badge. Warm welcoming premium physical surface without turning it into a lime primary button. |
| OUR PEOPLE | Matte graphite roster: cooler charcoal/slate backing#242b34, flat soft edge#59646d, extremely low-contrast code-native grain, recessed row beds with subtle bottom inset crease. Unlike Invite, no broad glossy reflection. Existing colourful avatar chips remain the colour. | #tvSidebar>.company-people:not(.tv-invite), #players .player rear/background only | Grain should be imperceptible at1280. Do not blur/grain text or avatars. Dense4+12 must retain identical names/capsule sizes/spacing. Header and lime count unchanged. |
| ON TOP | Award case: smoked-violet quiet backing#302441 with warm low amber lamp at bottom; the richness is in medal-specific foil rows. Gold row warm bronze/champagne sheen, silver blue-slate/platinum sheen, bronze warm copper sheen. Current medals are reused; no extra medal/crown/decor image. | #tvRanking, #tvLeaders>.mini-rank:nth-child(1/2/3), existing decorative pseudo layers | Rank1 visibly brightest, ranks2/3 still richer than old plain purple. Broad static highlights and fine keylines; no animated glitter or glint loop. Name/score keep current typography and boxes. Body/name inks stay readable, medal-specific score inks from established ranking palette. |

Suggested award rear gradients are only bounded source directions: gold#735728→#554426→#352c31, silver#3c5260→#293849→#272c39, bronze#624332→#453132→#342a31. A single restrained top highlight adds foil without reflective metallic noise. Existing established medal inks#ffe5a3/#d7edff/#ffd0aa and corresponding ranking keylines/tints should carry into these rows; do not transplant unrelated leaderboard geometry or bigger digits.

## Source diagnosis and fixes requested

| Before | After | Why |
|---|---|---|
| All sidebar sections use the same#292238ef/#342846f2 purple painted face | Enamel invitation, matte graphite roster, smoked award backing with rich medal-specific row materials | Different functions deserve visible material roles; replacing three colours alone is insufficient. |
| `polish.css #tvSidebar>section::after` has inset0/border-top1px/inheritedradius but defaultcontent-box | Override decorative pseudos with inset0,box-sizing:border-box,border-radius:inherit; keep exactly one aligned rim | Extra border box can overrun the card curve; decoration must follow the actual22px outercard radius. |
| Ranking decorative border pseudo has inset-1px and a12second sweeping glint | Matching inset0/inheritedradius/static restrained foil reflection | Avoid detached outline and perpetual attention movement. The medal itself is the signal. |
| Sidebar `::before` is a rectangular linear wash with blur; parent overflow:hidden clips its falloff | Elliptical radial field with transparent outside70–100%, plus explicit fade reaching alpha0 before clipping boundary; alternatively a decorative lobby background layer | The light should dissipate into scene, not visibly end at a vertical/horizontal rectangle. Preserve content clipping/stack layout. |
| Dark identical purple leader rows visually suppress awards | Gold/silver/bronze foils with fine established medal keylines and readable inks | Award order and achievement become legible without adding content or moving rows. |

Glow placement contract: outer decorative light must be visibly soft below the last card and reach transparent before sidebar/lobby viewport boundaries. Keep the current card/content geometry and clipping behavior. If a sidebar pseudo is retained, its visible field must finish within its allowed bounds rather than extending blurred nonzero pixels into the clip. Do not solve this with a larger blurred purple rectangle. Use pointer-events:none and a rear stacking layer; no text veil. Small amount of warm amber under award case can balance the invitation's olive tone, with the hero retaining its own accepted atmosphere.

## Bounded verification

Group01 creates one combined1920/1280 actual original set covering Wi-Fi hint and live QR, sparse and dense4+12 rosters, and all3leader names/scores. Compare frozen current headings/QR/control/card metrics; actual image must show material differences, aligned curved rim and no abrupt bottom glow. Group05/director independently inspect full originals. This document is direction approval only, not actual-material acceptance. No own browser/production edits.

Director direction response: suitable bounded pilot; warm Invite/cool People/medal award rows distinct, smokedviolet remains only quiet award backing. Grain imperceptible at1280, broad highlights restrained, aura alpha0 before clip boundary, inheritedradius/inset0/borderbox aligned. Actual current originals still required before material approval.

## Closed independent review — current originals

Group05 personally opened all twelve full originals in `output/playwright/ui-rework-2026-10-02/group01-menu-material-final/`: `menu-{on,off}-{2,4,16}-{1920,1280}.png`. These are the current combined material/mask batch, not an inherited earlier mask capture. Completed `report.json` at2026-10-02T15:38:18.571Z records `ok:true`, `errors:[]`, `changedFiles:[]`. Rechecked current `public/tv-menu-polish.css` SHA256: `7895e27dbd65d0c6cceed07ac02e78fff68fc8d2fe85105052f5f3a92f60834c`, matching this packet.

| Requested correction | Visible result across the current twelve originals | Disposition |
|---|---|---|
| Three identical purple surfaces | Invitation has a broad warm enamel reflection; People has cooler matte graphite/recessed row beds; awards have visibly brighter gold/silver/bronze foil faces against a quiet violet backing. | Distinct material behavior visible, not colour substitution alone. |
| Detached top outline/curve | Reflection/keyline follows each rounded card; no overlarge detached upper arc visible. Report measures22px/inset0/border-box. | Named mismatch resolved in these originals. |
| Abrupt illumination below stack | Restrained rear light fades into the scene without the former obvious rectangular lower cut. Dense16 stack reaches near the viewport edge, where the glow remains quiet. | Clean falloff; no claim of a large bright halo. |
| Suppressed ranking treatment | Medal-specific row sheen communicates rank; all three leader names and scores remain visible at both sizes. Existing lavender score ink remains readable. | Brighter awards achieved without expanding or relocating rows. |
| Preserve QR/headings/dense roster | Live QR remains clear on its white backing. ON16 shows four explicit players plus12; OFF16 uses the available space for six plus10. All three leaders remain visible. | Incumbent responsive geometry retained; report measures128logical-pixel QR and18logical-pixel headings. |
| Hero too hidden | Up/left placement and wider softer mask visibly reveal faces and brighter bodies; no new lower rectangular edge or headline collision. | Requested visibility correction visible. |

No concrete material defect warrants another correction batch. Grain does not read as noise at1280. Group01 also personally inspected all twelve; director independently inspected all twelve and reported no named correction. This closes the named creative review only and does not infer user approval, physical-TV brightness, distance QR scanning, or whole-catalog acceptance. QR/network proof uses the isolated launcher's real join flow; leader data was seeded QA profile data, not wins played during this capture. No production edit or browser was performed by group05 for this review.
