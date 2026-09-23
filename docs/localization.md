# Language behavior

English is the default. Each browser/device stores its own choice in `local-party-language`; changing it does not send a room command. Player selectors are in the profile and pause settings. The native host also has its own selector, synchronized with its own controller by the native bridge.

The separate host action `force-language` requires host authorization. It publishes `{language, revision}` in `languageOverride`. Each device consumes a revision once, so a later personal choice survives subsequent snapshots and reconnection. A new explicit host action generates a new revision.

## Translation boundaries

- `public/i18n-dictionary.js`: game/controller/native labels, catalog, rules and statuses.
- `public/i18n-shell.js`: shared lobby, profile, session, TV and error text.
- `public/i18n-content.js`: quiz questions/answers/explanations, charades/drawing words, Spy locations/roles and Monster prompts.
- `public/i18n.js`: presentation translation, reversible DOM originals, accessibility labels, Canvas text, personal preference and one-time room overrides.

Game messages and source data retain their original identifiers. An option without an explicit value receives its original value before its visible label is translated. Player names and editable input are preserved; unguessed DrawGuess messages opt out of translation. DrawGuess accepts the English prompt and original Russian answers server-side, so mixed-language rooms work.

Game frames inherit the already-loaded UI vocabulary through `i18n-inherit.js`. Only the seven word/quiz games download the content dictionary. The observer handles changed nodes/subtrees, not a full-document scan on each frame; recurring translations have a bounded cache. Full scans happen on initial load and explicit language changes.

## Verification

Run the Node tests `i18n.test.js`, `language-room.test.js`, `drawguess-localization.test.js`, and `i18n-content-coverage.test.js` under `tests/`.

Authorized isolated browser checks:

- `tests/i18n-browser.cjs`: default/persistence, independent devices, host isolation, force-once semantics, dynamic restoration, names/input, option values, Canvas and idle mutation loops.
- `tests/i18n-all-games.cjs`: 33 actual game controllers, English/Russian switching, untranslated visible text, shared-screen text and dictionary network requests. Requires `PARTY_PLAYWRIGHT` when Playwright is outside the project dependencies.

The final audit is `.localparty-build/i18n-final-all33/report.json`, with one screenshot per game. It found no untranslated Cyrillic text or JavaScript errors on its captured waiting/playing/controller/shared-screen surfaces. This does not claim exhaustive visual coverage of every possible later match state; the content coverage tests separately check every bank entry.
