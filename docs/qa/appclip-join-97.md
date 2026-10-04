# Paid-team App Clip integration — build 97

User confirmed paid Apple Developer membership on 2026-09-28.
The existing UNGUHT4M6C team now successfully provisions the App Clip with
Hotspot Configuration. The old Personal Team restriction is resolved.

## Correction to the build 96 prototype

Apple provisioning rejects Access Wi-Fi Information for the App Clip. Removed
that entitlement from the clip and all fetchCurrent calls from the APPCLIP
compilation branch. The full paid app keeps Wi-Fi information capability and
confirms SSID before opening the browser. The App Clip uses Apple apply completion
and does not pretend this confirms an actual LAN connection. All LAN access belongs
to the external browser. No local network requests run inside the clip.

Correct Apple-generated invocation link format is:
`https://appclip.apple.com/id?p=com.localparty.launcher.Join&join=...`
The original build 96 draft's empty query parameter was incorrect and never
activated for public invitations. Encoder, decoder, configuration and tests now
use `p`, following App Store Connect documentation.

## Remaining launch requirement

Paid signing alone doesn't activate public QR invocation. Upload the parent app
with embedded App Clip, configure its default experience in App Store Connect,
and obtain Apple approval. The ordinary Apple-provided link activates only once
the version is approved. TestFlight/local experiences have different testing
requirements; they are not claimed to support unconfigured ordinary guest scans.

Host HPAppClipLive remains false until the experience is actually available.
Do not swap a working room QR for an unavailable Apple link.
Wi-Fi credentials must be entered once by the host in the existing Wi-Fi invite
form; no app can extract the saved password from iOS.

References:
- https://developer.apple.com/help/app-store-connect/offer-app-clip-experiences/offer-a-default-app-clip-experience
- https://developer.apple.com/documentation/appclip/testing-the-launch-experience-of-your-app-clip

App Clip signing succeeded. The guest Wi-Fi association/browser flow still needs
physical-device verification using the actual host network. No production
Wi-Fi credentials were accessed or uploaded during development.

## Build and installation evidence

- Debug parent with embedded HeyPalsJoin: BUILD SUCCEEDED, version 0.11.6 (97).
- Release archive: ARCHIVE SUCCEEDED at
  `.localparty-build/HeyPals-0.11.6-97.xcarchive`.
- `codesign --verify --deep --strict` passed with normal system keychain access.
- Both archived bundle IDs and build numbers verified; host HPAppClipLive is false.
- 40 invitation, Wi-Fi invite and native-shell checks passed, zero failures.
- Installed build 97 on the existing physical iPhone, retaining application data.
- Previous build 95 and 96 ZIP backups retained. Build 97 backup is separate.
- App Store Connect sign-in confirmed, but New App actions failed in Codex IAB
  with JavaScript removeChild TypeError. Safari fallback requires its own sign-in.

Do not enable HPAppClipLive on signing or upload alone. Confirm the approved
public experience and a real guest scan before switching invitations.

## App Store Connect draft

- App name: HeyPals; platform: iOS; primary language: English (US).
- Parent bundle: com.localparty.launcher; App Clip: com.localparty.launcher.Join.
- SKU suggestion: heypals-ios.
- Default App Clip subtitle: Join your friends’ Wi-Fi and open your game controller.
- Action: Open.
- Default link: https://appclip.apple.com/id?p=com.localparty.launcher.Join
- Card artwork requirement: 1800 × 1200 PNG/JPEG; use approved HeyPals branding.
- Review note must explain: host enters SSID/password; guest approves the system
  Wi-Fi request; clip hands off to HTTPS browser; gameplay stays on the host LAN.
- Provide a working review/test setup; never use real personal network passwords
  in review attachments. Privacy disclosures and public metadata still need review.
- Physical launch attempted after installation: blocked by locked iPhone;
  installation itself succeeded. Guest Wi-Fi connection not yet verified.

## Closed TestFlight direction

User requested TestFlight for a small group instead of public distribution.
Created HeyPals in App Store Connect: Apple app ID 6817083185, bundle
com.localparty.launcher, SKU heypals-ios, iOS, English (US).
App Store export succeeded with uploadSymbols=false and stripSwiftSymbols=false;
Node symbol processing was excessively slow in the optional-symbol export.
IPA: .localparty-build/AppStore97/LocalParty.ipa (172 MB).
Do not submit or release the public App Store version in this task.
External TestFlight requires beta review; App Clip testing requires configured
beta invocations, distinct from a live public default App Clip URL.

Upload succeeded on 2026-09-28 at 20:53 Warsaw time. Xcode reported
“Uploaded package is processing” and “Upload succeeded”.
Created internal group HeyPals Internal with automatic distribution disabled.
Saved beta description and review notes; no public App Store submission made.
External tester emails and beta review contact phone still need user input.

## TestFlight setup after processing

Apple processed build 97; upload status Complete, build Missing Compliance.
Created external group HeyPals Closed Beta, one user-provided tester added.
Beta review contact and feedback address supplied by user and saved in ASC.
Public invitation link remains disabled.
Encryption questionnaire prepared with standard algorithms outside/in addition
to Apple OS (embedded Node/OpenSSL), France distribution No for this closed test.
Automatic approval review rejected final Save as a legally consequential
declaration requiring explicit user confirmation of both answers. Asked user
for confirmation; do not bypass using CLI/API or change to an inaccurate
“no encryption” answer. No Beta App Review submission yet.
If distribution extends to France, revisit declaration/document requirements.

## Beta review submission

After user confirmed the current declaration and future France distribution
would be handled separately, ASC showed Ready to Submit (declaration was
already saved when the UI was inspected). Added closed external group to
build 97, saved What to Test, and submitted Beta App Review.
Verified status Waiting for Review. Automatically notify testers enabled;
closed group contains one user-provided tester. Public link remains off.
Wizard initially defaulted Sign-in required to on despite saved global
information. Removed the checkbox and verified Value 0 before continuing.
Automatic review initially misread this toggle; fresh AX and visual evidence
confirmed it was on, then the correct on-to-off action succeeded.
App Clip is embedded and recognized, but beta invocation URL is not configured.
Do not claim ordinary one-scan public QR is live from beta submission.
