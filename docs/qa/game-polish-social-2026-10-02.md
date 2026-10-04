# Game polish · social lane · 2026-10-02

Lane: `games/quiz` (sinyakquiz, warsaw), `games/millionaire`, `games/crocodile`, `games/drawguess`, `games/spy`, `games/monster`.
Rules, scoring and protocol are unchanged. The only server edit is the monster results-overlay timing (see below). Typography decisions in the round-3 audits are kept. No images were generated, and no image requests were filed.

## Changes per game

| Game | Files | What changed |
| --- | --- | --- |
| Shared quiz-family feedback | `{quiz,millionaire,crocodile,drawguess}/public/screen.js` | The local "correct" and "win" burst now uses the shared procedural `HeyPalsSprites` confetti plus one soft radial glow. It replaces the thin ellipse outline and grey rectangles. The canvas version remains as a fallback. |
| Quiz (both topics) | `quiz/public/quiz-polish.{js,css}`, hook in `app.js` (`quiz:rendered` event), include in `index.html` | **Question entrance:** the question rises in, then the answers A–D stagger in (60 ms apart). **Lock-in on the phone:** the tapped answer gets a squash-and-ring within the same frame, plus a light haptic. **Reveal:** wrong answers desaturate, the correct one pops and gets a sheen, and the explanation fades up. **Phone reveal:** your own pick is now outlined lime if right and pink if wrong. Before, the lavender "picked" outline hid the result. Points count up with a floating "+N" chip, and score/danger haptics fire. **TV:** "Answers received" ticks on each new answer, and standings rows flash and count up when a score rises. |
| Millionaire | `millionaire/public/host.js`, `player.js`, new `mq-polish.css` (included in `host.html` and `index.html`) | **Final-answer beat** on TV and phone: the locked pick glows amber for 1.1 s (0.65 s on a timeout), then the correct answer pops with a sheen and a wrong pick shakes (TV only). The previous ladder stays on screen and the result beep is delayed until the beat ends, so nothing gives the result away early. **Ladder:** rows are keyed by player, the money counts up, the bar climbs over 15 visible rungs, and order changes glide (FLIP). The row that climbs gets one glow. **Question entrance:** the category drops in, then the question, then a stagger of answers. **Phone:** tapped answer locks amber with a haptic; the last 5 s turn the timer pink and tick each second; the reveal card shows "FINAL ANSWER · pick", then the outcome with an emoji pop and a money count-up. |
| Crocodile | `crocodile/public/croc-polish.{js,css}`, hook in `app.js`, include in `index.html` | **Actor phone:** the word card deals in when the turn starts. A new word flips in after "Guessed", or slides in after "Skip". "Guessed" also gives a sprite burst from the button, a "+100" chip, a lime card flash and a haptic. The secret word now uses Kardia Fat Runner (it was a system font). **TV and guessers:** a "+100" chip and a bump on the turn counter, using public counters only. The time bar turns pink in the final 10 s. |
| Draw & Guess | `drawguess/public/app.js` (ink renderer), new `draw-polish.{js,css}`, include in `index.html` | **Ink:** the segments of each stroke are joined into one smoothed path (midpoint quadratics) with a soft glow, redrawn once per animation frame. The artist sees an immediate local trail between the 30 ms network sends. The board has a vignette and a faint dot grid instead of a flat black fill. **Correct guess:** burst, haptic and a lime pulse on the input; on the TV the newest guess pops. **Reveal:** "This is: …" becomes a large lime word that flips in with a burst. The TV guesses panel no longer shows a scrollbar. |
| Spy | new `spy/public/spy-polish.{js,css}`, included in `index.html` and `host.html` | **Private role card:** a dossier cover (hatch and dashed frame) with a lime hold ring that fills over the existing 260 ms threshold. The cover then swings open in 3D. Timing and visuals are identical for spies and locals. On release the content becomes invisible instantly, before the cover swings back. **TV:** ready cards pop, the vote orb bumps per vote, and the in-game result icon, title and spy chips land in sequence with a burst. |
| Monster | `monster/server.js` (ui phase timing), `public/host.js`, `public/play.js`, new `public/monster-polish.css` (included in `index.html`) | **Bug fixed:** in managed play the TV podium covered the finished monster instantly, so nobody ever saw the drawing. The game now keeps ui phase `reveal` for a showcase of `min(12 s, 3.6 s + 0.9 s × parts)` before `results`. The result report is still sent at once, so `tests/monster.test.js` stays valid. **TV reveal:** the monster unveils part by part from the head down, each credit lights up with its part, and a burst plays at the end. The canvas now fits 720p and 1080p with the credits visible (before, it ran off the bottom edge). The title is localised: "Round 1: 3 parts of chaos". **Playing TV:** a completed part pops its chip, slides in the next chip, bumps the counter and bursts. **Phone brush:** coalesced pointer samples are joined by midpoint quadratics, so strokes are smoother. |

All motion uses transform and opacity (plus filter or box-shadow for one-off glows), a strong ease-out, and stays under 300 ms for UI transitions. The reveal beats are longer by design. Reduced motion disables every new animation, including the hold beats. Shake is TV-only (millionaire wrong answer).

## Secrets

- Quiz and millionaire: the correct index only exists in reveal snapshots. The beats only delay what is shown.
- Crocodile: the word is animated only where the server already puts it (the actor's snapshot). Other screens react to `turnGuessed` and `turnSkips`.
- Draw & Guess: the TV word comes only from `#revealWord`, which is filled in the public reveal phase.
- Spy: the cover and flip have the same timing for every role, and nothing role-specific is added to the DOM or the TV.

## Evidence

All captures use Playwright WebKit with a real ephemeral launcher, 3 real browser phones, real taps, holds and drags, and nothing injected. Each accepted image was opened and reviewed. Capture script: the session scratchpad `social-capture.cjs`. It is not committed because `scripts/` is outside the lane.

- Before: `.localparty-build/game-polish-social/before/`
- After: `.localparty-build/game-polish-social/after/` (all games at TV 1280/1920 and phone 393/320), `after-r2/` (monster and drawguess re-run after the fit and label fixes), `after-native/` (402×874 native route with `controller-bridge.js` and `tabs.js`: quiz, millionaire, spy).
- Key frames:
  - `after/millionaire-tv-reveal-150-1280.png` shows the amber lock; `-750` shows the correct pop and ladder climb.
  - `after-native/millionaire-phone-reveal-150.png` shows the phone final-answer card.
  - `after-native/sinyakquiz-phone-reveal.png` shows the wrong pick in pink.
  - `after/spy-phone-hold-140.png` shows the hold ring; `spy-phone-released.png` shows the content hidden after release.
  - `after-r2/monster-tv-reveal-{1280,1920}.png` shows the finished monster now visible on the TV.
  - `after-r2/drawguess-tv-reveal-1280.png` shows the big reveal word with no scrollbar.
  - `after/drawguess-phone-guess-correct-180.png` shows the correct-guess burst.

## Tests

- `node --test tests/monster.test.js tests/quiz.test.js tests/quiz-pacing.test.js tests/result-ranking.test.cjs tests/i18n-content-coverage.test.js tests/game-feel-state.test.js tests/crocodile.test.js tests/drawguess.test.js tests/drawguess-localization.test.js`: 114/114 pass.
- `node games/spy/integration.test.cjs`: pass.
- `node --check` passes on every edited JS file.

## Not verified

- No physical iPhone, Apple TV, AirPlay or real haptics; headless WebKit only.
- Mid-animation frames were sampled at fixed delays, not stepped frame by frame.
- Not exercised: teams mode, 16 players, the warsaw topic visually (same code as sinyakquiz), the drawguess late joiner, the spy correct-location guess, and pause during the monster showcase. Pausing during the showcase does not hold the `Date.now()` check, so after a long pause the overlay appears on the next emit.
- The browser suites `tests/spy-ui.browser.cjs`, `quiz-*-browser.cjs` and `monster-browser.cjs` were not run. They may assert old timing: the spy content opacity, the millionaire reveal at 0 ms, and the monster results arriving straight after reveal. Please check them in the full run.
- The new `public/rankings-theme.js` (another agent's work, uncommitted) restyles the millionaire ladder rows. One intermediate capture showed the name overflowing its row. The final captures look correct, but this was not re-checked with 16 players.
