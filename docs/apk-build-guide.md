# APK Build Guide

## Prerequisites

1. **Expo Account** — [expo.dev](https://expo.dev)
2. **EAS CLI** — `npm install -g eas-cli`
3. **Login** — `eas login`

## Setup EAS

```bash
cd client
eas build:configure
```

This creates `eas.json`. Use this config:

```json
{
  "cli": { "version": ">= 7.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "android": { "buildType": "apk" }
    },
    "production": {
      "android": { "buildType": "app-bundle" }
    }
  }
}
```

## Update API URL

Edit `client/src/utils/constants.js`:
```js
export const API_BASE_URL = 'https://your-deployed-api.com/api';
```

## Build APK (Preview)

```bash
cd client
eas build -p android --profile preview
```

- Build runs in EAS cloud (~10–15 min)
- Download APK from the link printed in terminal
- Or visit: https://expo.dev/accounts/[user]/projects/university-appointment-app/builds

## Install on Device

```bash
# Via ADB
adb install university-appointment.apk

# Or scan QR from EAS dashboard
```

## Local Build (Advanced)

Requires Android SDK + Java 17:

```bash
cd client
npx expo run:android --variant release
# APK: android/app/build/outputs/apk/release/app-release.apk
```

## App Icon & Splash

Replace:
- `client/src/assets/images/icon.png` (1024×1024)
- `client/src/assets/images/splash.png` (1284×2778)
- `client/src/assets/images/adaptive-icon.png` (1024×1024)
