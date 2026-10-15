## 2026-10-15 — Fire Android migration/current evidence

- `fairpot/android` contains the isolated permanent-key-signed Fire/Android implementation. Earlier signed build **38310278448** and Cuberoot published run **38310799644** passed CI, signing-identity and artifact publication checks according to this document. This is **not automatically proof of all Fire HD 8 flows**.
- Physical device owner confirmed that a backup was restored successfully on Fire HD 8 including an expense, receipt image and supporting categories/payment settings using the permanent-key-signed installation (prior device testing). A later Android-only repair targeted **Save backup to Downloads**, which previously routed incorrectly to Share; the existing record marks the **post-repair device retest outstanding** unless separately confirmed.
- Preserve `FAIRPOT_SIGNING_KEYSTORE_BASE64`/`FAIRPOT_SIGNING_PASSWORD` and the user's privately held keystore/key backup. Do not uninstall a working installation, migrate SQLite, swap signer, generate replacement keys or touch `fairpot/main` iOS/TestFlight and `split/main` to update docs. Exact same-signer APK in-place upgrades are preferable only after verified backup and device acceptance.
- Cuberoot publisher must download the **already-built signed artifact** and fail closed on signature change. Development/build freeze still applies; maintain separate PASS/FAIL/UNTESTED labels and prove backup file visibility on device rather than assuming success from native source.

---

# Fairpot Android APK — preparation boundary

Status: Previous Android APK passed and was published. On 2026-10-12, permanent Android test-APK signing became MANDATORY. New builds are blocked until BOTH private GitHub Actions signing secrets are supplied; a new permanently signed APK has not yet passed device acceptance. Production release is separately gated.

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
4. Establish a unique signing key and secure storage for it. Never commit signing credentials/keystore or secrets to Git. The new Android build fails closed without BOTH signing secrets; one-time setup script: `build/setup-android-signing.sh` (run in the user's own authenticated Google Cloud Shell).
5. APK build runs automatically on changes to Android sources. Once secrets are installed, the Android **test** APK will be signed with a persistent private key, but it is still a debuggable test build, NOT a production release.
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
- `Cuberoot/main` workflow `.github/workflows/publish-fairpot-apk.yml` runs on its own changes, manually, and on a roughly ten-minute schedule. It reads the latest successful Fairpot report and downloads the **exact successful artifact** where GitHub token access permits. If a cross-repo token cannot access the artifact, it builds the **exact SHA of the previously successful Fairpot build**, never a pinned older commit or unverified branch HEAD.
- It updates `downloads/fairpot.apk`, `downloads/fairpot.apk.sha256`, and `downloads/fairpot-build.json` only for a newer verified successful run. Failure keeps the previous downloadable APK intact. GitHub's scheduled workflow can run late.
- The Cuberoot Fairpot section automatically offers the same-domain APK link when the file is available. No GitHub repo URL in that download link.
- Monitor by comparing `fairpot/android/build/android-last-run.json` with `Cuberoot/main/downloads/fairpot-build.json` and the SHA256 sidecar. Verify the actual live URL separately when possible.
- **WARNING:** the CI debug keystore can vary across GitHub runners, so later debug APKs may NOT install as an update over an existing installation. Do not promise in-place updates or data retention until a persistent private signing key is configured and installation has been tested. Backup data before uninstalling.
- Never modify Fairpot `main`, the iOS build, or `willyros01/split` for Android publishing.

## Fire HD 8 defect repair — 2026-10-12
- Bug: Generic launcher icon on tablet. iOS uses `resources/icon.png`; Android generates all launcher densities and adaptive icon assets from that identical source using `build/AndroidIcons.java`. Verified the resulting blue bowl/coins `ic_launcher.png` is **embedded inside** the built APK, not merely present in source (successful run 38293302768).
- Separate distribution defect: Cuberoot initially served a previous, generic-icon APK until its publisher caught up. The Cuberoot app page now reads `downloads/fairpot-build.json` and generates a build-specific `?build=<run_id>` APK URL and filename so Fire/Silk avoids stale downloaded files.
- Bug: Amazon Fire OS did not provide a local file destination through Android's `ACTION_CREATE_DOCUMENT` picker. Android `FairpotDocument.saveToDownloads` now writes directly to public **Downloads**: Fire OS 8 / Android 10+ via `MediaStore.Downloads` and Fire OS 7 / Android 9 via permission-controlled public Downloads. Permission denied or I/O errors are shown as errors, and no backup-success record is set unless the native write succeeds. Preserve iOS/web backup paths.
- Build run 38296922424 from SHA `730bf543e5c538c191f8c94f78dfba92633bb7ca` **PASSED**, APK artifact `11768784351`. Downloaded and inspected actual APK: normal/round/adaptive launcher images and `FairpotDocument.saveToDownloads` appear in the artifact.
- Device verification PENDING on Fire HD 8: (1) new launcher logo appears, (2) save backup opens no picker and creates a JSON file in Downloads, (3) the saved file opens/is valid and can be restored, (4) app data remain intact across update, restart and reinstall/restore.
- Critical independently verified warning: APK signing certificates **differed between two consecutive debug builds**, so an update may be refused. Do NOT uninstall an existing installation containing expense data before safeguarding it in a separate location. Configure a stable private Android signing key as a separate future task; never commit credentials to the public repository.

## Stable Android signing and data-migration protection — 2026-10-12

**Authorization:** user said "go" after requesting permanent signing and verified backup migration. Scope: only `fairpot/android` and the already-authorized Cuberoot APK publishing workflow.

**New signing architecture**
- `build/android-sign.sh` decodes `FAIRPOT_SIGNING_KEYSTORE_BASE64` (GitHub Actions encrypted secret) to an ephemeral generated native Android project and wires Gradle debug variant to the **same** PKCS12 signing key; alias: `fairpot`; password secret: `FAIRPOT_SIGNING_PASSWORD`. The secrets are **never** printed, committed, or stored in GitHub history.
- `build/android-build.sh` refuses to build without the correct PKCS12 secret, verifies the certificate digest of the built APK against the private keystore using `apksigner` and `keytool`, and removes key files when exiting the job.
- `.github/workflows/android-apk.yml` injects the two repository Actions secrets and fails if either is missing. Unstable default Android debug signing **must never be used as a fallback** for new published APKs. Build status report and automated Cuberoot publishing stay wired.
- `Cuberoot/main/build/publish-fairpot.sh` now downloads ONLY the exact successful GitHub artifact. It **must not** rebuild the package under another signing key. It verifies the signature, records `signer_sha256` in published metadata, and rejects unexpected signing-certificate changes for future versions.
- One-time signing provision: `build/setup-android-signing.sh` generates the key on the user's OWN Cloud Shell, uses GitHub CLI to upload both as encrypted GitHub Actions secrets, and reuses exactly the same key if run again. It may require one GitHub CLI authorization and must NOT be run from an untrusted shell.
- The Cloud Shell files `~/fairpot-sign/fairpot.p12` and `~/fairpot-sign/password.txt` **must be backed up privately and safely by the user**. Do not rely on Cloud Shell lifetime as the only key backup.

**Existing Fire HD 8 migration**
- At least one current test APK was signed under an old ephemeral debug key, so a newly permanent-key-signed APK will NOT install over it. Do not attempt to bypass signature checks.
- User uploaded `fairpot-backup-2026-10-12.json`. Verified structural JSON contains one expense, one valid JPEG receipt photo, categories, and payment settings. The user ALSO has the copy they emailed/downloaded. JSON validity is not a substitute for on-device successful restore.
- Keep original app installed until first new permanent APK is built, published, the backup is held independently and accessible, and the user authorizes uninstall.
- After uninstall and reinstall, use Fairpot Summary → Restore Backup to import JSON, then confirm expense, photo, categories, payment methods, and restart persistence. Do not delete backup; retain a known-good backup outside Fire tablet.
- An APK under the new stable key can update future APKs signed under that same key, subject to Android versionCode and device acceptance testing. This cannot recover the previous ephemeral signing key.

## Fire HD 8 backup routing regression — 2026-10-12

**DEVICE TEST:** User installed the persistent-key signed Android APK (GitHub Actions run 38307131967) on Fire HD 8. Imported the previously verified backup successfully, including the expense and JPEG receipt photo. Despite code for Android's direct-Downloads Java plugin being embedded, pressing **Summary → Save backup** still displayed **Android Share (Email/Alexa)**, not a saved file.

**ROOT CAUSE (source-confirmed):** The existing vanilla WebView JS used `CapNS.registerPlugin('FairpotDocument')` gated on `window.Capacitor.registerPlugin`. The injected Capacitor native WebView exposes its local Java plugins as `window.Capacitor.Plugins.FairpotDocument`; the `registerPlugin` export belongs to the separately imported `@capacitor/core` module and is not a safe assumption on the injected global. Therefore `AndroidSave` was null, and `exportBackup()` silently chose iOS native Share as fallback. This is a JS-to-native adapter defect, **not** an Android storage permissions problem.

**FIX:** In `www/index.html`, identify Android explicitly and use the native bridge's `CapNS.Plugins.FairpotDocument` with direct `saveToDownloads()`. If unavailable/rejected, show explicit **Backup was NOT saved** error and never use Share on Android. Keep iOS Share and browser download behavior unmodified. Native Java plugin still saves via MediaStore Downloads (Fire OS 8) or legacy Downloads (older Android). No chooser required: Fire OS previously failed with `ACTION_CREATE_DOCUMENT`; direct Downloads is the approved solution.

**REGRESSION GATE:** `build/test-android-backup.cjs` simulates real app JavaScript declarations + `exportBackup()` under native Android and iOS, asserting Android writes to Downloads, includes the receipt JPEG, never shares on missing/rejecting native plugin, never marks failed backup as saved, and preserves iOS Share. `build/android-build.sh` invokes the test before compilation; Android CI includes the test in trigger paths.

**NEXT FIRE HD 8 DEVICE TEST:** Wait for signed APK build and exact published build metadata to match; install new website APK **over current app** (same stable signing certificate; no uninstall). Confirm all restored records/photos remain. Then Summary → Save backup; it should show **Backup saved on this device / Downloads**, not Share. Verify new JSON file exists and can be read with the file manager. If native bridge unavailable, send the displayed explicit error; do not claim device success until verified.

**DATA PRESERVATION:** Do not uninstall the newly installed, persistent-signed app and do not delete separate backup file. This bug does not require a database or signing-key migration.

### Signed APK build and website release result — 2026-10-12
- Android Actions run **38310278448** at source SHA `f857c1999ef1f1f6d0c9c9fe20a97f066371f9e4` passed: 4 focused backup routing unit tests; full Gradle build; signed APK certificate check; GitHub artifact upload; successful result report.
- Persistent Android signing certificate SHA256 `b740db9061c90f02a42f781aa53809e88871327c5b7c89eef02b550ea539d126` matched the previous installed permanent-signed build 38307131967. This should permit in-place upgrade without uninstall; device install still must be tested.
- Artifact APK SHA256 `c371a50781d93086393947589a9117e465719c79520d92ba64484e4e1e793c0b`.
- Cuberoot publisher run **38310799644** passed, `downloads/fairpot-build.json` matches successful Android run, source, checksum and signer. GitHub Pages deployment run **38310847801** passed.
- The Fire HD 8 native `Save backup` fix is **NOT device-confirmed** until the user installs the new signed APK in-place, verifies existing restored expense/photo persist, taps Summary → Save backup, sees confirmed Downloads save (no Share), and checks the new JSON file actually exists.
