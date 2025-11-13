exports.handler = async (event) => {
  if (typeof fetch === 'undefined') {
    return { statusCode: 500, body: 'Server runtime does not provide fetch API. Please ensure Node >=18 or add node-fetch as a dependency.' }
  }

  const webhook = process.env.N8N_WEBHOOK_URL
  if (!webhook) {
    return { statusCode: 500, body: 'Missing N8N_WEBHOOK_URL environment variable' }
  }

  const method = event.httpMethod || 'POST'
  const body = event.body || ''
  const headers = { 'Content-Type': 'application/json' }

  try {
    const res = await fetch(webhook, {
      method,
      headers,
      body,
    })

    const text = await res.text()
    const contentType = res.headers.get
      ? res.headers.get('content-type') || 'text/plain'
      : 'text/plain'

    return {
      statusCode: res.status,
      headers: { 'Content-Type': contentType },
      body: text,
    }
  } catch (err) {
    return { statusCode: 500, body: String(err) }
  }
}
