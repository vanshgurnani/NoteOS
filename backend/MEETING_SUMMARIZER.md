# NOTE OS live meeting capture

The live caption websocket is mounted in the main FastAPI app at `/meetings/live`. It creates a regular NOTE OS note at capture start, appends visible Meet caption text as it arrives, and on stop generates a structured summary using the existing NOTE OS AI provider. The final note is indexed by the existing RAG pipeline.

## WebSocket protocol

Connect to `wss://YOUR_API/meetings/live?token=NOTE_OS_SESSION_TOKEN`.

Send JSON messages:
- `{"type":"start","title":"Sprint planning","meeting_url":"https://meet.google.com/..."}`
- `{"type":"caption","speaker":"Speaker","text":"Caption text"}` for each newly visible caption.
- `{"type":"stop"}` to generate and save the summary.
- `{"type":"ping"}` for a keepalive.

Server events: `ready`, `started`, `transcript_ack`, `summarizing`, `completed` (includes saved note and summary), and `error`.

## Chrome extension

Load the `chrome-extension` directory unpacked from `chrome://extensions`. Open Meet, enable captions, configure the API URL and NOTE OS session token in the popup, and start capture. Stop & summarize saves the result to the signed-in user's notes.

## Important
This first iteration reads caption text rendered in the Google Meet page; it does not record tab/system audio. Meet's internal caption DOM is not a stable public API, so selectors need ongoing testing and may require adjustment after Google UI changes. Speaker attribution is best-effort. Tell participants about transcription and comply with consent/privacy requirements. The extension's token storage is a prototype; production should use a dedicated extension OAuth flow and short-lived scoped credentials. Audio STT fallback is intentionally not silently enabled; add a provider adapter only behind explicit opt-in and participant notice.
