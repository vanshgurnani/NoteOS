# NOTE OS Meeting Summarizer

A separately organized FastAPI microservice package mounted into the main NOTE OS backend at `/meetings`. It uses the existing NOTE OS authentication, MongoDB connection, and configured AI provider.

## Flow
1. User connects their Google account from `/meetings`.
2. Google OAuth grants the read-only Meet scope.
3. User browses conference records and available transcript artifacts.
4. The service fetches transcript entries, generates a structured summary, and saves it to the user's NOTE OS account.
5. Users can also paste transcripts manually when they have a transcript export.

## Google setup
Enable Google Meet REST API in Google Cloud. Configure OAuth consent and add the exact callback URI from `GOOGLE_MEET_REDIRECT_URI`. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_MEET_REDIRECT_URI` in the backend. Keep `JWT_SECRET` stable because it derives the encryption key for stored OAuth tokens.

Required scope: `https://www.googleapis.com/auth/meetings.space.readonly`.

Meet transcript artifacts need to be enabled for the meeting. This service does not join, record, or transcribe live meetings. Google API/OAuth access and verification requirements apply.

## API
- `GET /meetings/google/connect`
- `GET /meetings/google/callback`
- `GET /meetings/google/conferences`
- `GET /meetings/google/conferences/{conference_id}/transcripts`
- `POST /meetings/google/transcripts/{transcript_id}/summarize`
- `POST /meetings/summarize`
- `GET /meetings`
- `DELETE /meetings/{summary_id}`

The package boundary is intentional: it can be extracted to an independent deployment later, with a service-to-service authentication layer replacing direct imports of NOTE OS internals.
