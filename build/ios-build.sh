#!/usr/bin/env bash
# Fairpot — build the iOS app and upload it to TestFlight.
#
# Run by GitHub Actions on a Mac (see build/github-workflow.yml). Everything the
# build does lives in THIS visible file, so future changes never need the hidden
# .github folder touched again.
#
# Needs these environment variables (GitHub repository secrets):
#   ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_P8, APPLE_TEAM_ID
# and RUN_NUMBER (the build number, rising every run).

set -euo pipefail

for v in ASC_KEY_ID ASC_ISSUER_ID ASC_KEY_P8 APPLE_TEAM_ID; do
  if [ -z "${!v:-}" ]; then
    echo "::notice title=Build skipped::The Apple secret $v is not set yet. See HANDOVER.md, step 5."
    exit 0
  fi
done

TMP="${RUNNER_TEMP:-/tmp}"
VERSION=$(node -p "require('./package.json').version")
BUILD="${RUN_NUMBER:-1}"
echo "Building Fairpot $VERSION (build $BUILD)"

echo "--- Install Capacitor and plugins"
npm install --no-audit --no-fund

echo "--- Generate the iOS project (fresh every build)"
rm -rf ios
npx cap add ios
npx cap sync ios

echo "--- Permission text, display name"
PLIST=ios/App/App/Info.plist
plutil -replace NSCameraUsageDescription -string "Fairpot uses the camera to photograph receipts you choose to attach to an expense." "$PLIST"
plutil -replace NSPhotoLibraryUsageDescription -string "Fairpot opens your photo library so you can attach a receipt photo to an expense." "$PLIST"
plutil -replace CFBundleDisplayName -string "Fairpot" "$PLIST"
# Export compliance: the SQLite component includes an encryption library (SQLCipher),
# although Fairpot's database is NOT encrypted. The answer is given in App Store
# Connect for now (see STORE-LISTING.md); set it here once confirmed:
#   plutil -replace ITSAppUsesNonExemptEncryption -bool NO "$PLIST"

echo "--- App icon"
ICONSET=ios/App/App/Assets.xcassets/AppIcon.appiconset
rm -rf "$ICONSET"; mkdir -p "$ICONSET"
cp resources/icon.png "$ICONSET/AppIcon-1024.png"
cat > "$ICONSET/Contents.json" <<'JSON'
{
  "images": [
    { "filename": "AppIcon-1024.png", "idiom": "universal", "platform": "ios", "size": "1024x1024" }
  ],
  "info": { "author": "xcode", "version": 1 }
}
JSON

echo "--- Launch screen image"
SPLASH=ios/App/App/Assets.xcassets/Splash.imageset
if [ -d "$SPLASH" ]; then
  rm -f "$SPLASH"/*.png
  cp resources/splash.png "$SPLASH/splash.png"
  cat > "$SPLASH/Contents.json" <<'JSON'
{
  "images": [
    { "idiom": "universal", "filename": "splash.png", "scale": "1x" },
    { "idiom": "universal", "filename": "splash.png", "scale": "2x" },
    { "idiom": "universal", "filename": "splash.png", "scale": "3x" }
  ],
  "info": { "author": "xcode", "version": 1 }
}
JSON
else
  echo "(no Splash image set in this Capacitor template — keeping the default launch screen)"
fi

echo "--- App Store Connect key"
mkdir -p "$TMP/keys"
KEY="$TMP/keys/AuthKey_${ASC_KEY_ID}.p8"
printf '%s\n' "$ASC_KEY_P8" > "$KEY"
trap 'rm -rf "$TMP/keys"' EXIT

AUTH=(-allowProvisioningUpdates
      -authenticationKeyPath "$KEY"
      -authenticationKeyID "$ASC_KEY_ID"
      -authenticationKeyIssuerID "$ASC_ISSUER_ID")

echo "--- Build and sign"
xcodebuild archive \
  -project ios/App/App.xcodeproj \
  -scheme App \
  -configuration Release \
  -destination "generic/platform=iOS" \
  -archivePath "$TMP/App.xcarchive" \
  "${AUTH[@]}" \
  DEVELOPMENT_TEAM="$APPLE_TEAM_ID" \
  MARKETING_VERSION="$VERSION" \
  CURRENT_PROJECT_VERSION="$BUILD" \
  -quiet

echo "--- Upload to TestFlight"
cat > "$TMP/ExportOptions.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key><string>app-store-connect</string>
  <key>destination</key><string>upload</string>
  <key>teamID</key><string>${APPLE_TEAM_ID}</string>
  <key>signingStyle</key><string>automatic</string>
  <key>uploadSymbols</key><true/>
  <key>manageAppVersionAndBuildNumber</key><false/>
</dict>
</plist>
PLIST
xcodebuild -exportArchive \
  -archivePath "$TMP/App.xcarchive" \
  -exportOptionsPlist "$TMP/ExportOptions.plist" \
  -exportPath "$TMP/export" \
  "${AUTH[@]}"

echo "::notice title=Uploaded::Fairpot $VERSION build $BUILD sent to App Store Connect. It appears in TestFlight after Apple finishes processing (usually 5–30 minutes)."
