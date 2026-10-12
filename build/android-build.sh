#!/usr/bin/env bash
# First Android test APK only. Debug-signed; NOT FOR PUBLIC DISTRIBUTION.
set -euo pipefail
node --version
npm install --no-audit --no-fund
npx cap add android
npx cap sync android
bash build/android-native.sh
cd android
chmod +x ./gradlew
./gradlew --no-daemon assembleDebug
test -s app/build/outputs/apk/debug/app-debug.apk
sha256sum app/build/outputs/apk/debug/app-debug.apk
