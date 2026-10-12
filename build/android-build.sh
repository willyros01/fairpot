#!/usr/bin/env bash
# Android test APK signed with ONE permanent private key. Not a production release.
set -euo pipefail
node --version
npm install --no-audit --no-fund
npx cap add android
npx cap sync android
bash build/android-native.sh
# Regenerate full Android launcher set from the very same icon used for iOS.
# Java is installed by the Android workflow; no separate image library needed.
test -s resources/icon.png
java build/AndroidIcons.java resources/icon.png android/app/src/main/res
bash build/android-sign.sh
# The private signing key is created only on this runner; remove it on exit.
trap 'rm -f android/app/fairpot-signing.p12 android/app/fairpot-sign.gradle' EXIT
cd android
chmod +x ./gradlew
./gradlew --no-daemon assembleDebug
APK=app/build/outputs/apk/debug/app-debug.apk
test -s "$APK"
SDK="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}"
test -n "$SDK"
SIGNER="$(find "$SDK/build-tools" -name apksigner -type f | sort -V | tail -1)"
test -n "$SIGNER"
"$SIGNER" verify --verbose --print-certs "$APK"
ACTUAL="$("$SIGNER" verify --print-certs "$APK" | sed -n 's/^.*certificate SHA-256 digest: *//p' | head -1 | tr 'A-F' 'a-f')"
EXPECTED="$(keytool -list -v -keystore app/fairpot-signing.p12 -storetype PKCS12 -storepass "$FAIRPOT_SIGNING_PASSWORD" -alias fairpot | sed -n 's/^[[:space:]]*SHA256: *//p' | head -1 | tr -d ':' | tr 'A-F' 'a-f')"
test -n "$ACTUAL" && test "$ACTUAL" = "$EXPECTED" || { echo "::error title=APK signer mismatch::Unexpected Android signing identity"; exit 1; }
echo "Verified persistent APK certificate SHA256: $ACTUAL"
sha256sum "$APK"
