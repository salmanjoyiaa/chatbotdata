// netlify/functions/propertyHandler.js

async function handlePropertyQuery(extracted) {
  const reply =
    `Property query detected.\n` +
    `Property: ${extracted.propertyName ?? "null"}\n` +
    `Info to find: ${extracted.informationToFind ?? "null"}\n` +
    `Field type: ${extracted.fieldType ?? "null"}\n` +
    `Input: ${extracted.inputMessage}`;

  return reply;
}

module.exports = { handlePropertyQuery };
