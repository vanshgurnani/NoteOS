# NOTE OS PWA service

This is a separate Node 20+ Render web service. It reverse-proxies the existing NOTE OS Next.js frontend and adds PWA metadata and a same-origin service worker at the edge.

## Why a proxy service?
The existing `frontend/` and `backend/` directories remain unchanged. The PWA service presents the existing frontend under its own HTTPS origin, injects the web manifest and service-worker registration into HTML responses, and forwards application requests to the existing frontend. The frontend continues to use its existing backend configuration.

## Render
The root `render.yaml` adds `noteos-pwa`:
- Root directory: `pwa`
- Runtime: Node
- Start command: `npm start`
- `UPSTREAM_FRONTEND`: linked to the `noteos-frontend` Render service host.

Use the PWA service's `*.onrender.com` URL as the public install URL. Keep the existing frontend and backend services running.

## PWA endpoints
- `/manifest.webmanifest`
- `/sw.js`
- `/offline.html`
- `/icons/noteos.svg`

The service worker only supplies a generic offline navigation page. It deliberately does not cache authenticated responses, API routes, OAuth routes, notes, or workspace data.

## Production validation
1. Verify the Render PWA service deploys and `/manifest.webmanifest` returns JSON.
2. Verify `/sw.js` returns JavaScript with `Service-Worker-Allowed: /`.
3. Test login, logout, cookies, redirects, OAuth/MCP endpoints, uploads, and note CRUD through the PWA URL.
4. Confirm the backend CORS policy allows the PWA origin. The current blueprint's CORS regex is broad; if you tighten it later, add the PWA origin.
5. Confirm absolute frontend URLs and OAuth redirect allowlists accept the PWA hostname.
6. Test Add to Home Screen in Safari on a real iPhone.

The proxy must be validated for auth/session behavior before production use. This first version does not configure Web Push or cache private notes.
