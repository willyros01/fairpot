# Fairpot Android APK — preparation boundary

Status: ANDROID DEBUG APK CI PASSED (2026-10-12), artifact verified. Automatic debug APK publication to the Cuberoot website is authorized and configured; Android device acceptance tests and properly signed production release remain pending.

## Repository and branch policy
- Repository: willyros01/fairpot. Do not create another repository.
- `main`: existing app baseline; do not modify for Android preparation.
- `android`: isolated Android port, native adapter code, tests, signing, and eventual APK distribution.
- Do not change `willyros01/split` (the legacy personal web app).
- Treat any iOS files/workflows as protected; avoid changing iOS TestFlight automation from this branch.
- No automatic merges. Changes that must match across platforms are implemented deliberately through the correct platform adapters and verified functionally.
- User authorized Android build implementation on 2026-10-12; production/public release remains separately gated.

## Verified starting facts
- Created `android` from the current `main`.
- `package.json` includes Capacitor Android v8 plus camera, filesystem, share and community SQLite; the Android build is isolated to branch `android`.
- `capacitor.config.json`: app ID `io.github.willyros01.fairpot`, app name Fairpot, webDir `www`, SQLite Android encryption currently false.
- README/HANDOVER describe iOS TestFlight and device-local SQLite.

## Android implementation checklist (in progress)
1. Inspect current app source, iOS adapters, web assets, workflows and dependency lockfile. Record functional baseline before code changes.
2. Add a Capacitor Android dependency matching the locked Capacitor major version; add Android sync/build scripts. Generate native Android project in `android/` only on the Android branch.
3. Review native permissions and Capacitor SQLite, Filesystem, Share, receipt photos, backup import/export, network/offline handling, and keyboard/safe-area usability. Never assume equivalent iOS behavior proves Android.
4. Establish a unique signing key and secure storage for it. Never commit signing credentials/keystore or secrets to Git.
5. Debug APK build runs automatically on changes to Android sources. A properly signed production release build still needs a secure persistent keystore and separate acceptance testing.
6. Test on real Android: install/update path; cold start, persistence after force close, currencies, photos, editing/deleting, sharing, backups/restores (including web backup), offline mode, tablet layout, and permissions. Check any Android version/developer verification impacts at release time.
7. User explicitly authorized automatic PUBLIC WEBSITE publication of successful **debug/test** APKs on 2026-10-12, before full device certification. The Cuberoot website's `/downloads/fairpot.apk` is the debug/test channel, not a production release. Production signing/release is separately gated.
8. For upgrades, preserve Android application ID and signing key; verify an updated APK installs over the previous one and retains data.

## Release gates
- No changes to Fairpot `main`, `split`, iOS TestFlight, or Cuberoot site unless separately authorized.
- Successful Android **debug** APKs are explicitly authorized for automatic Cuberoot website publication. This does not approve production release signing or Google Play deployment.
- Source presence is not a test result; actual Android device behavior must pass.
- Maintain rollback path and a signed artifact archive before public APK distribution.

## Automatic APK publishing rule — authorized 2026-10-12
- `fairpot/android` workflow `.github/workflows/android-apk.yml` builds and uploads the test APK as a GitHub Actions artifact; its `report` job writes `build/android-last-run.json` with success/failure, run ID, source SHA, artifact ID, and a publication queue indicator.
- `Cuberoot/main` workflow `.github/workflows/publish-fairpot-apk.yml` runs on its own changes, manually, and on a roughly ten-minute schedule. It reads the latest successful Fairpot report and downloads the **exact successful artifact**, not a fresh APK build.
- It updates `downloads/fairpot.apk`, `downloads/fairpot.apk.sha256`, and `downloads/fairpot-build.json` only for a newer verified successful run. Failure keeps the previous downloadable APK intact. GitHub's scheduled workflow can run late.
- The Cuberoot Fairpot section automatically offers the same-domain APK link when the file is available. No GitHub repo URL in that download link.
- Monitor by comparing `fairpot/android/build/android-last-run.json` with `Cuberoot/main/downloads/fairpot-build.json` and the SHA256 sidecar. Verify the actual live URL separately when possible.
- **WARNING:** the CI debug keystore can vary across GitHub runners, so later debug APKs may NOT install as an update over an existing installation. Do not promise in-place updates or data retention until a persistent private signing key is configured and installation has been tested. Backup data before uninstalling.
- Never modify Fairpot `main`, the iOS build, or `willyros01/split` for Android publishing.
