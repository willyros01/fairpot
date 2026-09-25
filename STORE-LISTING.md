# Fairpot — App Store listing and answers

Everything App Store Connect asks for, ready to copy. Character limits are Apple's.

---

## App information

| Field | Value |
|---|---|
| Name (30) | **Fairpot** — if taken: **Fairpot – Split Expenses** |
| Subtitle (30) | **Split bills in any currency** |
| Bundle ID | io.github.willyros01.fairpot |
| SKU | fairpot |
| Primary category | **Finance** |
| Secondary category | Travel |
| Content rights | Does not contain third-party content |
| Age rating | Answer **None / No** to every question → **4+** |

## URLs

| Field | Value |
|---|---|
| Privacy Policy URL | https://willyros01.github.io/fairpot/privacy.html |
| Support URL | https://github.com/willyros01/fairpot/issues |
| Marketing URL (optional) | https://willyros01.github.io/fairpot/ |

## Promotional text (170)

Split a dinner, a trip or a round of drinks in seconds — in any currency, with totals in yours. No account, no ads, and everything stays on your phone.

## Description (4000)

Fairpot makes splitting shared costs quick and fair.

Add an expense, enter the receipts, choose how many people are sharing, and Fairpot shows exactly what each person owes — in the currency you paid and in your home currency.

• ANY CURRENCY — pesos, dollars, euros, yen and 160+ more. Rates update daily and are locked in when you save, so old expenses never change. Paid with a card at a different rate? Type your own.

• SHARE IN ONE TAP — send a clear summary by Messages, WhatsApp or email, with your payment details (e-Transfer, GCash, PayPal, Wise or any other) and receipt photos if you like.

• RECEIPT PHOTOS — snap the receipt and keep it with the expense.

• SUMMARIES — totals by month, year and category, all in your home currency.

• PRIVATE BY DESIGN — no account, no sign-in, no ads, no tracking. Your data stays on your phone in a real database, and you can save a backup to Files or iCloud Drive whenever you want.

## Keywords (100)

split,bill,expense,splitter,trip,travel,currency,converter,receipt,share,group,dinner,owe,peso

## What's New (first version)

First release.

## App Review information

- Sign-in required: **No**
- Notes for the reviewer:
  > Fairpot needs no account. Tap New, enter a description and an amount, tap Save. Tap the currency
  > button to choose another currency; the rate can be tapped to type your own. History shows saved
  > expenses (Share, Edit, Delete). Summary has totals, the home-currency setting, payment methods,
  > categories and backup/restore. The only network use is a daily public exchange-rate download.

---

## App Privacy ("nutrition label")

- Do you or your third-party partners collect data from this app? **No**
- Result shown on the store: **Data Not Collected**

---

## Export compliance (encryption) — needs your decision

The SQLite component (@capacitor-community/sqlite) always includes an encryption library
(SQLCipher), even though **Fairpot's database is not encrypted** and Fairpot uses no encryption of
its own beyond standard HTTPS.

For **TestFlight testing**, App Store Connect shows **"Missing Compliance"** on each new build.
Tap **Manage** and answer. Claude will walk through the exact answers with you on the first build;
once confirmed, one line in build/ios-build.sh records the answer so it stops asking.

Before public release, confirm whether the app qualifies as exempt or needs Apple's
"uses encryption / mass-market" answer and the yearly self-classification report. This note is not
legal advice. If in doubt, Apple's export compliance pages and developer support are the authority.

---

## Screenshots needed

- iPhone 6.9" display (e.g. iPhone 16 Pro Max): 3–10 screenshots, 1320 × 2868
- iPad 13" display (only if the iPad version is offered): 2064 × 2752

Suggested set: New expense with a peso total, currency picker, History, Summary, Share preview.
Screenshots can be taken from the TestFlight build on your phone (side button + volume up).
