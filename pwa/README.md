# NOTE OS PWA package

This directory contains the isolated PWA implementation for the existing NOTE OS application.

## Repository facts verified
- Frontend: `frontend/` — Next.js App Router, Next.js 14.2.35, React 18.
- Backend: `backend/` — FastAPI service.
- Existing frontend metadata: `frontend/app/layout.tsx`.
- Existing API client and backend remain the source of truth for authentication and note data.

## Non-invasive boundary
No files under `frontend/` or `backend/` are changed by this branch's PWA scaffold. The PWA files are kept here for review. This means the current deployed application is **not yet installable as a PWA** until the explicit integration steps below are approved and applied.

## Contents
- `manifest.webmanifest` — application identity and install metadata.
- `sw.js` — conservative service worker; does not cache API/authenticated data.
- `offline.html` — generic offline fallback, not a cached notes view.
- `icons/noteos.svg` — source brand icon.
- `integration/metadata.example.ts` — metadata to merge into the existing root layout.
- `integration/register-service-worker.example.tsx` — client registration component.

## Integration (separate, deliberate step)
When ready to activate the PWA, copy:
1. `pwa/manifest.webmanifest` to `frontend/public/manifest.webmanifest`.
2. `pwa/sw.js` to `frontend/public/sw.js`.
3. `pwa/offline.html` to `frontend/public/offline.html`.
4. `pwa/icons/noteos.svg` to `frontend/public/icons/noteos.svg`.

Then merge the metadata from `integration/metadata.example.ts` into the existing `frontend/app/layout.tsx`, and mount the registration component from `integration/register-service-worker.example.tsx` in the root layout. Do not replace the existing layout or metadata.

After integration, verify the production origin is HTTPS and test Safari Add to Home Screen on an actual iPhone. This scaffold deliberately does not add push notifications yet; Web Push needs a server-side subscription endpoint, VAPID keys, persistence, permission UX, and an explicit product decision about reminder behavior.

## Safety
The service worker intentionally excludes `/api/`, `/auth/`, `/notes`, and all cross-origin requests from caching. It must not cache JWTs, session responses, note contents, or private user data.
