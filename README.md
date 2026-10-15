## Fairpot Android branch — current status (2026-10-15)

This `android` branch holds the Android/Fire HD 8 native wrapper and **permanent signing** path, separate from the iOS/TestFlight `main`. The private signed APK and Cuberoot publication were verified in the Android migration notes; restored expense/photo data had a user-confirmed device pass. The later **Save backup to Downloads** correction still requires explicit post-update device acceptance before being called PASS. See `ANDROID-PLAN.md`. Never treat a signed build as a verified on-device restore or change the old `willyros01/split` personal app. Code and builds are frozen pending explicit owner approval; documentation-only maintenance is permitted.

---

# Fairpot

Split shared expenses on your phone — any currency, no account, no cloud.

Built with Capacitor from Split It v5.0; data in SQLite on the device.
The iOS app is built by GitHub Actions (build/ios-build.sh) and delivered to TestFlight.
See HANDOVER.md for setup, STORE-LISTING.md for the App Store text, privacy.html for the policy.
