# PWA install testing

## Assets

| File | Purpose |
|------|---------|
| `/icons/icon-192.png` | Manifest icon (maskable) |
| `/icons/icon-512.png` | Manifest / splash source |
| `/icons/apple-touch-icon.png` | iOS home screen (180×180) |
| `/icons/splash-1170x2532.png` | iPhone startup image (reference) |

Regenerate icons: `npm run icons:generate` (requires `sharp`).

## Android (Chrome)

1. Serve over **HTTPS** (or `localhost`).
2. Open the app in Chrome → menu → **Install app**, or wait for the in-app install banner.
3. Confirm `beforeinstallprompt` fires: the install card should offer an **Install** button.
4. After install, launch from the home screen; `display-mode: standalone` should apply.

## iOS (Safari)

1. Open the site in **Safari** (not Chrome on iOS).
2. **Share** → **Add to Home Screen**.
3. The install hint banner explains these steps when Safari does not fire `beforeinstallprompt`.
4. Verify `apple-touch-icon` on the home screen and safe-area padding when launched standalone.

## Checklist

- [ ] Manifest loads (`/manifest.webmanifest` or generated manifest)
- [ ] Icons return 200 for 192 and 512
- [ ] Standalone mode hides browser chrome
- [ ] Primary buttons feel ≥ 44px tap targets
- [ ] Fixed bottom nav stays above keyboard when editing inputs
