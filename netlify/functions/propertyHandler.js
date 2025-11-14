// netlify/functions/propertyHandler.js

const { google } = require("googleapis");

// ============================
// CONFIG
// ============================

// Your Google Sheet ID (from the sheet URL)
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

// The tab name (adjust if needed)
const SHEET_TAB = "Info";

// Cache for 10 minutes
let cache = {
  timestamp: 0,
  rows: null,
  headers: null,
};

// ============================
// FIELD TYPE → COLUMN MAPPING
// (logical field → possible header names)
// ============================

const FIELD_TO_COLUMNS = {
  wifi_login: ["Wifi Login", "WIFI INFO", "WIFI INFO ", "WIFI INFORMATION/ LOGIN"],
  wifi_details: ["Wifi Login", "WIFI INFO", "WIFI INFO ", "WIFI INFORMATION/ LOGIN"],
  wifi_speed: ["Wifi Speed (Mbps) on Listing"],
  wifi_provider: ["Wifi Provider Routerr"],

  // Note: header in sheet is "Lock Codes\nand Info"
  door_lock_code: ["Lock Codes\nand Info", "Lock Codes and Info", "Door Lock"],
  owners_closet_code: ["Owners closet code"],
  storage_room_password: ["Storage Room password."],

  trash_info: ["Trash  Info", "Trash Info", "Trash Can info."],
  trash_process: ["Trash Process"],
  trash_day_reminder: ["Trash Day Reminder"],

  parking: ["Parking"],
  quiet_hours: ["Quite Hours"],

  pool_info: ["Pool and Hot tube"],
  pool_temperature: ["Temperature of Pool"],
  pool_fence_gate: ["Pool Fence / Gate"],

  owner_name: ["Property Owner name"],
  handyman_number: ["Handyman Number"],
  property_manager: ["Property Manger"],

  checkin_checkout: ["Check-ins/Check-out"],
  early_late_fee_link: ["Fee link for Early check-in/ Late check-out"],

  bbq_grill: ["BBQ Grill"],
  events_policy: ["Events"],
  pet_party_smoking_policy: ["Pet/Party/smoking"],
  camera_location: ["Camera Location"],
  additional_amenities: ["Additonal Amenities"],
  air_mattress: ["Air Matress"],
  supplies_provided: ["Supplies provided"],
  first_aid_fire_extinguisher: ["First Aid Kit & Fire Extinguisher"],
  washer_dryer: ["Washer & Dryer"],
  extra_pillows_bedding: ["Extra Pillows/Bedding"],
  additional_notes: ["Additional Notes"],

  price: ["Price"],
  property_type: ["Type"],
  floor: ["Floor"],
  style: ["Style"],
  bed_bath: ["Bed x Bath"],
  max_guests: ["Max Guests"],
  airbnb_link: ["Airbnb Listing Link"],
  cover_photo: ["Cover Photo"],
  guest_fav: ["Guest Fav?"],
  airbnb_rating: ["Airbnb Rating"],

  address: ["Address"],
};

// ==========================================
// Google Sheets Helper
// ==========================================

async function loadSheet() {
  const now = Date.now();

  // Serve from cache (10 min)
  if (cache.rows && now - cache.timestamp < 10 * 60 * 1000) {
    return cache;
  }

  if (!SHEET_ID) {
    throw new Error("Missing GOOGLE_SHEET_ID environment variable.");
  }

  const rawKey = process.env.GOOGLE_PRIVATE_KEY || "";

  /**
   * If the key has literal "\n" sequences (JSON style), convert them to real newlines.
   * If it already has real newlines, leave it as-is.
   */
  const normalizedPrivateKey = rawKey.includes("\\n")
    ? rawKey.replace(/\\n/g, "\n")
    : rawKey;

  const auth = new google.auth.GoogleAuth({
    credentials: {
      type: "service_account",
      project_id: process.env.GCLOUD_PROJECT_ID,
      private_key: normalizedPrivateKey,
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  const result = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: SHEET_TAB,
  });

  const rows = result.data.values || [];
  const headers = rows[0] || [];
  const dataRows = rows.slice(1);

  cache = {
    timestamp: now,
    rows: dataRows,
    headers,
  };

  return cache;
}

// ==========================================
// Helpers: normalization & header lookup
// ==========================================

function normalize(str) {
  return String(str || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function normalizeHeader(str) {
  return String(str || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function findColumnIndex(headers, desiredName) {
  const target = normalizeHeader(desiredName);
  for (let i = 0; i < headers.length; i++) {
    if (normalizeHeader(headers[i]) === target) {
      return i;
    }
  }
  return -1;
}

// ==========================================
// Fuzzy Property Matching
// ==========================================

function matchProperty(propertyName, rows, headers) {
  if (!propertyName) return null;

  const target = normalize(propertyName);

  const unitIndex = findColumnIndex(headers, "Unit #");
  const titleIndex = findColumnIndex(headers, "Title on Listing's Site");

  let bestMatch = null;

  for (const row of rows) {
    const unit = normalize(row[unitIndex] || "");
    const title = normalize(row[titleIndex] || "");

    if (unit === target || title === target) return row;

    if (unit.includes(target) || title.includes(target)) {
      bestMatch = row;
    }
  }

  return bestMatch;
}

// Turn rows + headers into array of objects: { headerName: value, ... }
function makeRecords(rows, headers) {
  return rows.map((row) => {
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = row[idx];
    });
    return obj;
  });
}

// ==========================================
// PROPERTY QUERY HANDLER
// ==========================================

async function handlePropertyQuery(extracted) {
  const { propertyName, fieldType, informationToFind } = extracted;

  if (!propertyName) {
    return "I couldn’t identify the property. Can you confirm the name or unit?";
  }

  if (!fieldType) {
    return `I know this is a property question, but I'm not sure what information you're asking: "${informationToFind}".`;
  }

  const { rows, headers } = await loadSheet();

  // Match property row
  const matchedRow = matchProperty(propertyName, rows, headers);

  if (!matchedRow) {
    return `I couldn't find any property matching "${propertyName}". Can you please double-check the property name or unit number?`;
  }

  // Get column mapping for this fieldType
  const possibleColumns = FIELD_TO_COLUMNS[fieldType];
  if (!possibleColumns) {
    return `I recognize your question, but I don’t have a column mapped for this type of information ("${fieldType}").`;
  }

  // Try each mapped column
  for (const col of possibleColumns) {
    const columnIndex = findColumnIndex(headers, col);
    if (columnIndex === -1) continue;

    const cellValue = matchedRow[columnIndex];
    if (cellValue && String(cellValue).trim() !== "") {
      return formatResponse(propertyName, fieldType, cellValue);
    }
  }

  return `I looked for "${informationToFind}" for **${propertyName}**, but it’s not listed in our records.`;
}

// ==========================================
// DATASET / ANALYTICS HELPERS
// ==========================================

function normalizeOwnerName(owner) {
  // Looser normalization than property, keep letters, numbers and "/" to match DS/Maven etc.
  return String(owner || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function ownerWithMostProperties(records) {
  const countByOwner = {};
  const displayNameByOwner = {};

  for (const rec of records) {
    const ownerRaw = rec["Property Owner name"];
    if (!ownerRaw) continue;

    const key = normalizeOwnerName(ownerRaw);
    if (!key) continue;

    countByOwner[key] = (countByOwner[key] || 0) + 1;
    // store a nice display version
    displayNameByOwner[key] = ownerRaw;
  }

  let bestKey = null;
  let bestCount = 0;

  for (const [key, count] of Object.entries(countByOwner)) {
    if (count > bestCount) {
      bestCount = count;
      bestKey = key;
    }
  }

  if (!bestKey) return null;

  return {
    ownerName: displayNameByOwner[bestKey],
    count: bestCount,
  };
}

function filterRecordsByOwner(records, ownerQuery) {
  if (!ownerQuery) return [];
  const target = normalizeOwnerName(ownerQuery);

  return records.filter((rec) => {
    const ownerRaw = rec["Property Owner name"];
    if (!ownerRaw) return false;
    const key = normalizeOwnerName(ownerRaw);
    // allow partial / contains match
    return key.includes(target) || target.includes(key);
  });
}

function countPropertiesByOwner(records, ownerQuery) {
  const filtered = filterRecordsByOwner(records, ownerQuery);
  if (filtered.length === 0) return null;

  // Try to use the most common exact display name
  const nameCount = {};
  for (const rec of filtered) {
    const ownerRaw = rec["Property Owner name"];
    nameCount[ownerRaw] = (nameCount[ownerRaw] || 0) + 1;
  }
  let bestName = ownerQuery;
  let bestCount = 0;
  for (const [name, count] of Object.entries(nameCount)) {
    if (count > bestCount) {
      bestCount = count;
      bestName = name;
    }
  }

  return {
    ownerName: bestName,
    count: filtered.length,
  };
}

function listPropertiesByOwner(records, ownerQuery) {
  const filtered = filterRecordsByOwner(records, ownerQuery);
  if (filtered.length === 0) return null;

  const results = filtered.map((rec) => {
    const unit = rec["Unit #"] || "";
    const title = rec["Title on Listing's Site"] || "";
    if (unit && title) return `Unit ${unit} – ${title}`;
    if (unit) return `Unit ${unit}`;
    if (title) return title;
    return "(Unnamed property)";
  });

  // Same display-name trick as above
  const nameCount = {};
  for (const rec of filtered) {
    const ownerRaw = rec["Property Owner name"];
    nameCount[ownerRaw] = (nameCount[ownerRaw] || 0) + 1;
  }
  let bestName = ownerQuery;
  let bestCount = 0;
  for (const [name, count] of Object.entries(nameCount)) {
    if (count > bestCount) {
      bestCount = count;
      bestName = name;
    }
  }

  return {
    ownerName: bestName,
    properties: results,
  };
}

// ==========================================
// DATASET QUERY HANDLER (for dataset_query intent)
// ==========================================

async function handleDatasetQuery(extracted) {
  const { datasetIntentType, datasetOwnerName } = extracted;

  if (!datasetIntentType) {
    return "I’m not completely sure what you’d like to know about our properties. Could you rephrase your question?";
  }

  const { rows, headers } = await loadSheet();
  const records = makeRecords(rows, headers);

  switch (datasetIntentType) {
    case "owner_with_most_properties": {
      const result = ownerWithMostProperties(records);
      if (!result) {
        return "I couldn’t find any owner information in the sheet.";
      }
      return `Right now, **${result.ownerName}** has the most Dream State properties in my records, with **${result.count}** units.`;
    }

    case "count_properties_by_owner": {
      if (!datasetOwnerName) {
        return "Sure, I can check that — which owner would you like me to look up?";
      }
      const result = countPropertiesByOwner(records, datasetOwnerName);
      if (!result) {
        return `I couldn't find any properties for an owner like "${datasetOwnerName}".`;
      }
      return `**${result.ownerName}** currently has **${result.count}** properties in my data.`;
    }

    case "list_properties_by_owner": {
      if (!datasetOwnerName) {
        return "I can list properties by owner — which owner would you like to see?";
      }
      const result = listPropertiesByOwner(records, datasetOwnerName);
      if (!result) {
        return `I couldn't find any properties for an owner like "${datasetOwnerName}".`;
      }
      const list = result.properties.map((p) => `• ${p}`).join("\n");
      return `Here are the properties I have for **${result.ownerName}**:\n\n${list}`;
    }

    default:
      return "I understand you're asking about our property data, but I haven't been trained to answer that specific type of question yet.";
  }
}

// ==========================================
// Format AI response for user
// ==========================================

function formatResponse(propertyName, fieldType, value) {
  const friendly = {
    wifi_login: "Here is the Wi-Fi login",
    wifi_details: "Here are the Wi-Fi details",
    wifi_speed: "Here is the Wi-Fi speed",
    wifi_provider: "Here is the Wi-Fi provider",

    door_lock_code: "Here is the door lock code",
    owners_closet_code: "Here is the owners closet code",
    storage_room_password: "Here is the storage room password",

    trash_info: "Trash information",
    trash_process: "Here is the trash process",
    trash_day_reminder: "Trash day reminder",

    parking: "Parking details",
    quiet_hours: "Quiet hours",

    pool_info: "Pool and hot tub information",
    pool_temperature: "Pool temperature",
    pool_fence_gate: "Pool fence / gate information",

    owner_name: "Property owner",
    handyman_number: "Handyman contact",
    property_manager: "Property manager",

    checkin_checkout: "Check-in / Check-out information",
    early_late_fee_link: "Early check-in / late check-out fee link",

    bbq_grill: "BBQ grill information",
    events_policy: "Events policy",
    pet_party_smoking_policy: "Pet / party / smoking policy",
    camera_location: "Camera location",
    additional_amenities: "Additional amenities",
    air_mattress: "Air mattress information",
    supplies_provided: "Supplies provided",
    first_aid_fire_extinguisher: "First aid kit & fire extinguisher information",
    washer_dryer: "Washer & dryer details",
    extra_pillows_bedding: "Extra pillows and bedding",
    additional_notes: "Additional notes",

    price: "Price",
    property_type: "Property type",
    floor: "Floor",
    style: "Style",
    bed_bath: "Bedrooms and bathrooms",
    max_guests: "Maximum guest capacity",
    airbnb_link: "Airbnb listing link",
    cover_photo: "Cover photo",
    guest_fav: "Guest-favorite status",
    airbnb_rating: "Airbnb rating",

    address: "The address is",
  };

  const phrase = friendly[fieldType] || "Here is the information you asked for";

  return `${phrase} for **${propertyName}**:\n\n${value}`;
}
// ==========================================
// DATASET-LEVEL QUERIES (across all rows)
// ==========================================

async function handleDatasetQuery(extracted) {
  const { datasetIntentType, datasetOwnerName } = extracted;

  if (!datasetIntentType) {
    return "I’m not completely sure what you’d like to know about our properties. Could you rephrase your question?";
  }

  const { rows, headers } = await loadSheet();

  switch (datasetIntentType) {
    case "owner_with_most_properties":
      return ownerWithMostProperties(rows, headers);

    case "count_properties_by_owner":
      return countPropertiesByOwner(rows, headers, datasetOwnerName);

    case "list_properties_by_owner":
      return listPropertiesByOwner(rows, headers, datasetOwnerName);

    case "best_rated_property":
      return bestRatedProperty(rows, headers);

    case "properties_with_pool":
      return propertiesWithPool(rows, headers);

    default:
      return "I recognise this is a question about our overall properties, but I don’t yet have a specific way to answer that. Can you rephrase or ask something more specific?";
  }
}

function getCol(headers, name) {
  return headers.indexOf(name);
}

// -------- owner_with_most_properties --------

function ownerWithMostProperties(rows, headers) {
  const ownerIdx = getCol(headers, "Property Owner name");
  if (ownerIdx === -1) {
    return "I couldn’t find owner information in our records.";
  }

  const counts = new Map(); // key: normalised owner, value: {displayName, count}

  for (const row of rows) {
    const ownerRaw = (row[ownerIdx] || "").trim();
    if (!ownerRaw) continue;

    const key = ownerRaw.toLowerCase();
    if (!counts.has(key)) {
      counts.set(key, { displayName: ownerRaw, count: 0 });
    }
    counts.get(key).count += 1;
  }

  if (counts.size === 0) {
    return "I don’t see any owner data in our sheet yet.";
  }

  let best = null;
  for (const info of counts.values()) {
    if (!best || info.count > best.count) best = info;
  }

  return `The owner with the most properties is **${best.displayName}**, with **${best.count}** properties in our records.`;
}

// -------- count_properties_by_owner --------

function countPropertiesByOwner(rows, headers, ownerQuery) {
  if (!ownerQuery) {
    return "Which owner would you like me to check? (For example: DS/Maven or DS/Amber.)";
  }

  const ownerIdx = getCol(headers, "Property Owner name");
  if (ownerIdx === -1) {
    return "I couldn’t find owner information in our records.";
  }

  const q = ownerQuery.toLowerCase();
  let count = 0;

  for (const row of rows) {
    const ownerRaw = (row[ownerIdx] || "").trim().toLowerCase();
    if (!ownerRaw) continue;
    if (ownerRaw.includes(q)) count += 1;
  }

  if (count === 0) {
    return `I couldn't find any properties for an owner matching “${ownerQuery}” in our sheet.`;
  }

  return `**${ownerQuery}** has **${count}** properties in our records.`;
}

// -------- list_properties_by_owner --------

function listPropertiesByOwner(rows, headers, ownerQuery) {
  if (!ownerQuery) {
    return "Which owner would you like me to list properties for?";
  }

  const ownerIdx = getCol(headers, "Property Owner name");
  const titleIdx = getCol(headers, "Title on Listing's Site");
  const unitIdx = getCol(headers, "Unit #");

  if (ownerIdx === -1 || titleIdx === -1) {
    return "I couldn’t find enough owner / listing information in our records.";
  }

  const q = ownerQuery.toLowerCase();
  const matches = [];

  for (const row of rows) {
    const ownerRaw = (row[ownerIdx] || "").trim().toLowerCase();
    if (!ownerRaw) continue;
    if (!ownerRaw.includes(q)) continue;

    const title = (row[titleIdx] || "").trim();
    const unit = (row[unitIdx] || "").trim();
    matches.push(unit ? `${title} (Unit ${unit})` : title);
  }

  if (matches.length === 0) {
    return `I couldn't find any properties for an owner matching “${ownerQuery}”.`;
  }

  const list = matches.map((m) => `• ${m}`).join("\n");
  return `Here are the properties owned by **${ownerQuery}**:\n\n${list}`;
}

// -------- best_rated_property --------

function bestRatedProperty(rows, headers) {
  const ratingIdx = getCol(headers, "Airbnb Rating");
  const titleIdx = getCol(headers, "Title on Listing's Site");
  const unitIdx = getCol(headers, "Unit #");

  if (ratingIdx === -1 || titleIdx === -1) {
    return "I couldn’t find rating information in our records.";
  }

  let bestScore = -Infinity;
  let bestRows = [];

  for (const row of rows) {
    const ratingRaw = (row[ratingIdx] || "").toString().trim();
    if (!ratingRaw) continue;

    const rating = parseFloat(ratingRaw);
    if (!Number.isFinite(rating)) continue;

    if (rating > bestScore) {
      bestScore = rating;
      bestRows = [row];
    } else if (rating === bestScore) {
      bestRows.push(row);
    }
  }

  if (!Number.isFinite(bestScore) || bestRows.length === 0) {
    return "I couldn't find any rating data for our properties yet.";
  }

  const names = bestRows.map((row) => {
    const title = (row[titleIdx] || "").trim();
    const unit = unitIdx >= 0 ? (row[unitIdx] || "").trim() : "";
    return unit ? `${title} (Unit ${unit})` : title;
  });

  const nameList = names.join(", ");
  return `Our highest-rated property is **${nameList}**, with an Airbnb rating of **${bestScore.toFixed(2)}**.`;
}

// -------- properties_with_pool --------

function propertiesWithPool(rows, headers) {
  const poolIdx = getCol(headers, "Pool and Hot tube");
  const titleIdx = getCol(headers, "Title on Listing's Site");
  const unitIdx = getCol(headers, "Unit #");

  if (poolIdx === -1 || titleIdx === -1) {
    return "I couldn’t find pool information in our records.";
  }

  const withPool = [];

  for (const row of rows) {
    const cell = (row[poolIdx] || "").toString().trim();
    if (!cell) continue;

    const lc = cell.toLowerCase();
    if (lc === "no" || lc === "none" || lc.includes("no pool")) continue;

    const title = (row[titleIdx] || "").trim();
    const unit = unitIdx >= 0 ? (row[unitIdx] || "").trim() : "";
    withPool.push(unit ? `${title} (Unit ${unit})` : title);
  }

  if (withPool.length === 0) {
    return "According to our records, none of the listed properties currently have a pool or hot tub.";
  }

  const list = withPool.map((p) => `• ${p}`).join("\n");
  return `Here are the properties with a pool or hot tub:\n\n${list}`;
}


module.exports = {
  handlePropertyQuery,
  handleDatasetQuery,
};
