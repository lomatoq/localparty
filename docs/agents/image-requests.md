# Image requests for Codex imagegen · 2026-10-02

Agents don't generate images. Every image that would clearly lift a game goes on
this list; the owner generates it through Codex imagegen and puts the file in
place. Until it exists, code ships a graceful fallback (procedural or current art).

## House style (every prompt must keep it)

- The HeyPals world: glossy soft-toy 3D characters with chunky rounded forms and a clay/vinyl sheen, as in `public/assets/branding/heypals-hero.png` and the game cards in `public/assets/games/*.webp`.
- Palette: deep plum/indigo night base (#151321, #221d30); accents vivid violet (#9b7bff/#c6b1ff), lime (#c8ff73), hot pink (#ff8fd0), warm gold (#ffd36b), cyan (#7ee7ff). Soft rim light, gentle bloom, no harsh black outlines.
- Mood: playful party console, premium, warm; never gritty, realistic-violent or neon-noisy.
- Gameplay sprites: centred subject, genuine **transparent alpha**, generous clear margin, readable silhouette at small size, consistent top-left key light.
- Backgrounds and textures: no text, no logos, nothing important near edges, safe to crop to 16:9 and to phone portrait.
- Reference prompt format: `public/assets/game-logos-v1/prompts.json`.

## How to add a request (agents)

```
### <game id> · <asset name>
- Path: games/<lane>/public/assets/<file>.webp   (or .png when alpha is needed)
- Size / aspect: e.g. 1024×1024 transparent, or 1920×1080
- Used where: <screen/state>, fallback today: <what renders now>
- Prompt: <one paragraph in the house style above>
```

## Requests

(append below, one block per asset)
- See docs/art/imagegen-requests-2026-10-02.json for the full batch (32 assets, 16 atlases).
