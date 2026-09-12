# Kart touch control verification

The wheel is a relative drag surface: touching it does not instantly turn the kart. A small dead zone and curved response allow fine steering; dragging beyond the surface remains captured. Releasing the wheel centers it independently of the gas finger. The whole steering panel's available middle area accepts dragging. Controls can swap sides.

Sources informing the implementation:
- [MDN pointer capture](https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture): preserve pointer delivery outside the element.
- [MDN multi-pointer events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events/Using_Pointer_Events): separate pointers and explicit touch-action.
- [Descenders developer account of mobile controls](https://www.gamedeveloper.com/game-platforms/deep-dive-creating-the-touch-controls-for-descenders-on-mobile): distinct input zones and testing actual interaction rather than copying desktop controls.

`tests/kart-touch-controls.cjs` passed real browser two-touch input, zero steering jump on contact, left/right dragging, capture outside the pad, independent release, hand swap, and authoritative kart movement. The normal readiness/pause/rules/exit flow also passed. This is browser touch emulation, not a physical iPhone playtest.
