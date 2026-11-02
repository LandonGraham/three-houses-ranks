// settings.js
// ---------------------------------------------------------------------------
// Registers the module's world settings. "World" settings are shared by
// everyone in the game and only the GM can change them.
// ---------------------------------------------------------------------------

import { MODULE_ID, DEFAULT_BUDDING_THRESHOLD } from "./config.js";

export function registerSettings() {
  game.settings.register(MODULE_ID, "buddingThreshold", {
    name: "THR.Settings.BuddingThreshold.Name",
    hint: "THR.Settings.BuddingThreshold.Hint",
    scope: "world", // shared by the whole world, GM-editable
    config: true, // show it in the Module Settings window
    type: Number,
    default: DEFAULT_BUDDING_THRESHOLD,
    range: { min: 1, max: 100, step: 1 }
  });
}
