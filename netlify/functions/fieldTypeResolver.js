// netlify/functions/fieldTypeResolver.js

function norm(str) {
  if (!str) return "";
  return String(str).toLowerCase();
}

/**
 * Resolve a canonical fieldType from the user's requested info.
 * Uses simple keyword rules based on your sheet headers.
 *
 * @param {string|null} informationToFind - short phrase from Groq (e.g. "wifi password", "door code")
 * @param {string} message - full original user message
 * @returns {string|null} fieldType
 */
function resolveFieldType(informationToFind, message) {
  const info = norm(informationToFind);
  const full = norm(message);

  const text = (info + " " + full).trim();

  // --- WIFI ---
  if (text.includes("wifi") || text.includes("wi-fi") || text.includes("internet") || text.includes("network")) {
    if (text.includes("speed")) return "wifi_speed";                   // Wifi Speed (Mbps) on Listing
    if (text.includes("provider") || text.includes("router")) return "wifi_provider"; // Wifi Provider Routerr
    if (text.includes("login") || text.includes("password") || text.includes("passcode")) {
      return "wifi_login";                                             // Wifi Login / WIFI INFO / WIFI INFORMATION/ LOGIN
    }
    // generic wifi question -> details
    return "wifi_details";
  }

  // --- LOCK / CODES ---
  if (text.includes("code") || text.includes("lock") || text.includes("keypad")) {
    if (text.includes("closet")) {
      return "owners_closet_code";           // Owners closet code
    }
    if (text.includes("storage")) {
      return "storage_room_password";        // Storage Room password.
    }
    // Default: door lock code
    return "door_lock_code";                 // Lock Codes and Info, Door Lock
  }

  // --- TRASH ---
  if (text.includes("trash") || text.includes("garbage") || text.includes("rubbish") || text.includes("bin") || text.includes("dumpster")) {
    if (text.includes("day") || text.includes("pickup") || text.includes("schedule") || text.includes("reminder")) {
      return "trash_day_reminder";           // Trash Day Reminder
    }
    if (text.includes("process") || text.includes("how") || text.includes("where") || text.includes("take out")) {
      return "trash_process";                // Trash Process
    }
    // generic trash info
    return "trash_info";                     // Trash Info / Trash Can info.
  }

  // --- PARKING ---
  if (text.includes("parking") || text.includes("park my car") || text.includes("car park") || text.includes("driveway")) {
    return "parking";                        // Parking
  }

  // --- QUIET HOURS / NOISE ---
  if (text.includes("quiet hours") || text.includes("noise") || text.includes("loud") || text.includes("party time")) {
    return "quiet_hours";                    // Quite Hours
  }

  // --- POOL / HOT TUB ---
  if (text.includes("pool") || text.includes("hot tub") || text.includes("hottub") || text.includes("jacuzzi") || text.includes("spa")) {
    if (text.includes("temperature") || text.includes("temp") || text.includes("heat") || text.includes("heated")) {
      return "pool_temperature";             // Temperature of Pool
    }
    if (text.includes("fence") || text.includes("gate")) {
      return "pool_fence_gate";              // Pool Fence / Gate
    }
    return "pool_info";                      // Pool and Hot tube
  }

  // --- OWNER / MANAGER / CONTACTS ---
  if (text.includes("owner")) {
    return "owner_name";                     // Property Owner name
  }
  if (text.includes("manager") || text.includes("property manager")) {
    return "property_manager";               // Property Manger
  }
  if (text.includes("handyman") || text.includes("maintenance")) {
    return "handyman_number";                // Handyman Number
  }

  // --- CHECK-IN / CHECK-OUT / EARLY / LATE ---
  if (text.includes("check-in") || text.includes("check in") || text.includes("check-out") || text.includes("checkout") || text.includes("check out")) {
    if (text.includes("early") || text.includes("late")) {
      return "early_late_fee_link";          // Fee link for Early check-in/ Late check-out
    }
    return "checkin_checkout";               // Check-ins/Check-out
  }

  // --- RULES: events / pets / smoking / parties ---
  if (text.includes("events")) {
    return "events_policy";                  // Events
  }
  if (
    text.includes("pet") ||
    text.includes("dog") ||
    text.includes("cat") ||
    text.includes("smoking") ||
    text.includes("smoke") ||
    text.includes("party") ||
    text.includes("parties")
  ) {
    return "pet_party_smoking_policy";       // Pet/Party/smoking
  }

  // --- AMENITIES / MISC ---
  if (text.includes("bbq") || text.includes("grill") || text.includes("barbecue")) {
    return "bbq_grill";                      // BBQ Grill
  }
  if (text.includes("camera") || text.includes("cctv") || text.includes("security camera")) {
    return "camera_location";                // Camera Location
  }
  if (text.includes("air mattress") || text.includes("airmatress") || text.includes("extra bed")) {
    return "air_mattress";                   // Air Matress
  }
  if (text.includes("supplies") || text.includes("soap") || text.includes("shampoo") || text.includes("toilet paper") || text.includes("coffee")) {
    return "supplies_provided";              // Supplies provided
  }
  if (text.includes("first aid") || text.includes("fire extinguisher")) {
    return "first_aid_fire_extinguisher";    // First Aid Kit & Fire Extinguisher
  }
  if (text.includes("washer") || text.includes("dryer") || text.includes("laundry")) {
    return "washer_dryer";                   // Washer & Dryer
  }
  if (text.includes("pillow") || text.includes("blanket") || text.includes("bedding")) {
    return "extra_pillows_bedding";          // Extra Pillows/Bedding
  }
  if (text.includes("notes") || text.includes("more info") || text.includes("anything else")) {
    return "additional_notes";               // Additional Notes
  }

  // --- STRUCTURAL / LISTING INFO ---
  if (text.includes("price") || text.includes("rate") || text.includes("nightly")) {
    return "price";                          // Price
  }
  if (text.includes("type") || text.includes("apartment") || text.includes("condo") || text.includes("house")) {
    return "property_type";                  // Type
  }
  if (text.includes("floor")) {
    return "floor";                          // Floor
  }
  if (text.includes("style") || text.includes("design") || text.includes("theme")) {
    return "style";                          // Style
  }
  if (text.includes("bed") || text.includes("bath") || text.includes("bedroom") || text.includes("bathroom")) {
    return "bed_bath";                       // Bed x Bath
  }
  if (text.includes("guest") || text.includes("how many people") || text.includes("max people")) {
    return "max_guests";                     // Max Guests
  }
  if (text.includes("airbnb") || text.includes("listing") || text.includes("link")) {
    if (text.includes("rating") || text.includes("review")) {
      return "airbnb_rating";               // Airbnb Rating
    }
    return "airbnb_link";                   // Airbnb Listing Link
  }
  if (text.includes("photo") || text.includes("picture") || text.includes("images")) {
    return "cover_photo";                   // Cover Photo
  }
  if (text.includes("guest favourite") || text.includes("guest favorite") || text.includes("guest fav")) {
    return "guest_fav";                     // Guest Fav?
  }

  // --- ADDRESS ---
  if (text.includes("address") || text.includes("location") || text.includes("where is it")) {
    return "address";                       // Address
  }

  // Fallback: we didn't clearly recognize a field
  return null;
}

module.exports = { resolveFieldType };
