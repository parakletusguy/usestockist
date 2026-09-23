# Restore mobile rendering

## Goal
Make the installed and browser versions of Stockist recover from an outdated mobile app cache instead of showing a blank screen.

## Changes
- Strengthen the app update settings so a newly published version replaces old cached files immediately.
- Remove obsolete app caches while preserving offline support.
- Add a safe one-time recovery when the browser reports a stale app-file loading failure.
- Keep the existing mobile layout and inventory behavior unchanged.

## Verification
- Confirm the app compiles successfully.
- Open both the preview and published site at a 411 × 726 mobile viewport.
- Confirm the sign-in screen renders and no failed requests or page errors occur.
