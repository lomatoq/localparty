#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
MODE=simulator; DEVICE=""; TEAM="${TEAM_ID:-}"; BUNDLE="${BUNDLE_ID:-com.hleb.localparty.personal}"; ONLINE=1
usage() { printf '%s\n' 'Usage: bash scripts/build-ios-local.sh [--prepare | --simulator | --device UDID] [--team TEAM_ID] [--bundle ID] [--offline]'; }
while (($#)); do
  case "$1" in
    --prepare) MODE=prepare; shift;;
    --simulator) MODE=simulator; shift;;
    --device) MODE=device; DEVICE="${2:?Supply the paired iPhone UDID}"; shift 2;;
    --team) TEAM="${2:?Supply your Apple Team ID}"; shift 2;;
    --bundle) BUNDLE="${2:?Supply a unique bundle identifier}"; shift 2;;
    --offline) ONLINE=0; shift;;
    --help|-h) usage; exit 0;;
    *) usage; printf 'Unknown option: %s\n' "$1" >&2; exit 2;;
  esac
done
[[ "$(uname -s)" == Darwin ]] || { echo 'This build needs macOS with full Xcode.' >&2; exit 1; }
[[ "$(uname -m)" == arm64 ]] || { echo 'Existing native physics preparation needs Apple Silicon.' >&2; exit 1; }
for tool in node npm python3 xcodebuild xcrun; do command -v "$tool" >/dev/null || { echo "Missing: $tool" >&2; exit 1; }; done
node -e 'if(Number(process.versions.node.split(".")[0])<20)process.exit(1)' || { echo 'Use the current stable Node LTS, not the embedded mobile runtime.' >&2; exit 1; }
[[ "$(xcrun --sdk iphoneos --show-sdk-version | cut -d. -f1)" -ge 26 ]] || { echo 'Select full Xcode with iOS SDK 26 or newer.' >&2; exit 1; }
if [[ "$MODE" == device ]]; then
  [[ "$TEAM" =~ ^[A-Za-z0-9]{10}$ ]] || { echo 'Pass your own --team TEAM_ID. Do not use the original author team.' >&2; exit 1; }
  [[ "$BUNDLE" =~ ^[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$ ]] || { echo 'Invalid bundle identifier.' >&2; exit 1; }
fi
OUT="$ROOT/.localparty-build"; mkdir -p "$OUT"; printf '*\n' > "$OUT/.gitignore"
{ date -u; git rev-parse HEAD; sw_vers; xcodebuild -version; xcrun --sdk iphoneos --show-sdk-version; node --version; npm --version; } | tee "$OUT/environment.txt"
if ((ONLINE)); then node scripts/check-release-versions.cjs --strict | tee "$OUT/versions.log"; else echo 'OFFLINE: latest versions were NOT checked.' | tee "$OUT/versions.log"; fi
npm ci 2>&1 | tee "$OUT/npm-ci.log"
node --test tests/native-shell.test.cjs 2>&1 | tee "$OUT/native-shell-tests.log"
npm test 2>&1 | tee "$OUT/project-tests.log"
# Existing pinned nodejs-mobile / WABT / Rapier conversion and resource sync.
npm run ios:prepare 2>&1 | tee "$OUT/prepare.log"
if [[ "$MODE" == prepare ]]; then open ios/LocalParty.xcodeproj; exit 0; fi
COMMON=(-project ios/LocalParty.xcodeproj -scheme LocalParty -configuration Debug "MARKETING_VERSION=0.11.0" "CURRENT_PROJECT_VERSION=14")
if [[ "$MODE" == simulator ]]; then
  xcodebuild "${COMMON[@]}" -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' -derivedDataPath "$OUT/Simulator" CODE_SIGNING_ALLOWED=NO build 2>&1 | tee "$OUT/build-simulator.log"
  echo "Unsigned simulator app: $OUT/Simulator/Build/Products/Debug-iphonesimulator/LocalParty.app"
else
  xcodebuild "${COMMON[@]}" -sdk iphoneos -destination "id=$DEVICE" -derivedDataPath "$OUT/Device" -allowProvisioningUpdates -allowProvisioningDeviceRegistration "DEVELOPMENT_TEAM=$TEAM" "PRODUCT_BUNDLE_IDENTIFIER=$BUNDLE" CODE_SIGN_STYLE=Automatic build 2>&1 | tee "$OUT/build-device.log"
  APP="$OUT/Device/Build/Products/Debug-iphoneos/LocalParty.app"
  [[ -d "$APP" ]] || { echo "Missing built app: $APP" >&2; exit 1; }
  xcrun devicectl device install app --device "$DEVICE" "$APP" 2>&1 | tee "$OUT/install.log"
  xcrun devicectl device process launch --device "$DEVICE" "$BUNDLE" 2>&1 | tee "$OUT/launch.log"
fi
