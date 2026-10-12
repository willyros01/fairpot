#!/usr/bin/env bash
# First Android test APK only. Debug-signed; NOT FOR PUBLIC DISTRIBUTION.
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
cd android
chmod +x ./gradlew
./gradlew --no-daemon assembleDebug
test -s app/build/outputs/apk/debug/app-debug.apk
sha256sum app/build/outputs/apk/debug/app-debug.apk
