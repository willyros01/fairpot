## Platform/release status — 2026-10-15 (documentation only)

Fairpot is the current iOS/Capacitor, device-local SQLite successor to the legacy `willyros01/split` personal web application. `main` is the iOS/TestFlight baseline; app review/approval is **not implied by a successful TestFlight build**. External TestFlight approval has been under monitoring but is not established by this branch's documentation. Retain the current iOS signing/workflow and local data model.

Android Fire HD 8 native adapters, permanent APK signing, restore and Downloads backup verification are maintained separately on `fairpot/android`, with evidence and remaining tests in its `ANDROID-PLAN.md`. **Do not modify `split/main` or merge native Android changes to `main` automatically.** Device-local Fairpot data, receipts and signing key must be backed up before an uninstall or signing-key migration. Owner's development freeze remains in force; docs edits are not authorization to build.

---

# Fairpot

Split shared expenses on your phone — any currency, no account, no cloud.

Built with Capacitor from Split It v5.0; data in SQLite on the device.
The iOS app is built by GitHub Actions (build/ios-build.sh) and delivered to TestFlight.
See HANDOVER.md for setup, STORE-LISTING.md for the App Store text, privacy.html for the policy.
