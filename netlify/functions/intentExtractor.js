// netlify/functions/intentExtractor.js

async function extractIntentAndProperty(message) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GROQ_API_KEY environment variable");
  }

  const model = process.env.GROQ_MODEL || "llama-3.1-70b-versatile";

  const systemPrompt = `
You are an information extractor for a property AI assistant for Dream State.

Your job is to take a single guest message and return a JSON object with this EXACT shape:

{
  "intent": "property_query" | "dataset_query" | "greeting" | "other",
  "propertyName": string | null,
  "informationToFind": string | null,
  "datasetIntentType": string | null,
  "datasetOwnerName": string | null,
  "inputMessage": string
}

INTENT DEFINITIONS
------------------
- "property_query":
    The guest is asking about a specific property or unit.
    Examples:
      - "What's the wifi password for Clara Lane?"
      - "Where is the camera in Skyline Flat?"
      - "What is the door code for 301?"
      - "Does unit 607 have free parking?"
    Key signal: the question focuses on ONE unit or listing.

- "dataset_query":
    The guest is asking about ALL properties, or wants some aggregate / list
    derived from the overall data, NOT about just one unit.
    Examples:
      - "Who has the most properties?"
      - "How many properties does DS/Maven have?"
      - "List all properties owned by DS/Amber."
      - "Which properties have a pool?"
      - "Show me all properties with free parking."
      - "How many units do we manage in total?"
    Key signals:
      - Mentions "all properties", "which properties", "how many properties/units",
        "owners", "most properties", "list all", "show me all", etc.
      - Not tied to a single specific unit.

- "greeting":
    Simple greetings or small talk:
      - "hi", "hello", "hey", "how are you", "good morning", etc.

- "other":
    Anything that is not clearly a property_query, dataset_query, or greeting,
    or where the intent is too ambiguous.

PROPERTY FIELDS
---------------
propertyName:
- Use when intent === "property_query".
- Match the property or unit mentioned in the user's message.
- It should correspond to either:
  - "Unit #" (e.g. "301", "125N"), or
  - "Title on Listing's Site" (e.g. "Clara Lane Retreat", "Hidden Forest").
- If no clear property is mentioned, set propertyName to null.

informationToFind:
- Use when intent === "property_query".
- A short natural-language description of what the guest is asking about, e.g.:
  "wifi password", "wifi login", "door lock code", "trash instructions",
  "trash day", "parking", "quiet hours", "pool temperature", "owner name",
  "handyman number".
- If nothing is clear, set informationToFind to null.

DATASET FIELDS
--------------
datasetIntentType:
- Use when intent === "dataset_query".
- It MUST be one of the following strings (or null for other intents):

  1) "owner_with_most_properties"
     - The guest asks who owns the most properties overall.
     - Example: "Who has the most properties?"

  2) "count_properties_by_owner"
     - The guest asks how many properties a specific owner has.
     - Example: "How many units does DS/Maven manage?"

  3) "list_properties_by_owner"
     - The guest asks to list all properties for a specific owner.
     - Example: "Show me all properties owned by DS/Amber."

  4) "count_total_properties"
     - The guest asks how many properties/units exist in total.
     - Example: "How many properties do we manage in total?"

If the question doesn't match any of these patterns, set datasetIntentType to null
and intent should likely be "other" (or "property_query" if focused on one unit).

datasetOwnerName:
- Use ONLY when datasetIntentType is "count_properties_by_owner"
  or "list_properties_by_owner".
- Extract the owner name phrase (e.g. "DS/Maven", "DS (Dream State)/Maven", "DS/Amber").
- If the owner name isn't clear or not applicable, set datasetOwnerName to null.

inputMessage:
- Always return the original user message exactly as received.

IMPORTANT RULES
---------------
- ALWAYS return valid JSON only. No markdown, no backticks, no explanations.
- If you are unsure about any field, use null for that field.
- Do NOT invent data or change the user message.
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
    '{"intent":"other","propertyName":null,"informationToFind":null,"datasetIntentType":null,"datasetOwnerName":null,"inputMessage":""}';

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (err) {
    console.warn("Failed to parse Groq JSON, content:", content);
    parsed = {
      intent: "other",
      propertyName: null,
      informationToFind: null,
      datasetIntentType: null,
      datasetOwnerName: null,
      inputMessage: message,
    };
  }

  return {
    intent: parsed.intent || "other",
    propertyName: parsed.propertyName ?? null,
    informationToFind: parsed.informationToFind ?? null,
    datasetIntentType: parsed.datasetIntentType ?? null,
    datasetOwnerName: parsed.datasetOwnerName ?? null,
    inputMessage: parsed.inputMessage || message,
  };
}

module.exports = { extractIntentAndProperty };
