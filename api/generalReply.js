// api/generalReply.js

async function generateGeneralReply(message) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GROQ_API_KEY environment variable");
  }

  const model = process.env.GROQ_MODEL || "llama-3.1-70b-versatile";

  const systemPrompt = `
You are "Property AI", a friendly, casually professional assistant for Dream State properties.

Guidelines:
- Answer the guest's question in a warm, concise, professional tone.
- You ONLY know about Dream State properties, bookings, and stay-related topics.
- If the user asks about anything not related to Dream State properties or their stay,
  politely say that you only have information about Dream State properties and try to
  guide them back to property-related questions.
- Keep replies short and conversational (2–5 sentences max).
`.trim();

  const payload = {
    model,
    temperature: 0.7,
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
    throw new Error(`Groq general reply error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const reply =
    data?.choices?.[0]?.message?.content ||
    "Sorry, I couldn't generate a response right now.";

  return reply;
}

module.exports = { generateGeneralReply };
