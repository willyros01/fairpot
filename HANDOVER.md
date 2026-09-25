# Fairpot v0.4.0 — handover

Fairpot is the public iOS app made from Split It v5.0. v0.4.0 contains everything planned
before testing: multi-currency, a real SQLite database with commit/rollback (photos included),
native sharing and backups, launch screen, privacy policy and store listing text.

The app is built in the cloud by GitHub Actions and delivered to TestFlight. No Xcode is
needed on any of Willy's devices.

---

## IMPORTANT — do not touch the Split It repo

- **willyros01/split** is Willy's live personal web app. **Never change or upload to it.**
- Fairpot lives only in **willyros01/fairpot** (public).

---

## Step 1 — Upload the files

Upload everything in this zip to the **root** of willyros01/fairpot (select all, drag onto
"Add file → Upload files", commit). It replaces files with the same names:

```
index.html              (opens the test page from willyros01.github.io/fairpot/)
privacy.html            (the public privacy policy page)
www/index.html          (the app)
resources/icon.png, resources/splash.png
build/ios-build.sh      (everything the iOS build does)
build/github-workflow.yml
package.json, capacitor.config.json
HANDOVER.md, NOTES.txt, README.md, STORE-LISTING.md
```

There are no hidden files in this zip.

## Step 2 — One-time: update the workflow

The workflow file already in the repo is **.github/workflows/iOS-testflight.yml**. Replace its
contents with **build/github-workflow.yml** once:

1. On github.com open willyros01/fairpot → **build/github-workflow.yml** → select all the text
   (or use the "Copy raw file" button) and copy it.
2. Open **.github/workflows/iOS-testflight.yml** → pencil icon (**Edit**) → select all → paste
   → **Commit changes**.

After this, all future build changes happen in **build/ios-build.sh**, a normal visible file.

## Step 3 — Apple: register the app's ID (after enrollment is approved)

developer.apple.com → Account → **Certificates, Identifiers & Profiles** → **Identifiers** → **+**
→ App IDs → App → Description **Fairpot**, Bundle ID **Explicit**: **io.github.willyros01.fairpot**.

## Step 4 — Apple: create the app in App Store Connect

appstoreconnect.apple.com → Apps → **+** → New App: iOS, name **Fairpot**
(if taken: **Fairpot – Split Expenses**), English (Canada), bundle ID above, SKU **fairpot**.

## Step 5 — Apple: API key, then the four GitHub secrets

App Store Connect → Users and Access → Integrations → App Store Connect API → Team Keys → **+**,
access **Admin**. Download the .p8 (only once). Note the **Key ID** and **Issuer ID**.
Team ID: developer.apple.com → Account → Membership details.

willyros01/fairpot → Settings → Secrets and variables → Actions → New repository secret:

| Secret | Value |
|---|---|
| ASC_KEY_ID | the Key ID |
| ASC_ISSUER_ID | the Issuer ID |
| ASC_KEY_P8 | the whole text of the .p8 file, including BEGIN and END lines |
| APPLE_TEAM_ID | the Team ID |

## Step 6 — Run the build

Repo → **Actions** → **iOS build to TestFlight** → **Run workflow**. About 20–30 minutes, then
5–30 minutes of Apple processing. Every later push that changes the app builds automatically.

## Step 7 — TestFlight

1. App Store Connect → TestFlight → the build shows **Missing Compliance** → **Manage** → answer
   the encryption questions (see STORE-LISTING.md; Claude will help with the exact answers).
2. Internal Testing → create a group, add Willy's Apple account, turn on automatic distribution.
3. Install **TestFlight** on the iPad and iPhone, accept the invite, **Install**.

---

## If the build fails

| Message contains | Fix |
|---|---|
| runner label / "macos-26" not found | In the workflow, change runs-on to **macos-15** |
| "No Account for Team" / not authorized / signing | API key must have **Admin** access; check APPLE_TEAM_ID |
| "No suitable application records were found" | Do step 4 with the exact bundle ID |
| "bundle version must be higher" | Run the workflow again |
| anything about CapacitorSQLite / SQLCipher / packages | Send Claude the log (or a screenshot) |

---

## What to test on the phone (one pass)

1. Add expenses in two or three currencies, with and without receipt photos. Close the app fully
   (swipe it away) and reopen — everything must still be there.
2. Edit an expense: change a photo, remove a receipt line. Delete an expense.
3. Share a split with photos to Messages; save a backup to Files; load it back.
4. Load your Split It web-app backup (Summary → Load backup).
5. Summary: change home currency, add a payment method and a category.
6. Turn on Airplane Mode and add an expense (rates fall back to the last download).
