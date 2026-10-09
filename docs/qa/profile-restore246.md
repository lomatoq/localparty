# Returning browser profile — round 246

Scope: browser `/play`, profile storage and restoration. This is separate from the TV/render-performance work. Baseline `db5e4f4`; no native identity or authentication changes.

## Verified defect and narrow fix

`public/app.js` wrote `local-party-profile` to localStorage before requesting its independent device cookie. A storage quota/restriction error rejected `persist()` before the POST: baseline fault reproduction returned `QuotaExceededError`, **zero cookie requests**. The installation-ID bootstrap also threw `SecurityError` and stopped the controller when storage was unavailable.

Storage reads/writes/removals now fail independently. A validated `joined` profile still requests `/api/profile` with `credentials: same-origin`, and its small token-only POST uses `keepalive` so navigation can finish the request. The token is captured from the acknowledged profile for that persistence call. Temporary HTTP failure still leaves a usable local cache when storage permits it. No credential is added to a URL.

The server continues validating its 48-character random bearer token. The cookie remains host-only, HttpOnly, Path `/`, SameSite Lax, one year. An unknown token cannot recover a different gateway database or claim an account merely through a visible player ID. No parent-domain cookie, origin relaxation or trust in a player ID was introduced.

## Tests completed

- Source fault reproduction: baseline profile write throws before its cookie POST; blocked storage throws at installation-ID initialization.
- `node --test tests/profile-storage.test.cjs`: **5/5**. Quota failure, blocked storage, HTTP failure/local fallback, acknowledged token snapshot, empty identity.
- Sequential existing `lobby`, `profile-store`, `reconnect-load`, `adversarial-reconnect` suites: **17/17**. Includes persisted identity/coin data, cookie restoration, unknown/duplicate identity rejection and two seeded 16-controller reconnect sequences.
- Initial network run was blocked by sandbox `listen EPERM`; the authorized rerun passed. The initial runner failure is not an application regression.
- `node --test tests/lancert-https.test.js`: **3/3**. Same-IP provider recreation uses the saved certificate and hostname without registration. Renewal of a near-expiry certificate also retains its hostname and credentials. A changed LAN IP triggers a new registration/hostname and challenge. This is an offline provider-contract test with disposable certificates, not a live service mutation or a physical-phone trace.

## Browser verification completed

`tests/browser/profile-restore246.cjs` passed **12/12 expected scenario rows**: Chromium and desktop WebKit × baseline/fixed × ordinary/full/restricted storage. It uses disposable persistent browser contexts and real `/play` onboarding against an isolated persistent `PARTY_DATA_FILE`; only baseline `app.js` is intercepted for comparison. There was no active device profiling or other browser benchmark during this exclusive slot.

Ordinary baseline storage already restores correctly in both engines. The reproduced regression requires injected storage failure: quota failure completes the first join but never writes its independent cookie, so reload shows onboarding again; restricted reads prevent baseline controller boot. All six fixed rows have zero page errors and retain the same authenticated ID/token, entered name, Left hand and uploaded avatar across reload, new tab, full browser process close/relaunch, actual server process restart and a new TCP port. Saved statistics remain one game and 40 coins. Full/restricted storage are explicit injected conditions, not claims about the user's friend's Safari settings.

Ordinary-storage rows also verify a valid cookie winning over a stale local token, a valid local token recovering from a stale cookie, and same-host HTTP→HTTPS restoration. The HTTPS test uses a disposable self-signed QA certificate and browser certificate bypass in the harness only; production trust settings are unchanged. Across fixed rows, another hostname cannot silently claim the profile and another gateway database rejects the unknown credential without automatically creating an account. `null` report fields mean a scenario was not exercised in that storage mode.

The validated [JSON report](../../output/playwright/profile246/validated/report.json) records assertions, exact source hashes and 42 individual 393×852 captures. The earlier two reports contain an invalid normal-mode run: the initial harness accidentally injected the quota fault into `normal`. This was corrected and reported before acceptance; those files are preserved for diagnosis, and only `validated/report.json` is acceptance evidence.

Visual review: all 42 captures were inspected in four engine/revision contact sheets; four fixed full/restricted-storage profile sheets were additionally inspected individually at their original size. Baseline lost-storage onboarding lacks the saved avatar/name/Left selection, while every fixed restoration preserves them. Profile Save and Back remain visible, and this identity-only patch introduces no geometry changes. These captures are profile restoration evidence, not an all-popup or physical-phone UI audit.

- [Chromium baseline captures](../../output/playwright/profile246/validated/chromium-baseline-contact.png)
- [Chromium fixed captures](../../output/playwright/profile246/validated/chromium-fixed-contact.png)
- [WebKit baseline captures](../../output/playwright/profile246/validated/webkit-baseline-contact.png)
- [WebKit fixed captures](../../output/playwright/profile246/validated/webkit-fixed-contact.png)

## Origin boundary and outstanding device evidence

The LAN HTTPS provider currently registers a new hostname when the iPhone's LAN IP changes (`lib/lancert-https.js`). It **does not re-register on every app/server startup at the same IP**. iOS passes `Application Support/LocalParty/party.json` as the persistent `PARTY_DATA_FILE`; the server places `https/lancert.json` beside that data file. The Application Support directory is explicitly configured with `completeUntilFirstUserAuthentication`. Startup deletes the runtime-port marker, not the profile/certificate database. This path/protection behavior is verified from current source; no physical filesystem protection audit is claimed.

The [official Lancert security model](https://github.com/lucor/lancert#security-model) permits registration credentials to update DNS challenge TXT values only; they cannot change A records. Therefore there is no supported authenticated IP-update API to substitute for current registration in this patch. No registration request or provider DNS mutation was performed in this investigation.

Cookies are hostname-scoped, localStorage is origin-scoped. A different hostname cannot automatically read the old browser credentials. In the actual Chromium/WebKit pass, a new port and same-host HTTP→HTTPS leave origin-local storage unavailable but still recover through the validated host cookie. Incognito/new browser storage or user-cleared site data cannot recover an identity without an authenticated portable account mechanism. The injected restricted-storage test leaves cookies enabled; browsers that block both stores are outside that result.

Do not infer that the user's exact phone failure had this cause: its previous/new URL and site-data behavior have not been captured. No physical Safari/iPhone acceptance is claimed. A stable authenticated origin/online account can solve portability later; widening the cookie to a shared LAN certificate service domain would expose credentials and is deliberately avoided.
