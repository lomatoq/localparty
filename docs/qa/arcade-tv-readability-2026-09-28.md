# Arcade TV readability

Tap Race's canvas is intentionally stretched to fill a wide track. The runner sprites already compensated for that stretch, but the left name badges did not. Their glyphs and circles were distorted. The badges now draw in screen coordinates, use natural text metrics and explicit ellipsis instead of `fillText`'s horizontal compression. Four-player labels use14px at720p and21px at1080p. Track geometry, sprite proportions and physics are unchanged.

The shared arcade player rail used10px names/12px section headings over a muddy translucent green panel. It now uses an opaque violet-neutral surface, bright names14px/18px by TV resolution, scores18px/24px and discrete player-color markers. Existing legacy rules hid names for9–16 participants; those names remain visible in the compact layout. This shared rail affects Tap Race, Punch Meter, Flappy, Hungry Arena, Snake Lines and CarryBall, not phone controllers.

Actual real-server four-player captures and computed styles are in `.localparty-build/arcade-tv-final-density`;16-player validation uses `.localparty-build/arcade-rail-16-final`. `scripts/check-arcade-tv-readability.cjs` joins an actual phone and bot roster, launches via ordinary launcher controls and waits for actual gameplay. A normal host force-start is used only when the ready session remains waiting; scores/state are never injected.

CarryBall was inspected at720p and1080p. Its actual canvas and container have no CSS shadow/filter. The painted field itself has no hard shadow; root's softened player/ball gradient shadows remain intact. No additional speculative shadow edit was made.
