# Urveya release checklist

Updated: 2026-08-28

## Automated gate

Run from `mobile` before every preview or production build:

```powershell
npm run release:check
```

The command runs TypeScript, all Jest tests, validates Expo/EAS configuration, checks required assets and legal pages, rejects legacy Render dependencies, and validates all 51 local city packages and 1,836 itinerary plans.

Latest automated gate (2026-08-29): 324/324 tests passed, content audit with 0 errors and 0 warnings. The strict preflight now intentionally blocks publication while temporary legal URLs remain.

For a non-blocking status report while content work is in progress:

```powershell
npm run preflight
```

## Current blockers

- [x] Add French descriptions for 68 neighborhoods across 17 cities.
- [x] Add Spanish descriptions for the same 68 neighborhoods.
- [x] Add dedicated OAuth callback and password-recovery deep-link routes.
- [x] Verify the static web export includes all four legal pages and authentication routes.
- [x] Link the repository to Expo project `35fadf8a-85b3-430d-86b7-01f6adf9f8c5`.
- [x] Deploy the legal pages on `https://urveya-legal.onrender.com` with public routes for privacy, terms, account deletion, and support.
- [x] Configure the monitored support and privacy mailbox `wayrapp01@gmail.com`.
- [x] Final product name selected: `Urveya`; preliminary exact-name trademark screening completed.
- [ ] Complete a professional similarity search before filing the `Urveya` trademark.
- [x] Configure a monitored support mailbox. A custom Urveya domain is recommended later but is not required for the first release.
- [ ] Generate and install the `preview` APK on the Android emulator.
- [ ] Install `expo-store-review` and connect the prepared review eligibility rule to the native prompt (the current terminal could not reach npm).
- [x] Remove inactive Sentry runtime and align privacy declarations with zero crash/diagnostic collection.

## Android

- [x] Application ID: `com.urveya.app`.
- [x] Production profile creates an Android App Bundle (`.aab`).
- [x] Native build number auto-increments in production.
- [x] App icon and adaptive foreground are 1024x1024.
- [x] Location is the only explicitly required sensitive capability.
- [x] Expo SDK 54 targets Android 16 / API level 36, required for new submissions from 2026-08-31.
- [x] Legacy Android storage permissions are explicitly blocked.
- [ ] Create the app in Google Play Console with the exact application ID.
- [ ] Complete store listing, data safety, content rating, target audience, ads declaration, app access, and privacy policy URL.
- [ ] Upload the first AAB to Internal testing.
- [ ] If the personal account was created after 2023-11-13, complete a closed test with at least 12 opted-in testers for 14 continuous days before applying for production access.

Build after EAS initialization:

```powershell
npx eas-cli@latest build --platform android --profile production
```

## iOS

- [x] Bundle identifier: `com.urveya.app`.
- [x] Apple Sign In capability is declared.
- [x] Location permission has a purpose string.
- [x] Unused photo-library permission declarations were removed.
- [x] Privacy manifest declares account and crash data without tracking.
- [ ] Enroll in the Apple Developer Program.
- [ ] Create the matching app in App Store Connect.
- [ ] Complete app metadata, screenshots, support URL, privacy URL, age rating, and App Privacy answers.
- [ ] Provide review notes and a test account if the reviewer needs to inspect signed-in synchronization.

Build after EAS initialization:

```powershell
npx eas-cli@latest build --platform ios --profile production
```

## Device verification

These checks remain intentionally pending until a physical-device session:

- [ ] Fresh install and contextual help mode from the question-mark button.
- [ ] Generation and manual creation online and offline.
- [ ] All four languages and system font scaling.
- [ ] Location denied, allowed, unavailable, and outside the destination.
- [ ] Map failure without connectivity.
- [ ] Account creation, login, logout, synchronization, and deletion.
- [ ] PDF preview, export, sharing, and app resume.
- [ ] Background/foreground transitions and process restart.
