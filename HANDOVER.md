# Fairpot v0.1.0 — handover

Fairpot is the public iOS app made from Split It v5.0. This package is **Phase 1** of the
design ("Split It — Public App Design", v1.1): the web code with all Firebase and cloud
sync removed, wrapped as a Capacitor 8 app, with a GitHub Actions workflow that builds
the iOS app in the cloud and uploads it to TestFlight. No Xcode is needed on any of
Willy's devices.

---

## IMPORTANT — do not touch the Split It repo

- **willyros01/split** is Willy's live personal web app. **Do not change, overwrite or
  upload anything to it.**
- Fairpot goes into a **brand-new repo**: **willyros01/fairpot** (public — public repos
  get unlimited free build minutes on GitHub's Mac machines, and the app holds no secrets).

---

## Step 1 — Create the repo and upload these files

1. Create a new **public** repository **willyros01/fairpot**, default branch **main**.
2. Upload every file from this zip to the **root** of the repo, keeping the folders exactly:

```
.github/workflows/ios-testflight.yml   <- hidden folder: make sure it is uploaded
.gitignore                             <- hidden file: make sure it is uploaded
capacitor.config.json
package.json
resources/icon.png
www/index.html
HANDOVER.md
NOTES.txt
README.md
```

3. Do **not** add an ios/ or android/ folder. The workflow generates the iOS project
   fresh on every build, on purpose.

The first push starts the workflow, which will **skip itself** with a notice
("Build skipped — the four Apple secrets are not set yet"). That is expected.

---

## Step 2 — Apple: register the app's ID (after the developer enrollment is approved)

At developer.apple.com → Account → **Certificates, Identifiers & Profiles** → **Identifiers** → **+**:

- Type: **App IDs** → **App**
- Description: **Fairpot**
- Bundle ID: **Explicit** → **io.github.willyros01.fairpot**
- Capabilities: leave the defaults. Register.

## Step 3 — Apple: create the app in App Store Connect

appstoreconnect.apple.com → **Apps** → **+** → **New App**:

- Platform: **iOS**
- Name: **Fairpot** (if taken, try **Fairpot – Split Expenses**)
- Primary language: **English (Canada)**
- Bundle ID: **io.github.willyros01.fairpot**
- SKU: **fairpot**
- User access: Full access

## Step 4 — Apple: create the API key the cloud build uses

appstoreconnect.apple.com → **Users and Access** → **Integrations** → **App Store Connect API**
→ **Team Keys** → **+**:

- Name: **GitHub Fairpot build**
- Access: **Admin** (needed so the build can create signing certificates automatically)
- Download the **.p8** file — Apple only lets you download it **once**.
- Note the **Key ID** (shown in the key's row) and the **Issuer ID** (shown above the list).

Team ID: developer.apple.com → **Account** → **Membership details** → **Team ID**.

## Step 5 — Add the four secrets to the GitHub repo

willyros01/fairpot → **Settings** → **Secrets and variables** → **Actions** →
**New repository secret**, four times:

| Secret name     | Value                                                                 |
|-----------------|-----------------------------------------------------------------------|
| ASC_KEY_ID      | the Key ID from step 4                                                |
| ASC_ISSUER_ID   | the Issuer ID from step 4                                             |
| ASC_KEY_P8      | the **whole text** of the .p8 file, including the BEGIN and END lines |
| APPLE_TEAM_ID   | the Team ID                                                           |

Never commit the .p8 file to the repo (the .gitignore blocks it).

## Step 6 — Run the first build

Repo → **Actions** → **iOS build to TestFlight** → **Run workflow** (branch main).
It takes about 15–25 minutes. When it finishes, Apple processes the build for another
5–30 minutes, then it appears in App Store Connect → **TestFlight**.

After this, **every push to main** that changes the app builds and uploads automatically.

## Step 7 — Install on the iPad

1. App Store Connect → TestFlight → **Internal Testing** → create a group → add Willy's
   Apple account as a tester → add the build.
2. On the iPad (and iPhone), install **TestFlight** from the App Store, accept the invite,
   tap **Install**. New builds then show up in TestFlight with an **Update** button.

---

## If the build fails

| Message contains                                   | Fix                                                                       |
|----------------------------------------------------|---------------------------------------------------------------------------|
| runner label / "macos-26" not found                | In the workflow, change runs-on to **macos-15**                           |
| "No Account for Team" / "not authorized" / signing | API key must have **Admin** access; check APPLE_TEAM_ID                  |
| "No suitable application records were found"       | Do step 3 (create the app in App Store Connect) with the exact bundle ID |
| "bundle version must be higher"                    | Just run the workflow again — the build number rises every run           |
| Capacitor needs a newer Xcode                      | The workflow already selects the newest Xcode; use a newer macOS runner   |

---

## What Phase 1 does and does not do yet

**Done:** Firebase scripts, cloud-sync card, sync window, sync code and service worker removed;
app renamed Fairpot; pinch-zoom allowed; the required "Rates By Exchange Rate API" credit link
added; the Firestore 1 MB photo-size checks removed; web-app (Split It) backups still load;
simple placeholder icon; camera and photo-library permission text; encryption answered
("standard HTTPS only") so TestFlight doesn't ask each upload.

**Not yet (later phases of the design):**
- Phase 2 — multi-currency with a home-currency setting (default C$) and a general
  payment-methods list. Still pesos to C$ only for now.
- Phase 3 — SQLite storage and receipt photos as files, native camera and share plugins.
  For now data is still in the app's browser storage, so **back up regularly**, and
  Share / Save backup may fall back to "copy to clipboard" inside the app.
- Phase 4 — new backup format (web backups already import).
- Phase 5 — final icon, launch screen, Apple privacy manifest, privacy policy page,
  store listing and screenshots, Android build (deferred until testers are lined up).
