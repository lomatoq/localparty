# Independent TV visual audit

Reviewed all 36 `*-tv.png` gameplay captures from the final sweep, then the later six-game refresh (push, shrink, knives, bomb, punchmeter, tankarena). Used nine 2×2 contact sheets, plus full-resolution inspection of suspect Western, Tanks, Chaos, quiz, Crocodile, Naval and subsequent fixes. This report does **not** claim a review of waiting, pause or result screenshots.

Contact sheets: `.localparty-build/approved-type-final/tv-contact/`.

## Concrete findings and disposition

- Western: long central state ellipsized (`BETWEEN ROUN…`). Assigned to Astra shared state fitting.
- Chaos: calibration heading touched/overlapped the shared notch. Fixed local title safe inset and presentation-only arena fit below the complete heading.
- Tanks: arena bottom border touched the display edge. Fixed local canvas bounds with a16px bottom gutter and preserved contain/aspect ratio.
- Quiz/Sinyak/Warsaw, Crocodile, DrawGuess, Millionaire: legacy blanket style made supporting copy, player identities and scores all bold italic uppercase. Replaced the TV blanket with explicit Onest copy/names, Oxanium scores and Anybody italic headings, retaining rounded24px panels.
- Quiz/Crocodile: partial rounded rules panel appeared at the bottom edge. DOM inspection confirmed a direct `main>details.panel` below a full-height workspace. Hidden for managed TV only; phone rules remain.
- DrawGuess: a long artist name could push the canvas below its card. Bounded TV column now allocates remaining height to the canvas, with a smaller wrapping title.
- PeekShoot: dynamic announcement mixed Russian and English (`Бот1 получает MACHINE GUN на8SECONDS!`). Reported to root/gameplay for localization fix.

## Non-blocking observations

Naval four-player3-column arrangement leaves unused lower-right space. Quiz two-column composition has excess space below the question when only a short question and four answers are visible. These are composition opportunities, not confirmed missing content, and no speculative redesign was introduced during the capture sweep.

## Reviewed gameplay set

push, shrink, knives, bomb, western, tanks, tankarena, chaos, kart, monster, spy, millionaire, sinyakquiz, warsaw, crocodile, jenga, crane, naval, drawguess, western_duel, taprace, punchmeter, flappy, hungry, snakelines, carryball, marble_bloom, pocket_siege, bow_club, poker, airhockey, mines, curling, bowling, swarm_gate, peek_shoot.

## Targeted fix verification

Real WebKit ephemeral production server, normal clock, long human name +3bots, all seven affected games at1280×720 and1920×1080. Assertions passed for safe heading inset, Tanks16px bottom gutter, hidden redundant TV rules, actual Onest normal names and Oxanium normal scores. After exact rules and DrawGuess fixes, all four related game routes were recaptured and passed again. No runtime page errors.

DrawGuess now keeps the entire canvas inside the stage at both sizes with a long artist name. Final1280 screenshots of Chaos, Tanks, SinyakQuiz, Crocodile, DrawGuess and Millionaire were visually inspected at full resolution, in addition to the original36-game contact-sheet review.

Reusable regression: `tests/tv-game-layout.browser.cjs`. Final fix images: `.localparty-build/tv-audit-fixes/*-tv-{1280,1920}.png`.

## Final bounded follow-up

Phone quiz/charades/drawing blanket bold-uppercase italic rule removed; semantic action/title roles retained. Real320/375 runs passed name/copy role checks and overflow checks before the user's subsequent request changed supporting copy back to a lighter italic style. Astra owns that final semantic copy update; player names and numeric values remain upright.

PeekShoot machine-gun notice now formats the complete sentence from event kind + player identity in English/Russian. `tests/sports-notice-copy.test.cjs` passes both locales and unchanged fallback events. `tests/peek-notice.browser.cjs` verified the actual production renderer with an explicitly injected client-only event fixture; this is not a claim that a natural bot activation was observed. The integration test caught the new module missing from the server's static allowlist, which is now fixed. Rendered text: `Бот2 gets a machine gun for8seconds!` (with normal spacing in UI). No renderer page errors.

Seven corrected TV1280 captures were published into `screen-review/captures`; previous images and a SHA256 promotion manifest are retained under `screen-review/history/tv-audit-fixes-20260927T211629Z/`. State reports were not overwritten.

Final italic follow-up verified on a real320px late-joining DrawGuess controller: visible `#guessForm>label` is Anybody italic400 with natural case; input is upright Onest; no horizontal overflow or runtime errors. Screenshot `.localparty-build/phone-role-final/drawguess-320.png`.
