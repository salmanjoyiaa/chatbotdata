// netlify/functions/propertyHandler.js

/**
 * Placeholder for handling property queries.
 * For now it just builds a debug reply.
 * Later we'll add Google Sheets lookup + AI answer here.
 */
async function handlePropertyQuery(extracted) {
  const reply =
    `Property query detected.\n` +
    `Property: ${extracted.propertyName ?? "null"}\n` +
    `Info to find: ${extracted.informationToFind ?? "null"}\n` +
    `Input: ${extracted.inputMessage}`;

  return reply;
}

module.exports = { handlePropertyQuery };
