# Passive microattachment evidence

Only QA changed: `scripts/qa/capture-composition-evidence.cjs` and new `scripts/qa/check-micro-attachments-evidence.cjs`. No runtime, game state, image substitution, refresh call or additional browser session.

The existing adjacent screenshot hook samples both actual documents; the checker chooses the parent shared cap or the five game-owned iframe caps. It reads the existing `LocalPartyMicroAssets.inspect()` snapshot and existing `.hp-game-ui-micro-cuff` bitmap. Evidence includes actual game/pack/cell/side/mirror metadata, approved cap rectangle, transformed painted backing, logo/text bounds, canvas visibility/input/accessibility state, nontransparent/transparent counts, alpha8 optical pixel bounds, RGBA fingerprint, painted seat contact/depth and pixel collisions with protected text/images.

The separate checker requires one fresh live record for every36 games at1280 and1920. It checks expected manifest game/pack/cell, actual painted alpha,40 UIpx (or approved36 UIpx constrained fallback), on-screen optical bounds, actual cap identity, painted seat crossing the edge, protected gutter depth and no logo/stat collisions. Unknown/non-live phases are explicitly skipped and never assumed playing; missing eligible pair coverage fails the gate. Naval's authored scaled backing is measured from its actual computed pseudo transform rather than ignoring a contact discrepancy.

Run after the fresh capture:

```sh
node scripts/qa/check-micro-attachments-evidence.cjs <new-capture-directory>
```

Both JavaScript syntax checks passed. A bounded negative check with zero actual records returned `needs-correction` and all72 missing-pair findings. This proves absence cannot silently pass; it is not a visual or runtime approval. The full actual capture and independent original-image review remain root's acceptance gates. Parent result caps/phones are outside this checker.

Historical single-piece QA hashes: capture helper78cdbf24cbb30ac7459919e4f291e99f3d932169e754835953955f9aadc09726; checker8795a85579d9625b1e95f03e46803215777ca0dc5ccf817b79aacfa802991296. Its raw missing-proof rejection is retained in `micro-single-negative-history.json`; it cannot qualify the new pair design.

## Superseding paired top caps

The later explicit user direction has18 top caps with TWO mirrored natural-aspect pieces fitting36–40 UIpx height and≤27 UIpx width from `top-cap-matte-runtime.json` packs4/5,16 side/content caps with ONE existing piece, and ONLY Jenga/Crane with ZERO physical cuffs on their accepted open wash. The checker requires72 actual viewport records and104 painted pieces, using the adapter's explicit `top-pair|single|unboxed` profile and matching canvas role attributes, cross-checked against the approved game-id map. It does not infer roles from proximity.

Recorder evidence is now an array of canvas members. Every visible member gets its own actual alpha/pixel bounds, contact, gutter and protected-ink collision proof. Paired members must occupy opposite left/right seats, have opposite mirror flags and also match as actual mirrored RGBA readbacks within small antialias tolerance. Child pieces additionally project through the real iframe rectangle to confirm whole-TV bounds. Naval/Mines single pieces must occupy the outer LEFT edge, keeping actual tiles clear.

Zero-piece omission requires the explicit `no-physical-edge` diagnostic, null inspection, no visible cuff in either document, transparent unboxed shared cap and local rail, plus Jenga's transparent-edge gradient or Crane's real loaded/painted world background. Hidden reused canvas nodes are retained as provenance and cannot be counted as visible pieces; they are never an omission waiver for another game. The36-game design-kit metadata entries remain required even for those two washes.

Both syntax checks pass. The new no-evidence guard rejects all72 missing actual records and reports104 expected pieces (`micro-pair-negative-check.json`). No browser was started. All browser errors, including Mines ResizeObserver errors, remain raw failures; no filtering or implementation-state injection was added. New actual capture/independent visual review are still required.

Final Shared contract supersedes the initial44/46-longest proposal: pair height36–40.01 logical,width≤27.01, declared contact overlap≤8 logical, both optical vertical bounds inside the same existing cap. Single dimensions remain40 longest or36 constrained; their approved art is unchanged. Pair inspector/DOM profiles stay `top-pair|single|unboxed`; top metadata filename remains `top-cap-matte-runtime.json` for root newv2 artwork. No runtime geometry/data is normalized by the recorder.

Current final QA freeze: capture helper `5f836b5f9db4ac6563fd197e5dec76e64e738af8ade4db30562a8dfadff99ded`; checker `6fff62e4ff0b0c684cd6f3e8810f62372769f484032dfee898feb32b11b48630`. Root is responsible for including both in the new full-capture watched list. New actual36×2 capture is held until root asset/runtime source freeze; no current visual/pixel approval is inferred from the negative check.

## Latest human cancellation: all edge decorations disabled

The latest explicit user request supersedes every single/pair acceptance condition above. All36 games now require the `user-disabled-all` profile:72 live TV records at1280/1920,144 actual document checks (parent plus iframe), and ZERO visible cuff canvases. Game-tinted panels, existing logos and notices remain outside this removal.

The recorder reads real script nodes, link nodes, loaded stylesheets and resource-load history in both documents. The checker requires all four adapter source arrays to be present and empty, plus a false adapter API flag, a false startup flag, a present canvas array and zero visible pieces. An absent API cannot qualify by itself. Missing records, unknown phase coverage, missing originals, game mismatch, source drift and raw browser errors still fail. The explicit disabled reason records the human decision; it does not excuse missing evidence.

Historical pair recorder/checker source is retained in `capture-micro-pairs-history.cjs.txt` and `check-micro-pairs-history.cjs.txt`. Earlier negative reports remain unchanged; their failures are not retroactively waived. Artwork kits remain available on disk for a future design decision. No runtime or asset was modified by this QA change.

Both current syntax checks pass. `micro-disabled-negative-check.json` records the new missing-evidence rejection:72 findings, zero checked records, zero expected pieces,144 expected document checks. This is a bounded negative proof only. Root's next fresh full36 capture must produce the actual absence evidence and adjacent originals; no browser was started for this change.

Current disabled-contract source freeze: capture helper `8c6134b4072ab67f5677c512bb2f4c8ef86312d78641d4391f5f48cd85fe25db`; checker `6e3a9d66a3d1f8d374f76d1368b8b016d80db343839b48e6d9004831341db4d3`. Existing checker name/output `micro-attachments-check.json` are retained for the final catalog gate.
