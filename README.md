# Tropix Chat Tester

A minimal static page + one serverless function to test whether the Tropix
n8n chat webhook is reachable and responding — without touching the n8n
workflow itself.

Why this exists: testing the webhook straight from a browser-based page
(like a Claude artifact) can hit CORS blocks, since n8n may not allow
cross-origin requests from an arbitrary page's origin. Routing the call
through `api/chat.js` means the actual POST to n8n happens server-to-server
on Vercel's infra, which sidesteps CORS entirely.

## Deploy

1. Push this folder to a new GitHub repo (or just drag-and-drop the folder
   into vercel.com's "Add New Project" > "Deploy" screen — no git needed for
   a one-off).
2. Import it in Vercel. No build step, no framework needed — Vercel
   auto-detects `public/` as static output and `api/chat.js` as a
   serverless function.
3. (Optional) In Project Settings → Environment Variables, add:
   - `N8N_WEBHOOK_URL` = `https://n8n.supportlead.ai/webhook/3ff3f829-4677-4954-ad30-13654e6813ca/chat`
   If you skip this, the same URL is already hardcoded as the default in
   `api/chat.js`.
4. Deploy. Open the resulting `*.vercel.app` URL — you'll see the chat UI.

## Using it

Type a message and hit Send. The page calls `/api/chat` on your own
deployment, which forwards the message to n8n and returns:
- the parsed reply (if it finds one in common field names), or
- the raw n8n response, expandable under "Last raw response", or
- a clear error if n8n couldn't be reached or returned an error status.

## What a failure means

- **`upstreamStatus` 404 / connection error** — the n8n workflow is inactive.
  A Chat Trigger's production webhook path only listens while the workflow
  is active. Activate it in n8n, then retest.
- **200 OK but no recognizable reply field** — the workflow is reachable and
  running, but its response shape doesn't match the common field names this
  tester checks (`output`, `text`, `message`, `reply`, `response`, `answer`).
  Check "Last raw response" to see the actual shape and I can adjust the
  parser to match it.
- **This app's own `/api/chat` call fails** — unrelated to n8n; check the
  Vercel function logs for that deployment.

This tool only sends read-style POSTs to the existing public webhook. It
never creates, edits, activates, or archives anything inside the n8n
workflow.
