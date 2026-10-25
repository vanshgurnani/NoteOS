# NOTE OS — Vercel production migration

This branch prepares NOTE OS to move its web frontend, FastAPI API, and invitation mailer from Render to Vercel. It does **not** change the existing Render services or production DNS. Keep Render running until the Vercel deployment passes the cutover checklist.

## Deployment topology

Create three Vercel projects from this repository. Each project uses the same Git repository but a different **Root Directory**:

| Project | Root Directory | Framework / Runtime | Purpose |
| --- | --- | --- | --- |
| `noteos-web` | `frontend` | Next.js | Main application and same-origin API/MCP proxy |
| `noteos-api` | `backend` | Python / FastAPI | REST API, auth, OAuth 2.1, MCP, RAG and chat |
| `noteos-mailer` | `mailer` | Node.js | Invitation email endpoint |

Deploy the API first, then the frontend and mailer. Use the actual Vercel production URLs in environment variables; do not assume project slugs or domains.

## 1. Backend project (`backend`)

- Framework preset: Other / Python auto-detection (Vercel should detect FastAPI from `index.py` and `requirements.txt`).
- Root directory: `backend`.
- No Dockerfile or Uvicorn start command is used on Vercel.
- `index.py` exports the existing `app.main:app` application.

Required environment variables:

| Variable | Value |
| --- | --- |
| `MONGO_URI` | Existing production MongoDB Atlas connection string |
| `MONGO_DB` | `noteform` (preserve the current database name) |
| `JWT_SECRET` | Reuse the existing production signing secret during cutover so existing sessions/tokens remain valid; rotate separately if desired |
| `GOOGLE_CLIENT_ID` | Existing Google OAuth Web Client ID |
| `CORS_ORIGINS` | Exact Vercel frontend production origin, plus any approved custom domain |
| `CORS_ORIGIN_REGEX` | Set an anchored regex matching only your Vercel frontend/custom domain, e.g. `^https://(noteos-web\\.vercel\\.app|notes\\.example\\.com)# NOTE OS — Vercel production migration

This branch prepares NOTE OS to move its web frontend, FastAPI API, and invitation mailer from Render to Vercel. It does **not** change the existing Render services or production DNS. Keep Render running until the Vercel deployment passes the cutover checklist.

## Deployment topology

Create three Vercel projects from this repository. Each project uses the same Git repository but a different **Root Directory**:

| Project | Root Directory | Framework / Runtime | Purpose |
| --- | --- | --- | --- |
| `noteos-web` | `frontend` | Next.js | Main application and same-origin API/MCP proxy |
| `noteos-api` | `backend` | Python / FastAPI | REST API, auth, OAuth 2.1, MCP, RAG and chat |
| `noteos-mailer` | `mailer` | Node.js | Invitation email endpoint |

Deploy the API first, then the frontend and mailer. Use the actual Vercel production URLs in environment variables; do not assume project slugs or domains.

## 1. Backend project (`backend`)

- Framework preset: Other / Python auto-detection (Vercel should detect FastAPI from `index.py` and `requirements.txt`).
- Root directory: `backend`.
- No Dockerfile or Uvicorn start command is used on Vercel.
- `index.py` exports the existing `app.main:app` application.

Required environment variables:

| Variable | Value |
| --- | --- |
| `MONGO_URI` | Existing production MongoDB Atlas connection string |
| `MONGO_DB` | `noteform` (preserve the current database name) |
| `JWT_SECRET` | Reuse the existing production signing secret during cutover so existing sessions/tokens remain valid; rotate separately if desired |
| `GOOGLE_CLIENT_ID` | Existing Google OAuth Web Client ID |
| `CORS_ORIGINS` | Exact Vercel frontend production origin, plus any approved custom domain |
 |
| `MCP_PUBLIC_URL` | `https://<API-PROJECT-DOMAIN>/mcp` if MCP points directly to the API |
| `APP_URL` | `https://<FRONTEND-PROJECT-DOMAIN>` |
| `MAILER_API_URL` | `https://<MAILER-PROJECT-DOMAIN>/api/v1/email/invitations` |
| `MAILER_API_KEY` | A newly generated high-entropy shared secret, configured identically in API and mailer projects |
| `GEMINI_API_KEY`, `GROQ_API_KEY` | Optional provider keys, if used globally |
| `LLAMA_GATEWAY_URL`, `LLAMA_GATEWAY_MODEL`, `LLAMA_GATEWAY_API_KEY` | Preserve only if the external gateway is still used |

Do not put secrets in Git. Copy existing values securely from the current Render environment into Vercel's encrypted environment-variable settings.

## 2. Frontend project (`frontend`)

- Framework preset: Next.js.
- Root directory: `frontend`.
- Build command/output: use Vercel's Next.js defaults.
- `NEXT_PUBLIC_API_URL`: **leave unset** in production so browser requests use the same-origin `/api/proxy` route. This avoids exposing a separate backend URL in the browser and keeps cookies/auth behavior same-origin.
- `INTERNAL_API_URL`: `https://<API-PROJECT-DOMAIN>` (server-side only).
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: existing Google OAuth Web Client ID.

The frontend proxy forwards API requests to `INTERNAL_API_URL`. OAuth discovery rewrites must use that same backend URL. The MCP endpoint can be advertised as the API project's `/mcp` URL; the frontend `/mcp` proxy is also available for same-origin routing, but should only be used if its request/response behavior is verified with the target MCP client.

## 3. Mailer project (`mailer`)

- Framework preset: Other / Node.js.
- Root directory: `mailer`.
- Install/build: `npm install` and the existing `vercel-build` script.
- Configure `MAILER_API_KEY`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`, and `FRONTEND_URL` in Vercel.
- `SMTP_PASSWORD` must be a provider-specific app password/token, not a normal account password.
- Test actual outbound email delivery from the Vercel deployment before switching invitation traffic. Do not assume SMTP egress is available; use an HTTPS email provider if SMTP is blocked.

## Data and runtime notes

- Keep the existing MongoDB Atlas database and collections. This migration does not copy, reset, or rename data.
- The API uses PyMongo and MongoDB-backed persistence. Its connection pool is per serverless instance; verify Atlas connection limits under concurrent load. Vercel deploys FastAPI as a single Python Function when it detects the exported `app` entrypoint. <https://vercel.com/docs/frameworks/backend/fastapi>
- FastAPI response streaming is supported by Vercel's Python runtime. With Fluid Compute enabled, Hobby functions have a 300-second maximum; Pro/Enterprise can run longer. This branch sets a 300-second ceiling for the API function. Individual requests must still complete within the configured function duration. <https://vercel.com/docs/functions/configuring-functions/duration>
- Vercel Functions have a 4.5 MB request/response payload limit. The current workspace ZIP import allows up to 20 MB, so imports larger than the platform limit will fail before FastAPI sees them. Before relying on large imports, move uploads to direct object storage or lower the application limit to match the platform.
- Local process memory is not durable/shared. Do not run a persistent worker, scheduler, or in-memory queue inside this function. The repository's durable job records remain in MongoDB, but any separate worker must run on a worker-capable host or be redesigned as bounded Vercel Cron/Workflow tasks.
- MCP and SSE/streaming clients must reconnect if a function reaches its maximum duration. Validate real MCP OAuth discovery and tool calls against the deployed API before changing the published MCP URL.

## Cutover checklist (do not skip)

1. Deploy all three Vercel projects as previews/production deployments while Render remains live.
2. Set production environment variables in Vercel; never commit `.env` files or credentials.
3. Verify API: `/health`, `/health/ready`, `/docs`, `/.well-known/oauth-protected-resource`, `/.well-known/oauth-authorization-server`.
4. Verify frontend: sign up/login, Google sign-in, notes CRUD, public share, workspace import/export, AI chat streaming, and browser refresh/session persistence.
5. Verify collaboration invitations end-to-end, including delivered email and invite acceptance.
6. Verify MCP OAuth discovery, dynamic registration, PKCE authorization, token exchange, and `tools/list` + `tools/call` using the final API URL.
7. Verify CORS, cookies, custom domains, and all redirect/callback URLs in Google OAuth settings.
8. Test upload sizes and long-running AI requests against Vercel's actual plan limits.
9. Only after all checks pass, update the frontend/API/MCP public URLs and any OAuth redirect URIs. Keep Render available for immediate rollback during the observation window.
10. Decommission Render only after production health, data integrity, and rollback window are confirmed.

## Rollback

If any critical check fails, point the frontend's `INTERNAL_API_URL` back to the Render backend (or restore the prior frontend deployment), restore the previous public MCP URL and OAuth callback settings, and keep using the existing MongoDB database. Do not run schema/data migrations as part of a hosting rollback.

## Official Vercel references

- [FastAPI on Vercel](https://vercel.com/docs/frameworks/backend/fastapi)
- [Python Runtime](https://vercel.com/docs/functions/runtimes/python)
- [Function limitations](https://vercel.com/docs/functions/limitations)
