// Centralized API call to n8n webhook
const DEV_WEBHOOK = import.meta.env.VITE_N8N_WEBHOOK_URL
// In production use a Netlify Function proxy by default to avoid CORS.
// You can override the proxy path by setting VITE_N8N_PROXY_URL at build time.
const WEBHOOK_URL = import.meta.env.PROD
	? (import.meta.env.VITE_N8N_PROXY_URL || '/api/proxyWebhook')
	: DEV_WEBHOOK

export async function sendToWebhook(message) {
	if (!WEBHOOK_URL) {
		throw new Error('Missing webhook URL. Set VITE_N8N_WEBHOOK_URL (dev) or VITE_N8N_PROXY_URL/N8N_WEBHOOK_URL (production)')
	}

	const res = await fetch(WEBHOOK_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ message }),
	})

	if (!res.ok) {
		const text = await res.text().catch(() => '')
		throw new Error(`Webhook error ${res.status}: ${text || res.statusText}`)
	}

	// Expected JSON: { reply: "..." }
	const data = await res.json()
	if (!data || typeof data.reply !== 'string') {
		throw new Error('Invalid response from webhook. Expected { reply: string }')
	}
	return data.reply
}