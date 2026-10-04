# Western round-result notice

Owner: arcade_layout. Source scope is only the new `public/game-message.js` and `public/game-message.css`. Group06 owns the opt-in Party host integration and root owns shared-route registration.

The user requested a pleasant in-game result notice like the existing Joined Party toast. The implemented notice inherits that component's identity/copy grouping, rounded shape and soft offset depth. Western uses a copper/umber gradient, cream copy and a small existing trophy silhouette. A single genuine round winner gets the same roster portrait used by the game; tied or unidentifiable outcomes use the trophy without implying one winning player.

The game supplies the exact authoritative `winnerText`. The new component supplies no round timers, queues, game rules or scores. Its default material is violet for future explicit opt-in consumers, while Western is the only current integration. DRAW/fake cue presentation, timing, audio and the earned winner effects remain with the existing renderer.

## Integration contract

```js
const notice = HeyPalsGameMessage.create({game: 'western'});
const visible = notice.show({
  key: 'western:' + round,
  text: winnerText,
  portrait: winnerPortrait,
  anchor: {x: projectedCenterX, y: projectedTopY},
  avoid: actorRectsInCssPixels
});
notice.hide();
```

`show` returns whether a safe placement exists. It measures the current shared HUD exclusions and the owner-supplied actor rectangles, then clamps the compact card within the viewport. The supplied anchor is preferred; clear vertical alternatives are tested without changing its horizontal task alignment. If no safe placement exists it hides, allowing the owner to retain its existing result fallback. Repeated calls with the same event key do not restart the entrance. Caller resize handling must refresh projected anchors and actor rectangles. There is no automatic opt-in for other games.

Group06 suppresses only the old Western between-round black card/text/shine once this component is visibly placed. It derives a unique winner from actual increments to `roundWins`, preserves the exact result text, and hides the notice outside the between phase. The old card and earned feedback for other Party modes remain unchanged.

## Verification status

- JavaScript syntax passes.
- Bounded Impeccable layout detector returned no findings for the two new files.
- Final real normal-clock Western round-winner originals at 1280×720 and 1920×1080 were captured and opened. Exact authoritative result text, loaded roster portrait, clear header/actor placement and actual next-phase hide were verified. Errors and watched source drift are empty. See `game-message-notice-proof.json`.
- One bounded markup correction resolved the shared generic-paragraph classifier overriding this result with gray italic instructional styling. Final computed type is upright KardiaFit and cream `rgb(255, 243, 223)`.
- Initial runtime failure in the new Western rig was identified and corrected by its owner. Its historical raw report is retained; the rig geometry itself is outside this notification verdict.
- Browser and ephemeral server are closed. Source is frozen at game-message.js `3ae63c7d67b1b01c0adcfda402dc5201519485c17f7d3fd5665d7121c8b73be3` and game-message.css `d563537cfb14ddf5de473103465f66c0dcc3bd9cfc335c970408d9746a0a6548`. Independent art-director review opened both final originals and found no named notification blocker; exact result lettering, portrait/trophy, scene-related material and clear placement passed at notice scope.
- No mobile captures are part of this notification task.

Reference inspected: `public/tv-show.js` arrival renderer and `public/tv-show.css` arrival styles; actual current `western-tv-live-1280.png` from `final-tv36-micro` for the clear-sky/header/actor arrangement. The current gameplay screenshot is reference evidence, not evidence of the new between-round state.
