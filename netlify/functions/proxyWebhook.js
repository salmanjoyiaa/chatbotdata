// netlify/functions/chat.js

exports.handler = async (event) => {
  // --- Basic CORS handling ---
  const origin = event.headers.origin || event.headers.Origin || "*";

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
      body: "",
    };
  }

  // Only allow POST for the main handler
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: "Method Not Allowed. Use POST." }),
    };
  }

  // Check that fetch exists (Node 18+ on Netlify has it)
  if (typeof fetch === "undefined") {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": origin },
      body: JSON.stringify({
        error:
          "Server runtime does not provide fetch API. Ensure Node >= 18 or add a fetch polyfill.",
      }),
    };
  }

  // Parse JSON body
  let body;
  try {
    body = event.body ? JSON.parse(event.body) : {};
  } catch (e) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: "Invalid JSON body" }),
    };
  }

  const message = body.message || body.text || "";
  if (!message) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: "Missing 'message' in request body",
      }),
    };
  }

  try {
    // This is where we will reproduce your n8n workflow step by step
    const replyPayload = await handleChat(message, body);

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(replyPayload),
    };
  } catch (err) {
    console.error("Chat handler error:", err);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: "Internal server error",
        detail: String(err && err.message ? err.message : err),
      }),
    };
  }
};

/**
 * Main chat logic.
 * For now it just echoes the message.
 * We will replace this logic node-by-node using your n8n workflow:
 *  - Groq LLM calls
 *  - Google Sheets lookups
 *  - If / branching etc.
 */
async function handleChat(message, rawBody) {
  // TODO: replace this with your actual logic from n8n
  // For now, simple echo so we can verify wiring is correct.
  return {
    reply: `Echo: ${message}`,
  };
}
