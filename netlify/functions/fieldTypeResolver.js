// netlify/functions/fieldTypeResolver.js

function norm(str) {
  if (!str) return "";
  return String(str).toLowerCase();
}

/**
 * Resolve two things:
 * 1) fieldType → used for property-level answers
 * 2) datasetHint → used for dataset analytics (all-properties queries)
 *
 * @returns { fieldType: string|null, datasetHint: string|null }
 */
function resolveFieldType(informationToFind, message) {
  const info = norm(informationToFind);
  const full = norm(message);
  const text = (info + " " + full).trim();

  // Default outputs
  let fieldType = null;
  let datasetHint = null;

  // -------------------------------------
  // DATASET INTELLIGENCE HINTS
  // (Used by dataset_query handling)
  // -------------------------------------

  if (text.includes("owner") || text.includes("owned by")) {
    datasetHint = "owner";
  }

  if (text.includes("pool") || text.includes("hot tub") || text.includes("jacuzzi")) {
    datasetHint = "pool";
  }

  if (text.includes("parking")) {
    datasetHint = "parking";
  }

  if (text.includes("wifi") || text.includes("internet")) {
    datasetHint = "wifi";
  }

  if (text.includes("rating")) {
    datasetHint = "rating";
  }

  if (text.includes("guest favorite") || text.includes("guest fav")) {
    datasetHint = "guest_fav";
  }

  if (text.includes("2 bedroom") || text.includes("3 bedroom") || text.match(/\b\d+br\b/)) {
    datasetHint = "beds";
  }

  if (text.includes("max guests") || text.includes("how many people")) {
    datasetHint = "guests";
  }

  // -------------------------------------
  // PROPERTY-LEVEL FIELD DETECTION
  // -------------------------------------

  // WIFI
  if (text.includes("wifi") || text.includes("internet") || text.includes("network")) {
    if (text.includes("speed")) fieldType = "wifi_speed";
    else if (text.includes("provider") || text.includes("router")) fieldType = "wifi_provider";
    else if (text.includes("login") || text.includes("password")) fieldType = "wifi_login";
    else fieldType = "wifi_details";
  }

  // LOCK / CODES
  if (!fieldType && (text.includes("code") || text.includes("lock") || text.includes("keypad"))) {
    if (text.includes("closet")) fieldType = "owners_closet_code";
    else if (text.includes("storage")) fieldType = "storage_room_password";
    else fieldType = "door_lock_code";
  }

  // TRASH
  if (!fieldType && (text.includes("trash") || text.includes("garbage") || text.includes("dumpster"))) {
    if (text.includes("day") || text.includes("pickup")) fieldType = "trash_day_reminder";
    else if (text.includes("process") || text.includes("how")) fieldType = "trash_process";
    else fieldType = "trash_info";
  }

  // PARKING
  if (!fieldType && text.includes("parking")) {
    fieldType = "parking";
  }

  // QUIET HOURS
  if (!fieldType && (text.includes("quiet") || text.includes("noise"))) {
    fieldType = "quiet_hours";
  }

  // POOL
  if (!fieldType && (text.includes("pool") || text.includes("hot tub") || text.includes("spa"))) {
    if (text.includes("temperature") || text.includes("temp")) fieldType = "pool_temperature";
    else if (text.includes("fence") || text.includes("gate")) fieldType = "pool_fence_gate";
    else fieldType = "pool_info";
  }

  // OWNER / MANAGER
  if (!fieldType && text.includes("owner")) fieldType = "owner_name";
  if (!fieldType && (text.includes("manager") || text.includes("property manager"))) fieldType = "property_manager";
  if (!fieldType && text.includes("handyman")) fieldType = "handyman_number";

  // CHECK-IN / OUT
  if (!fieldType && (text.includes("check-in") || text.includes("checkout"))) {
    if (text.includes("early") || text.includes("late")) fieldType = "early_late_fee_link";
    else fieldType = "checkin_checkout";
  }

  // RULES
  if (!fieldType && text.includes("events")) fieldType = "events_policy";
  if (!fieldType && (text.includes("pet") || text.includes("smoking") || text.includes("party"))) {
    fieldType = "pet_party_smoking_policy";
  }

  // MISC AMENITIES
  if (!fieldType && text.includes("bbq")) fieldType = "bbq_grill";
  if (!fieldType && text.includes("camera")) fieldType = "camera_location";
  if (!fieldType && text.includes("air mattress")) fieldType = "air_mattress";
  if (!fieldType && text.includes("supplies")) fieldType = "supplies_provided";
  if (!fieldType && text.includes("first aid")) fieldType = "first_aid_fire_extinguisher";
  if (!fieldType && text.includes("washer") || text.includes("laundry")) fieldType = "washer_dryer";
  if (!fieldType && text.includes("pillow") || text.includes("blanket")) fieldType = "extra_pillows_bedding";
  if (!fieldType && text.includes("notes")) fieldType = "additional_notes";

  // STRUCTURAL / LISTING
  if (!fieldType && text.includes("price")) fieldType = "price";
  if (!fieldType && text.includes("type")) fieldType = "property_type";
  if (!fieldType && text.includes("floor")) fieldType = "floor";
  if (!fieldType && text.includes("style")) fieldType = "style";
  if (!fieldType && text.includes("bed") || text.includes("bath")) fieldType = "bed_bath";
  if (!fieldType && text.includes("guest")) fieldType = "max_guests";
  if (!fieldType && text.includes("airbnb") || text.includes("listing")) fieldType = "airbnb_link";
  if (!fieldType && text.includes("photo")) fieldType = "cover_photo";
  if (!fieldType && text.includes("rating")) fieldType = "airbnb_rating";
  if (!fieldType && text.includes("guest fav")) fieldType = "guest_fav";
  if (!fieldType && text.includes("address") || text.includes("location")) fieldType = "address";

  return { fieldType, datasetHint };
}

module.exports = { resolveFieldType };
