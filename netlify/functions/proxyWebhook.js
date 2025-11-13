// netlify/functions/chat.js

exports.handler = async (event) => {
  const origin = event.headers.origin || event.headers.Origin || "*";

  // --- CORS preflight ---
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

  // Only allow POST for main handler
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
 * STEP 1:
 * Call Groq to extract:
 *  - intent              (e.g. "property_query", "greeting", "other")
 *  - propertyName        (e.g. "Clara Lane", "Hidden Forest", "301", "125N")
 *  - informationToFind   (e.g. "wifi login", "parking", "camera", "owner")
 *  - inputMessage        (original message)
 *
 * For now, we just return these four fields so you can see the output.
 */
async function handleChat(message, rawBody) {
  const extracted = await extractIntentAndProperty(message);

  // For now, just echo what we extracted
  return {
    intent: extracted.intent,
    propertyName: extracted.propertyName,
    informationToFind: extracted.informationToFind,
    inputMessage: extracted.inputMessage,
  };
}

/**
 * Uses Groq Chat API (OpenAI-compatible) to extract structured fields.
 * Requires env var: GROQ_API_KEY
 * Optional: GROQ_MODEL (default: llama-3.1-70b-versatile)
 */
async function extractIntentAndProperty(message) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GROQ_API_KEY environment variable");
  }

  const model = process.env.GROQ_MODEL || "llama-3.1-70b-versatile";

  const systemPrompt = `
You are an information extractor for a property AI assistant.

Given a guest's message, you must return a JSON object with this exact shape:

{
  "intent": "property_query" | "greeting" | "other",
  "propertyName": string | null,
  "informationToFind": string | null,
  "inputMessage": string
}

Definitions:
- "property_query": user is asking about a specific property or unit
  (examples: "Clara Lane", "Hidden Forest", "301", "Unit 125N", "Apartment 4B").
- "greeting": simple greetings or small talk ("hi", "hello", "how are you").
- "other": anything that is not clearly a property query or greeting.

Rules:
- propertyName: 
    - Extract the most likely property or unit name mentioned
      (like "Clara Lane", "Hidden Forest", "301", "125N").
    - If none is mentioned, use null.
- informationToFind:
    - Short description of what the user wants:
      examples: "wifi login", "parking", "camera", "property owner",
                "check-in time", "gate code", "pet policy".
    - If unclear, try your best guess; if really none, use null.
- inputMessage:
    - Always return the original user message as received.

Return ONLY valid JSON that can be parsed with JSON.parse. No extra text.
  `.trim();

  const payload = {
    model,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: message },
    ],
  };

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(`Groq extractor error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const content =
    data?.choices?.[0]?.message?.content ||
    '{"intent":"other","propertyName":null,"informationToFind":null,"inputMessage":""}';

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (err) {
    console.warn("Failed to parse Groq JSON, content:", content);
    // Fallback: still return something useful
    parsed = {
      intent: "other",
      propertyName: null,
      informationToFind: null,
      inputMessage: message,
    };
  }

  // Normalize fields and provide defaults
  return {
    intent: parsed.intent || "other",
    propertyName: parsed.propertyName ?? null,
    informationToFind: parsed.informationToFind ?? null,
    inputMessage: parsed.inputMessage || message,
  };
}
