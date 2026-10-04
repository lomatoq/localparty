# One-scan Wi-Fi joining — build 96

Implemented: shared validated invitation format, `HeyPalsJoin` App Clip target,
Wi-Fi connection with explicit iOS approval, confirmed SSID before browser handoff,
retry / denied / delayed association states, and full-app handling of invitations.
No local-network operations run inside the App Clip. The browser handles the controller.
`joinOnce=false` keeps Wi-Fi associated when the connector leaves the foreground.
The App Clip requires Hotspot Configuration and Access Wi-Fi Information capabilities.

Credentials stay in memory for the host session. They are encoded in the invitation
URL, which is a Wi-Fi credential: base64 is NOT encryption. Never log or add it to
analytics, diagnostics, persistent defaults, a public shortener, or browser history.
Host snapshot exposes QR pixels and readiness flags, not the credential URL/password.
Share/Copy deliberately shares the invitation only after it is activated.
Changing the room address or disabling network access invalidates that invitation.
WPA App Clip invitations support 8–63-byte passphrases; raw 64-digit PSKs currently
remain supported only by the ordinary Wi-Fi QR encoder.

## Actual build status

The existing team UNGUHT4M6C is Personal Team. Signed build explicitly failed:
`Personal development teams, including "Глеб Хляба", do not support the Hotspot and App Clip capabilities.`
This is an Apple provisioning restriction, not a compiler error or approval-review rejection.
The normal host build deliberately does NOT embed an unsigned App Clip and keeps
HPAppClipLive=false. It retains the working room QR and current Invite behaviour.
Do not describe build 96 as delivering functioning one-scan joining to guests.

Unsigned simulator build of HeyPalsJoin succeeds. Invitation validation and existing
native-shell/Wi-Fi tests pass. Wi-Fi association, saved-network switching, system
approval and browser handoff are NOT yet verified on a physical guest phone.
Simulator screenshots are UI fixtures, not evidence that Wi-Fi joining works.

## Activation after paid Developer enrollment

1. Select the paid team for the existing parent bundle and child `.Join` bundle.
   Do not change the installed parent bundle just to sidestep provisioning.
2. Generate the embedding project:
   `ruby scripts/prepare-appclip-distribution.rb --team PAID_TEAM_ID --bundle com.localparty.launcher`
   This creates `ios/LocalParty-AppClip.xcodeproj`, adds the target dependency,
   embeds the clip under AppClips, and sets the associated parent/clip entitlements.
   The normal LocalParty.xcodeproj remains usable for local host builds.
3. Archive that generated project's LocalParty scheme; inspect both signed
   entitlements and parent-child identifiers before uploading.
4. Configure the default App Clip experience in App Store Connect. Its default
   Apple invocation URL supports room-specific query parameters, unlike demo links.
5. Test on a second physical iPhone: saved but disconnected network, other network,
   Wi-Fi off, declined approval, wrong password, router unavailable, already joined,
   slow association, expired/changed host address and browser connection to the room.
   Test full-app-installed invocation as well. Client isolation still prevents LAN play.
6. Only once the experience works, regenerate with `--live`, rebuild and distribute
   the host. Wi-Fi form then replaces the main QR with one App Clip invitation;
   Invite/Copy share that same invitation. There is no second required QR.

Sources:
- https://developer.apple.com/documentation/appclip/choosing-the-right-functionality-for-your-app-clip
- https://developer.apple.com/documentation/networkextension/nehotspotconfigurationmanager
- https://developer.apple.com/documentation/networkextension/nehotspotnetwork/fetchcurrent(completionhandler:)
- https://developer.apple.com/documentation/technotes/tn3179-understanding-local-network-privacy
- https://developer.apple.com/documentation/appclip/distributing-your-app-clip

## Free alternatives researched

- Captive portal on a router under our control: one standard Wi-Fi QR, then the
  operating system presents the network's landing page. Router DHCP/portal setup
  required; a normal iPhone host app cannot alter arbitrary home Wi-Fi this way.
  Arrival in the actual browser/controller still needs real-device verification.
  https://developer.apple.com/news/?id=q78sq5rv
- One downloadable configuration profile can contain Wi-Fi and a Web Clip shortcut.
  Free, but requires explicit installation in Settings and opening the shortcut;
  it does NOT silently connect and launch the game from a Camera scan.
  https://support.apple.com/guide/deployment/dep9a318a393/web
  https://support.apple.com/en-gb/102400
- Public room entry + Internet relay: one ordinary URL QR, no Wi-Fi switching needed.
  Free development services can prove the UX; production capacity, latency, cost
  and native-host relay integration need separate implementation and testing.
  Cloudflare Quick Tunnels are free development tunnels with no uptime guarantee;
  they are not a ready-made iPhone connector in our current build.
  https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/trycloudflare/

Developer membership costs 99 USD/year or local equivalent. Payment unlocks
provisioning, not acceptance by App Review or a guarantee of this untested complete
flow. Treat the existing connector as a prototype until physical tests and Apple
App Clip experience setup succeed.
https://developer.apple.com/help/account/membership/program-enrollment

## Verification recorded 2026-09-28

- 40 targeted native-shell / Wi-Fi / invitation tests passed.
- Signed normal host build 0.11.6 (96) succeeded; iOS and TV resource verification passed.
- Build 96 installed on physical iPhone 00008150-00146CDE0E88401C.
- Automatic launch was refused because the physical phone was locked; not claimed launched.
- Prior build 95 retained at `.localparty-build/LocalParty-0.11.6-95.zip`.
- Fresh App Clip simulator fixture screenshot `.localparty-build/join96-preview.png`
  visually inspected: logo, Kardia typography, demo network, CTA and explanatory text
  fit without clipping. No real credentials used; no Wi-Fi join was attempted.

- Generated parent + embedded App Clip simulator build also succeeded; child bundle identifier and version 96 match the parent. Public activation remains disabled.
