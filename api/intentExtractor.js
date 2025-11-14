// api/intentExtractor.js

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
  "datasetValue": string | null,
  "inputMessage": string
}

INTENT CLASSIFICATION:
- "property_query": User asks about a SPECIFIC property (e.g., "What's the WiFi at Unit 5?")
- "dataset_query": User asks about MULTIPLE properties or global stats (e.g., "Which properties have pools?")
- "greeting": User greets the bot (e.g., "Hi", "Hello", "How are you?")
- "other": Everything else

PROPERTY QUERY FIELDS:
- Set "propertyName" to the unit number or property title the user mentions
- Set "informationToFind" to what they're asking about (e.g., "WiFi password", "check-in time", "parking")

DATASET QUERY TYPES (set datasetIntentType to one of these):
- "owner_with_most_properties": "Which owner has the most properties?"
- "count_properties_by_owner": "How many properties does [owner] have?"
- "list_properties_by_owner": "List all properties owned by [owner]"
- "properties_with_pool": "Which properties have a pool?" OR "Properties with hot tubs?"
- "properties_without_cameras": "Which properties don't have cameras?"
- "highest_rated_property": "What's the highest-rated property?"
- "lowest_rated_property": "What's the lowest-rated property?"
- "properties_above_price": "Show properties above \$X per night"
- "properties_by_beds": "Properties with X bedrooms?"
- "properties_by_max_guests": "Which properties sleep X guests?"
- "properties_with_wifi_speed_above": "Properties with WiFi faster than X Mbps?"

FOR DATASET QUERIES:
- Set "datasetOwnerName" if the user mentions an owner name
- Set "datasetValue" if the user provides a threshold (price, guest count, WiFi speed, bedrooms, etc.)

EXAMPLES:
User: "What's the WiFi password at Unit 5?"
→ intent: "property_query", propertyName: "Unit 5", informationToFind: "WiFi password"

User: "Which properties have pools?"
→ intent: "dataset_query", datasetIntentType: "properties_with_pool"

User: "How many properties does John own?"
→ intent: "dataset_query", datasetIntentType: "count_properties_by_owner", datasetOwnerName: "John"

User: "Show me properties above \$150 per night"
→ intent: "dataset_query", datasetIntentType: "properties_above_price", datasetValue: "150"

User: "Hi there!"
→ intent: "greeting"

User: "What's your favorite color?"
→ intent: "other"

IMPORTANT:
- Always return valid JSON
- Never hallucinate datasetIntentType values—only use types from the list above
- If unsure of the exact match, set intent to "other"
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
    '{"intent":"other","propertyName":null,"informationToFind":null,"datasetIntentType":null,"datasetOwnerName":null,"datasetValue":null,"inputMessage":""}';

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
      datasetValue: null,
      inputMessage: message,
    };
  }

  return {
    intent: parsed.intent || "other",
    propertyName: parsed.propertyName ?? null,
    informationToFind: parsed.informationToFind ?? null,
    datasetIntentType: parsed.datasetIntentType ?? null,
    datasetOwnerName: parsed.datasetOwnerName ?? null,
    datasetValue: parsed.datasetValue ?? null,
    inputMessage: parsed.inputMessage || message,
  };
}

module.exports = { extractIntentAndProperty };
