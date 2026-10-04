# Western mascot rig and Sunset scenery

Status: source implementation ready; fresh real-state browser and independent image review pending.

| Request | Before | Current implementation |
| --- | --- | --- |
| One Shot Western brand characters | Human cowboy body and gun arm, colour applied to clothing. | Four individually generated HeyPals blob mascot body colours and four separate matching pistol arms. Existing actor height, world placement and gameplay remain authoritative. |
| Separate aiming/shooting arm | Existing human-v2 60ms aim and 160ms recoil rig. | Independent new atlas loader follows the same animation timing; derives muzzle position from the actual rendered arm pivot and barrel point. Existing v2 remains fallback until the new image and metadata both load. |
| Two at Sunset hard rounded scene corners | Whole canvas enclosed by rounded stage border. | Host stage has no rounded card border. Only decorative background caches fade at their right edge; actors, muzzle effects, names and cue are subsequently rendered without masking. Focus-blurred background receives the same fade to prevent a blur edge reappearing. |

## Generated originals and alpha

Built-in `image_gen`, transparent background. Final original copied byte-for-byte into
`public/assets/gameplay/generated/western-mascots-v3.png` (RGBA, 1774x887).
SHA-256: `879ff5484bcb5572b9a1533ad61018dd665b58a44bd8a0f60e4fbba93f9cd810`.

The exact prompt and original source path are retained in `western-mascots-v3-prompt.txt`.
Frames, visible alpha boxes, per-body measured contact hulls, shoulder/arm/muzzle pivots
and provenance are in `western-mascots-v3.json`. Every body and arm has four pixels of
source-frame padding around alpha >= 8. No visible content reaches its atlas cell edge.
The generated original includes faint alpha 1–7 noise outside those visible bounds;
this is recorded honestly. No background removal, recolouring, painting or bitmap
cutout edits were performed. Native frame aspect ratios are used by canvas drawImage.

The first raw atlas was opened and visually inspected. It contains complete hats,
feet, guns and four distinct authored body colours. Live small-size rendering and
body/arm joint acceptance remain required; this document does not substitute an atlas
preview for actual game evidence.

## Ownership and preservation

- Group06 owns `games/party/public/host.js` and host HTML integration. Western is the `party` engine; there is no `games/western` directory.
- Independent helper/assets are under `public/assets/gameplay/generated/`; the common PartyArt manifest is unchanged.
- Sunset changes are scoped to its host background rendering and stage appearance in `games/western_duel/public/app.js` and `style.css`.
- No combat rules, actor coordinates, scoring, timing, authoritative projectile protocol, controllers or Tank artwork were changed.
- Two at Sunset simulation checks: 4/4 passing. Modified JavaScript syntax checks pass.
- Physical devices and AirPlay remain unverified.
