# InstaCA — mobile app

On-demand Chartered Accountant consultation marketplace (chat + audio calls only — no video),
plus fixed-price compliance filings. React Native 0.76 (bare, not Expo) + TypeScript strict.

The authoritative API/WS contract this app implements lives at `../docs/ARCHITECTURE.md`.
Endpoint paths, WS `type` strings, and payload field names all mirror that document exactly —
check there first if something looks off.

## Seeing it on your machine

This is a bare React Native app, so it needs a native build — there is no
browser version. `ios/` and `android/` are committed, so you do **not** need to
run `react-native init`.

**A rendered preview of every screen** lives at `../docs/screens-preview.html`
— open it in any browser to see the UI without building anything.

### iOS (fastest on a Mac)

Needs Xcode from the App Store, plus CocoaPods (`sudo gem install cocoapods`,
or `brew install cocoapods`).

```bash
cd app
npm install
cd ios && pod install && cd ..      # first run pulls the Agora SDK — a few minutes
npm run ios
```

### Android

Needs Android Studio and a running emulator (Device Manager → create a Pixel).

```bash
cd app
npm install
npm run android
```

### Pointing it at the backend

`src/config/env.ts` defaults to a backend on your own machine — `localhost:8080`
on iOS, `10.0.2.2:8080` on Android (an emulator cannot see the host's
localhost). Start the API first with `make run` in `../backend`, and the app
works with no configuration at all.

To point somewhere else, `cp .env.example .env` and set `API_BASE_URL` /
`WS_BASE_URL`. On iOS, react-native-config needs one extra build phase in Xcode
before `.env` values reach the app — see its README. Until you add it, the
localhost defaults above still apply, which is usually what you want in dev.

Sign in with any 10-digit number and the code `123456`.

### If the build fails

| Symptom | Fix |
|---|---|
| `pod install` fails on Apple Silicon | `cd ios && arch -x86_64 pod install`, or `bundle exec pod install` using the committed Gemfile |
| Metro serves a stale bundle | `npm start -- --reset-cache` |
| Android build can't find the SDK | Create `android/local.properties` with `sdk.dir=/Users/you/Library/Android/sdk` |
| App opens but every list is empty | The backend isn't running, or you're on a physical device where `localhost` isn't the Mac — set `API_BASE_URL` to your Mac's LAN IP |
| `Config.X` is undefined on iOS | The react-native-config build phase isn't added. Harmless in dev; the defaults cover it |

## Stack

- React Native 0.76.x, TypeScript (strict)
- `@react-navigation/native` v7 — native-stack + bottom-tabs
- `zustand` for client state, `@tanstack/react-query` v5 for server state
- `axios` with an auth-refresh interceptor (`src/api/client.ts`)
- A hand-rolled typed WebSocket client with reconnect/backoff + heartbeat (`src/ws/socket.ts`)
- `react-native-agora` (audio-only — video is never enabled anywhere in this app)
- `react-native-razorpay` for wallet top-ups and filing payments
- `react-native-document-picker` for document uploads
- `react-native-config` for environment configuration (no secrets in the repo)

## Project layout

```
src/
  api/         axios client + auth-refresh interceptor, REST endpoints split by domain, types.ts
  ws/          socket.ts (typed envelope, reconnect+backoff, heartbeat), events.ts
  store/       zustand: auth, consult (billing meter + incoming request), wallet, ca
  navigation/  RootNavigator, TabNavigator, per-tab stack navigators, types.ts
  screens/     auth/ consult/ filings/ chats/ wallet/ profile/ ca/
  components/  Button, Card, Money, RatingStars, StatusDot, Sheet, EmptyState, Skeleton,
               BillingMeter, DocPicker, Timeline, StepProgress, CaCard, Avatar, Chip, ...
  theme/       colors (light+dark tokens), typography, spacing, ThemeProvider
  hooks/       useConsultSocket, useBillingMeter, useDocumentUpload, useRazorpay
  utils/       money.ts (formatMoney + all paise math), date.ts, validation.ts, sha256.ts
```

## Getting started

```bash
cp .env.example .env      # fill in API_BASE_URL / WS_BASE_URL / AGORA_APP_ID / RAZORPAY_KEY_ID
npm install --legacy-peer-deps
npx tsc --noEmit          # typecheck
```

This repo was authored and typechecked in a sandbox without a real RN CLI project scaffold
(no `android/` or `ios/` native folders, no ability to run a simulator). To actually run it:

```bash
npx react-native init InstaCATmp --version 0.76.5   # or use this app's package.json as a base
# copy src/, App.tsx, index.js, app.json, babel.config.js, metro.config.js, .env(.example)
# over the generated android/ and ios/ folders, then:
npx pod-install ios       # iOS only
npm run android           # or: npm run ios
```

## Money — the one rule that matters

All money crossing the API boundary is an **int64 count of paise**. Never do float arithmetic
on a money value. `src/utils/money.ts` is the only place that formats money for display
(`formatMoney(paise) -> "₹1,234.50"`); every screen imports from there or from the `<Money>`
component rather than re-deriving rupee strings by hand.

CAs enter a **base** ₹/min rate; the client-facing **gross** rate (base × (1 + GST%)) is always
computed from that base, never edited directly — see `CaRatesScreen` and `IntakeSheet`.

## Chat & audio calls only — no video

`CallPanel` (`src/screens/consult/CallPanel.tsx`) is the only place `react-native-agora` is
touched. It explicitly calls `engine.disableVideo()` and `engine.enableLocalVideo(false)`, sets
a speech audio profile, and never mounts a video view of any kind. The billing meter shown
during a call is driven exclusively by `consult.tick` over the WebSocket
(`useBillingMeter` / `useConsultStore`) — never by the call's own clock, so a flaky RTC
connection can never desync billing from what the server has actually charged.

## Native modules — status in this sandbox

This app was built and typechecked in a sandboxed environment with no Android/iOS toolchains,
so native modules could not be linked, built, or run here — but `npm install` does resolve all
of their JS/TS packages, and `npx tsc --noEmit` passes clean against the *real* published
type definitions for every dependency but one:

- `react-native-agora`, `react-native-document-picker`, and `react-native-config` all ship
  their own accurate `.d.ts` files, resolved normally — nothing hand-written was needed for
  these.
- `react-native-razorpay` ships **no** TypeScript definitions at all (confirmed: no `.d.ts` in
  the package, no `types`/`typings` field in its `package.json`). `src/types/react-native-razorpay.d.ts`
  is a hand-written ambient declaration for the `RazorpayCheckout.open()` surface `useRazorpay`
  calls — it's the sole source of types for that module and will need updating if you upgrade
  the package and its call signature changes.

Before shipping to a device, follow each library's normal native setup:

- **Agora (`react-native-agora`)**: iOS needs microphone usage strings in `Info.plist` and (if
  you use CallKit/PushKit for background calls) the relevant capabilities; Android needs
  `RECORD_AUDIO`/`INTERNET`/`MODIFY_AUDIO_SETTINGS`/`BLUETOOTH` permissions in
  `AndroidManifest.xml`, and `minSdkVersion 21+`. No camera permission is required since video is
  never enabled.
- **Razorpay (`react-native-razorpay`)**: run `pod install` on iOS; on Android nothing extra is
  usually needed beyond the standard autolinking, but confirm the checkout activity is declared
  if you're on an older RN bridge.
- **Document picker (`react-native-document-picker`)**: iOS needs the appropriate
  `NSPhotoLibraryUsageDescription`/document-provider entitlements if you enable iCloud sources;
  Android needs no runtime permission for the SAF-based picker on modern Android versions.
- All three are autolinked by the RN CLI — after copying into a real RN project, `pod install`
  (iOS) is normally the only manual step required.

## Document integrity note

`sha256Hex` in `src/utils/sha256.ts` is a small dependency-free SHA-256 implementation, but
`useDocumentUpload` currently hashes a stable *metadata* string (uri/name/size/timestamp), not
the file's actual bytes — reading raw file bytes off disk needs a library like
`react-native-fs`/`react-native-blob-util`, which isn't in this app's dependency list. Swap in a
real streaming file hash before relying on `/v1/documents/{id}/complete`'s integrity check in
production.

## What isn't wired up

- Push notifications (for e.g. incoming consult requests when the app is backgrounded) are out
  of scope here — the incoming-request card (`IncomingRequestScreen`) only fires while the app
  has a live WebSocket connection.
- Payout history has no corresponding `GET` endpoint in the architecture doc, so
  `CaEarningsScreen` shows the earnings ledger (which the doc does specify) plus an honest empty
  state for payouts rather than inventing an endpoint.
