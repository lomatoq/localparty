#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
MODE=simulator; DEVICE=""; TEAM="${TEAM_ID:-}"; BUNDLE="${BUNDLE_ID:-}"; ONLINE=1
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
[[ "$(xcrun --sdk iphoneos --show-sdk-version | cut -d. -f1)" -ge 27 ]] || { echo 'Select full Xcode with iOS SDK 27 or newer for the AirPlay scene-accessory fix.' >&2; exit 1; }
if [[ "$MODE" == device ]]; then
  [[ "$TEAM" =~ ^[A-Za-z0-9]{10}$ ]] || { echo 'Pass your own --team TEAM_ID. Do not use the original author team.' >&2; exit 1; }
  [[ "$BUNDLE" =~ ^[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$ ]] || { echo 'Pass --bundle with the SAME Bundle ID already installed on your iPhone; do not create a second app.' >&2; exit 1; }
fi
OUT="$ROOT/.localparty-build"; mkdir -p "$OUT"; printf '*\n' > "$OUT/.gitignore"
{ date -u; git rev-parse HEAD; sw_vers; xcodebuild -version; xcrun --sdk iphoneos --show-sdk-version; node --version; npm --version; } | tee "$OUT/environment.txt"
if ((ONLINE)); then node scripts/check-release-versions.cjs --strict | tee "$OUT/versions.log"; else echo 'OFFLINE: latest versions were NOT checked.' | tee "$OUT/versions.log"; fi
npm ci 2>&1 | tee "$OUT/npm-ci.log"
node --test tests/native-shell.test.cjs tests/fresh-lobby.test.cjs tests/tv-director.test.cjs 2>&1 | tee "$OUT/native-shell-tests.log"
python3 tests/test_ios_product.py 2>&1 | tee "$OUT/product-tests.log"
python3 tests/test_show_product.py 2>&1 | tee "$OUT/show-product-tests.log"
npm test 2>&1 | tee "$OUT/project-tests.log"
# Existing pinned nodejs-mobile / WABT / Rapier conversion and resource sync.
npm run ios:prepare 2>&1 | tee "$OUT/prepare.log"
python3 scripts/verify-ios-product.py | tee "$OUT/verify-staged.json"
python3 scripts/verify-show-product.py | tee "$OUT/verify-show-staged.json"
if [[ "$MODE" == prepare ]]; then open ios/LocalParty.xcodeproj; exit 0; fi
COMMON=(-project ios/LocalParty.xcodeproj -scheme LocalParty -configuration Debug)
# Keep the project's version; do not downgrade a user's newer installed build.
# Claude resolves these from the actual current project/installed product.
if [[ -n "${APP_VERSION:-}" ]]; then
  [[ "$APP_VERSION" =~ ^[0-9]+(\.[0-9]+){0,2}$ ]] || { echo 'Invalid APP_VERSION' >&2; exit 1; }
  COMMON+=("MARKETING_VERSION=$APP_VERSION")
fi
if [[ -n "${BUILD_NUMBER:-}" ]]; then
  [[ "$BUILD_NUMBER" =~ ^[0-9]+$ ]] || { echo 'BUILD_NUMBER must be an integer greater than the installed build.' >&2; exit 1; }
  COMMON+=("CURRENT_PROJECT_VERSION=$BUILD_NUMBER")
fi
if [[ "$MODE" == simulator ]]; then
  xcodebuild "${COMMON[@]}" -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' -derivedDataPath "$OUT/Simulator" CODE_SIGNING_ALLOWED=NO build 2>&1 | tee "$OUT/build-simulator.log"
  python3 scripts/verify-ios-product.py --app "$OUT/Simulator/Build/Products/Debug-iphonesimulator/LocalParty.app" | tee "$OUT/verify-simulator.json"
  python3 scripts/verify-show-product.py --app "$OUT/Simulator/Build/Products/Debug-iphonesimulator/LocalParty.app" | tee "$OUT/verify-show-simulator.json"
  echo "Unsigned simulator app: $OUT/Simulator/Build/Products/Debug-iphonesimulator/LocalParty.app"
else
  xcodebuild "${COMMON[@]}" -sdk iphoneos -destination "id=$DEVICE" -derivedDataPath "$OUT/Device" -allowProvisioningUpdates -allowProvisioningDeviceRegistration "DEVELOPMENT_TEAM=$TEAM" "PRODUCT_BUNDLE_IDENTIFIER=$BUNDLE" CODE_SIGN_STYLE=Automatic build 2>&1 | tee "$OUT/build-device.log"
  APP="$OUT/Device/Build/Products/Debug-iphoneos/LocalParty.app"
  [[ -d "$APP" ]] || { echo "Missing built app: $APP" >&2; exit 1; }
  python3 scripts/verify-ios-product.py --app "$APP" | tee "$OUT/verify-device.json"
  python3 scripts/verify-show-product.py --app "$APP" | tee "$OUT/verify-show-device.json"
  xcrun devicectl device install app --device "$DEVICE" "$APP" 2>&1 | tee "$OUT/install.log"
  xcrun devicectl device process launch --device "$DEVICE" "$BUNDLE" 2>&1 | tee "$OUT/launch.log"
fi
