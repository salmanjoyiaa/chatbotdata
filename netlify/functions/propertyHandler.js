// netlify/functions/propertyHandler.js

const { google } = require("googleapis");

// ============================
// CONFIG
// ============================

// Your Google Sheet ID (from the sheet URL)
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

// The tab name (adjust if needed)
const SHEET_TAB = "Sheet1";

// Cache for 10 minutes
let cache = {
  timestamp: 0,
  rows: null,
  headers: null,
};

// ============================
// FIELD TYPE → COLUMN MAPPING
// ============================

const FIELD_TO_COLUMNS = {
  wifi_login: ["Wifi Login", "WIFI INFO", "WIFI INFORMATION/ LOGIN"],
  wifi_details: ["Wifi Login", "WIFI INFO", "WIFI INFORMATION/ LOGIN"],
  wifi_speed: ["Wifi Speed (Mbps) on Listing"],
  wifi_provider: ["Wifi Provider Routerr"],

  door_lock_code: ["Lock Codes and Info", "Door Lock"],
  owners_closet_code: ["Owners closet code"],
  storage_room_password: ["Storage Room password."],

  trash_info: ["Trash Info", "Trash Can info."],
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

  if (!SHEET_ID) throw new Error("Missing GOOGLE_SHEET_ID environment variable.");

  const auth = new google.auth.GoogleAuth({
    credentials: {
      type: "service_account",
      project_id: process.env.GCLOUD_PROJECT_ID,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
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
  const headers = rows[0];
  const dataRows = rows.slice(1);

  cache = {
    timestamp: now,
    rows: dataRows,
    headers,
  };

  return cache;
}

// ==========================================
// Fuzzy Property Matching
// ==========================================

function normalize(str) {
  return String(str).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function matchProperty(propertyName, rows, headers) {
  if (!propertyName) return null;

  const target = normalize(propertyName);

  const unitIndex = headers.indexOf("Unit #");
  const titleIndex = headers.indexOf("Title on Listing's Site");

  let bestMatch = null;

  for (const row of rows) {
    const unit = normalize(row[unitIndex] || "");
    const title = normalize(row[titleIndex] || "");

    if (unit === target || title === target) return row;

    if (unit.includes(target) || title.includes(target)) bestMatch = row;
  }

  return bestMatch;
}

// ==========================================
// Main Handler
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
    const columnIndex = headers.indexOf(col);
    if (columnIndex === -1) continue;

    const cellValue = matchedRow[columnIndex];
    if (cellValue && cellValue.trim() !== "") {
      return formatResponse(propertyName, fieldType, cellValue);
    }
  }

  return `I looked for "${informationToFind}" for **${propertyName}**, but it’s not listed in our records.`;
}

// ==========================================
// Format AI response for user
// ==========================================

function formatResponse(propertyName, fieldType, value) {
  const friendly = {
    wifi_login: "Here is the Wi-Fi login",
    door_lock_code: "Here is the door lock code",
    trash_info: "Trash information",
    trash_process: "Here is the trash process",
    trash_day_reminder: "Trash day reminder",
    parking: "Parking details",
    quiet_hours: "Quiet hours",
    pool_info: "Pool and hot tub information",
    pool_temperature: "Pool temperature",
    owner_name: "Property owner",
    handyman_number: "Handyman contact",
    property_manager: "Property manager",
    checkin_checkout: "Check-in / Check-out",
    address: "The address is",
  };

  const phrase = friendly[fieldType] || "Here is the information you asked for";

  return `${phrase} for **${propertyName}**:\n\n${value}`;
}

module.exports = { handlePropertyQuery };
