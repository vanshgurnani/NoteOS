# NOTE OS Progressive Web App

The existing Next.js frontend is the PWA. There is no separate proxy service or second app URL.

## Install

- **iPhone/iPad:** Open the production NOTE OS frontend URL in Safari, tap Share, choose **Add to Home Screen**, then tap Add.
- **Android:** Open the same URL in Chrome, open the menu, and choose **Install app** (or **Add to Home screen**).

## Implementation

- `public/manifest.webmanifest` supplies the install metadata.
- `public/sw.js` registers a same-origin service worker.
- `public/offline.html` is a generic network-failure screen.
- `public/icons/noteos.svg` is the app icon.
- `app/layout.tsx` supplies the manifest, Apple web-app metadata, viewport and theme color.

The service worker intentionally does not cache API responses, authentication, private notes, or workspace data. Offline mode is a safe fallback screen, not offline note editing.

## Deployment

The Render frontend service already builds from `frontend/`; no extra PWA service is required. Deploy the `feature/pwa` branch to preview the changes, then merge after testing.

## Mobile checks

Test the workspace sidebar, note editor, tables, chat, settings, login/register, dialogs, and keyboard behavior on narrow phone screens and tablet widths.
