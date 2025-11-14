// netlify/functions/chat.js

const { extractIntentAndProperty } = require("./intentExtractor");
const { generateGeneralReply } = require("./generalReply");
const { handlePropertyQuery, handleDatasetQuery } = require("./propertyHandler");
const { resolveFieldType } = require("./fieldTypeResolver");

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
    // ---------------------------------------
    // STEP 1: Intent extraction
    // ---------------------------------------
    const extracted = await extractIntentAndProperty(message);

    // ---------------------------------------
    // STEP 2: Field type resolution (only used for property_query)
    // ---------------------------------------
    const fieldType = resolveFieldType(
      extracted.informationToFind,
      extracted.inputMessage
    );
    extracted.fieldType = fieldType;

    console.log("Extracted intent object:", extracted);

    let reply;

    // ---------------------------------------
    // NEW: DATASET QUERIES
    // ---------------------------------------
    if (extracted.intent === "dataset_query") {
      reply = await handleDatasetQuery(extracted);
    }
    // ---------------------------------------
    // PROPERTY QUERIES
    // ---------------------------------------
    else if (extracted.intent === "property_query") {
      reply = await handlePropertyQuery(extracted);
    }
    // ---------------------------------------
    // GENERAL REPLIES
    // ---------------------------------------
    else {
      reply = await generateGeneralReply(message);
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reply,
        ...extracted,
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
