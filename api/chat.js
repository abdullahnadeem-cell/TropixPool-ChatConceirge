// Serverless proxy so the browser never calls n8n directly (avoids CORS issues
// entirely, since this request happens server-side on Vercel's infra).
//
// Set the webhook URL via an env var in Vercel (Settings -> Environment Variables):
//   N8N_WEBHOOK_URL = https://n8n.supportlead.ai/webhook/3ff3f829-4677-4954-ad30-13654e6813ca/chat
// or just leave the default below as-is.

const DEFAULT_WEBHOOK = "https://n8n.supportlead.ai/webhook/3ff3f829-4677-4954-ad30-13654e6813ca/chat";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Use POST" });
    return;
  }

  const webhookUrl = process.env.N8N_WEBHOOK_URL || DEFAULT_WEBHOOK;
  const { sessionId, message } = req.body || {};

  if (!message || !sessionId) {
    res.status(400).json({ error: "Missing 'sessionId' or 'message' in request body" });
    return;
  }

  const payload = {
    action: "sendMessage",
    sessionId,
    chatInput: message,
    "session id": sessionId,
    "user last message": message,
  };

  try {
    const upstream = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await upstream.text();
    let parsed = null;
    try {
      parsed = JSON.parse(text);
    } catch (_) {
      // not JSON, keep raw text
    }

    res.status(200).json({
      upstreamStatus: upstream.status,
      upstreamOk: upstream.ok,
      raw: text,
      parsed,
    });
  } catch (err) {
    res.status(502).json({
      error: "Failed to reach n8n webhook",
      detail: String(err),
      webhookUrl,
    });
  }
}
