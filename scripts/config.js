// config.js
// ---------------------------------------------------------------------------
// Plain constants shared by the whole module: the module id, the rank list,
// the talent list and the image paths. This file does NOT use any Foundry
// features, so it can also be loaded by the unit tests in /tests.
// ---------------------------------------------------------------------------

// The module's id. It must match the "id" in module.json. It is used for
// file paths, settings and the flag namespace on actors.
export const MODULE_ID = "three-houses-ranks";

// File extension of your 32x32 images. Change this one line if you use
// .png instead of .webp.
export const IMAGE_EXT = "webp";

// The only actor types that get a Talents tab (vehicles and groups do not).
export const SUPPORTED_ACTOR_TYPES = ["character", "npc"];

// The three possible traits a talent can have. A talent can only ever have
// ONE of these, which is why "both a Strength and a Weakness" is impossible.
export const TRAITS = {
  NONE: "none",
  STRENGTH: "strength",
  WEAKNESS: "weakness"
};

// Ranks from lowest to highest. The position in this list (0-10) is the
// "index", which lets us compare ranks as numbers (A is higher than C).
// "img" filenames avoid the "+" character because it is awkward in URLs,
// so "E+" uses the file "e-plus".
const RANK_IDS = ["E", "E+", "D", "D+", "C", "C+", "B", "B+", "A", "A+", "S"];

export const RANKS = RANK_IDS.map((id, index) => ({
  id, // e.g. "B+"
  label: id, // text shown to the user
  index, // numeric position, 0 for E up to 10 for S
  img: `modules/${MODULE_ID}/assets/ranks/${id.toLowerCase().replace("+", "-plus")}.${IMAGE_EXT}`
}));

// Index of the highest rank (S). A talent at this rank cannot advance.
export const MAX_RANK_INDEX = RANKS.length - 1;

// The full list of talents. Every actor shows the same list. To add or
// rename a talent later, edit this list (keep each id unique and unchanging,
// because the id is what is saved on the actors).
const TALENT_DEFS = [
  ["swords", "Swords"],
  ["lances", "Lances"],
  ["axes", "Axes"],
  ["bows", "Bows"],
  ["brawling", "Brawling"],
  ["reason", "Reason"],
  ["faith", "Faith"],
  ["authority", "Authority"],
  ["armor", "Armor"],
  ["riding", "Riding"],
  ["flying", "Flying"]
];

export const TALENTS = TALENT_DEFS.map(([id, name]) => ({
  id,
  name,
  img: `modules/${MODULE_ID}/assets/talents/${id}.${IMAGE_EXT}`
}));

// Default for the world setting "Budding Talent threshold": the lifetime
// points that must be invested in a Budding talent to turn it into a Strength.
export const DEFAULT_BUDDING_THRESHOLD = 12;
