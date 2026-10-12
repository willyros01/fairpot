# Fairpot Android APK — preparation boundary

Status: ANDROID BUILD INITIATED (2026-10-12). User authorized proceeding. A debug-signed test APK workflow and script have been added; build outcome not yet verified. No public release authorized.

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
- `package.json` currently includes Capacitor core and iOS v8, filesystem, share, and community SQLite, but not `@capacitor/android` or an Android sync script.
- `capacitor.config.json`: app ID `io.github.willyros01.fairpot`, app name Fairpot, webDir `www`, SQLite Android encryption currently false.
- README/HANDOVER describe iOS TestFlight and device-local SQLite.

## Android implementation checklist (in progress)
1. Inspect current app source, iOS adapters, web assets, workflows and dependency lockfile. Record functional baseline before code changes.
2. Add a Capacitor Android dependency matching the locked Capacitor major version; add Android sync/build scripts. Generate native Android project in `android/` only on the Android branch.
3. Review native permissions and Capacitor SQLite, Filesystem, Share, receipt photos, backup import/export, network/offline handling, and keyboard/safe-area usability. Never assume equivalent iOS behavior proves Android.
4. Establish a unique signing key and secure storage for it. Never commit signing credentials/keystore or secrets to Git.
5. Define a repeatable CI workflow for a signed release APK. Keep it manual initially to prevent accidental releases.
6. Test on real Android: install/update path; cold start, persistence after force close, currencies, photos, editing/deleting, sharing, backups/restores (including web backup), offline mode, tablet layout, and permissions. Check any Android version/developer verification impacts at release time.
7. Only after successful testing and explicit approval, publish the signed APK plus checksum and simple instructions on the Cuberoot website, using HTTPS; no GitHub repository URLs need be shown to users.
8. For upgrades, preserve Android application ID and signing key; verify an updated APK installs over the previous one and retains data.

## Release gates
- No changes to Fairpot `main`, `split`, iOS TestFlight, or Cuberoot site unless separately authorized.
- Build of an initial debug-signed APK was explicitly authorized; no public APK advertising/distribution without further approval.
- Source presence is not a test result; actual Android device behavior must pass.
- Maintain rollback path and a signed artifact archive before public APK distribution.
