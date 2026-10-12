#!/usr/bin/env bash
# Persistent Android APK signing for the isolated Fairpot/android branch.
# Secrets MUST be supplied by GitHub Actions. No fallback to a new debug key.
set -euo pipefail
umask 077

: "${FAIRPOT_SIGNING_KEYSTORE_BASE64:?Missing GitHub secret FAIRPOT_SIGNING_KEYSTORE_BASE64}"
: "${FAIRPOT_SIGNING_PASSWORD:?Missing GitHub secret FAIRPOT_SIGNING_PASSWORD}"

APP="android/app"
test -f "$APP/build.gradle"
STORE="$APP/fairpot-signing.p12"
printf '%s' "$FAIRPOT_SIGNING_KEYSTORE_BASE64" | base64 --decode > "$STORE"
chmod 600 "$STORE"
test -s "$STORE"

if ! keytool -list -keystore "$STORE" -storetype PKCS12 \
     -storepass "$FAIRPOT_SIGNING_PASSWORD" -alias fairpot >/dev/null 2>&1; then
  echo "::error title=Android signing invalid::Secret keystore/password/alias mismatch"
  exit 1
fi

cat > "$APP/fairpot-sign.gradle" <<'GRADLE'
android {
    signingConfigs {
        fairpotPersistent {
            storeFile file("fairpot-signing.p12")
            storePassword System.getenv("FAIRPOT_SIGNING_PASSWORD")
            keyAlias "fairpot"
            keyPassword System.getenv("FAIRPOT_SIGNING_PASSWORD")
            storeType "PKCS12"
        }
    }
    buildTypes {
        debug {
            signingConfig signingConfigs.fairpotPersistent
        }
    }
}
GRADLE

if ! grep -Fq 'apply from: "fairpot-sign.gradle"' "$APP/build.gradle"; then
  printf '\napply from: "fairpot-sign.gradle"\n' >> "$APP/build.gradle"
fi
echo "Stable Android signing configuration verified; private key stays in runner."
