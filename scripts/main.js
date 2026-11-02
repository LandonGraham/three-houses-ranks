// main.js
// ---------------------------------------------------------------------------
// The entry point. module.json lists this file under "esmodules", so Foundry
// loads it automatically. It does nothing itself except register the other
// pieces at the right moment in Foundry's startup sequence.
//
// Foundry startup order: "init" -> "setup" -> "ready". We use "Hooks.once",
// which means "run this function the first time that event happens".
// ---------------------------------------------------------------------------

import { MODULE_ID } from "./config.js";
import { registerSettings } from "./settings.js";
import { registerSheetTab } from "./sheet-tab.js";
import { api } from "./api.js";

// "init": the earliest point where settings can be registered.
Hooks.once("init", () => {
  registerSettings();
});

// "setup": the dnd5e system is loaded, so its sheet classes exist and we can
// add our tab to them before any sheet is drawn.
Hooks.once("setup", () => {
  registerSheetTab();
});

// "ready": everything is loaded. Publish the API for macros and other modules.
Hooks.once("ready", () => {
  game.modules.get(MODULE_ID).api = api;
});
