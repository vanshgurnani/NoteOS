# NOTE OS Meet Notes — Chrome extension (prototype)

## Install locally
1. Open `chrome://extensions` and enable Developer mode.
2. Choose **Load unpacked** and select this folder.
3. Open a Google Meet, turn on **captions**, then open the extension.
4. Enter your NOTE OS backend URL and a NOTE OS bearer session token. Click Save settings, then Start capture.
5. When finished, click Stop & summarize. The transcript and AI summary are saved as a normal NOTE OS note.

## Live capture design
The content script observes caption-related DOM changes on the Meet tab and sends new visible caption text over a persistent WebSocket at `/meetings/live`. The backend creates a note at the beginning, updates its transcript as captions arrive, then adds overview, key points, decisions, action items and follow-ups when stopped. It indexes the note for NOTE OS search/RAG.

## Important limitations
- This is a prototype: Google Meet's caption DOM is not a stable public extension API. Google can change selectors; test and tune against current Meet UI. The extension deliberately only reads text rendered in the page and does not capture tab audio or bypass Meet controls.
- Enable captions manually. The extension cannot guarantee speaker attribution and may capture duplicate or partial caption fragments depending on Meet's DOM. Validate transcripts before relying on them.
- Tell participants that captions are being captured and follow applicable consent, workplace and privacy requirements.
- The session token is stored in Chrome local extension storage. Use a short-lived/revocable NOTE OS token for testing; a production extension should use a dedicated extension OAuth flow and avoid long-lived bearer tokens in popup settings.
- STT is not required for this caption-first version. If audio fallback is added later, use explicit user opt-in and a dedicated streaming STT provider adapter; do not silently record meeting audio.
