// netlify/functions/intentExtractor.js

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
  (examples: "Clara Lane", "Hidden Forest", "301", "Unit 125N").
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
    parsed = {
      intent: "other",
      propertyName: null,
      informationToFind: null,
      inputMessage: message,
    };
  }

  return {
    intent: parsed.intent || "other",
    propertyName: parsed.propertyName ?? null,
    informationToFind: parsed.informationToFind ?? null,
    inputMessage: parsed.inputMessage || message,
  };
}

module.exports = { extractIntentAndProperty };
