# Manual QA — mobile devices

Use this checklist on **real hardware** (iOS Safari, Android Chrome). Run against local tunnel or staging URL.

## Setup

- [ ] App loads over HTTPS (required for PWA / OAuth on device)
- [ ] Supabase redirect URLs include test origin
- [ ] Test account signed in

## Install & shell

- [ ] **Add to Home Screen** (iOS) or **Install app** (Android) — see [pwa-install-testing.md](./pwa-install-testing.md)
- [ ] Standalone mode: no browser chrome, status bar theme correct
- [ ] Safe areas respected (notch, home indicator) on header and bottom nav
- [ ] Bottom nav tappable targets feel comfortable (≥ 44px)

## Auth

- [ ] Email OTP: receive code, sign in, land on dashboard
- [ ] Google / Apple OAuth completes and syncs profile
- [ ] Sign out from Profile → login screen
- [ ] Opening `/dashboard` while signed out redirects to login

## Dashboard

- [ ] Greeting and stats load
- [ ] Body composition section renders (or empty state)
- [ ] Slide-to-start-workout reaches new workout page
- [ ] Pull-to-refresh / revisit shows updated streak

## Workout flow

Follow [workout-logging-flow.md](./workout-logging-flow.md):

- [ ] Start → add exercise → log set → finish → appears in history
- [ ] Pause / resume timer
- [ ] Rest timer bar dismisses
- [ ] Reload mid-workout → resume banner or active session restored

## Progress & profile

- [ ] Progress tabs load charts (or empty states)
- [ ] Date range filter changes data
- [ ] Log body measurement saves and shows in history
- [ ] Profile edit saves; avatar upload works

## Keyboard & inputs

- [ ] Number inputs for sets open numeric keyboard
- [ ] Layout does not jump excessively when keyboard opens (iOS)
- [ ] OTP inputs accept paste / autofill where supported

## Offline / flaky network

- [ ] Complete workout offline → queues and syncs when online
- [ ] DB unavailable banner shows when Postgres unreachable

## Sign-off

| Device | OS / browser | Tester | Date | Pass |
|--------|----------------|--------|------|------|
| | | | | |

Notes:
