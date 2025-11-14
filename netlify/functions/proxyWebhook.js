// netlify/functions/chat.js

const { extractIntentAndProperty } = require("./intentExtractor");
const { generateGeneralReply } = require("./generalReply");
const { handlePropertyQuery } = require("./propertyHandler");
const { resolveFieldType } = require("./fieldTypeResolver");   // <- NEW

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
      body: JSON.stringify({ error: "Missing 'message' in request body" }),
    };
  }

  try {
    // STEP 1: extract intent + property info
        // STEP 1: extract intent + property info
    const extracted = await extractIntentAndProperty(message);

    // STEP 2a: local fieldType resolution (based on informationToFind + full message)
    const fieldType = resolveFieldType(extracted.informationToFind, extracted.inputMessage);
    extracted.fieldType = fieldType;

    let reply;
    if (extracted.intent !== "property_query") {
      // Non-property queries -> general AI reply
      reply = await generateGeneralReply(message);
    } else {
      // Property query path -> goes through property handler
      reply = await handlePropertyQuery(extracted);
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reply,
        intent: extracted.intent,
        propertyName: extracted.propertyName,
        informationToFind: extracted.informationToFind,
        fieldType: extracted.fieldType,              // now set by resolveFieldType()
        inputMessage: extracted.inputMessage,
      }),
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
