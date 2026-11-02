// sheet-tab.js
// ---------------------------------------------------------------------------
// Adds the "Talents" tab to the dnd5e Character and NPC sheets.
//
// There are three jobs:
//   1. registerSheetTab(): tell the dnd5e sheet classes about a new tab and a
//      new template "part" for it.
//   2. buildContext(): gather the data the template needs for one actor.
//   3. attachListeners(): make the buttons and fields in the tab work.
//
// NOTE: dnd5e's sheet internals can change between versions. If the tab does
// not appear, the lines marked "VERIFY" are the first places to check.
// ---------------------------------------------------------------------------

import {
  MODULE_ID,
  TALENTS,
  RANKS,
  TRAITS,
  SUPPORTED_ACTOR_TYPES
} from "./config.js";
import { rankIndex, isMaxRank, canPromote } from "./progression.js";
import {
  getTalent,
  getPool,
  getBuddingThreshold,
  setPool,
  promoteTalent,
  editTalentField
} from "./actor-data.js";
import { AllocationApp } from "./allocation-app.js";

// The internal name of our tab (used for the tab button and the template part).
const TAB_ID = "three-houses-talents";

// ---------------------------------------------------------------------------
// 1. Register the tab on the sheet classes
// ---------------------------------------------------------------------------
export function registerSheetTab() {
  // VERIFY: dnd5e exposes its sheet classes here in v5+.
  const sheets = dnd5e.applications.actor;
  const targets = [sheets.CharacterActorSheet, sheets.NPCActorSheet];

  for (const SheetClass of targets) {
    if (!SheetClass) continue;

    // Add the tab button. VERIFY: dnd5e describes its tabs as a list of
    // { tab, label, icon } objects in the static TABS property.
    SheetClass.TABS.push({
      tab: TAB_ID,
      label: "THR.Tab.Title",
      icon: "fa-solid fa-ranking-star"
    });

    // Add the tab's content area. A "part" is one piece of the sheet that is
    // drawn from its own template. `container` puts it beside the other tabs.
    SheetClass.PARTS[TAB_ID] = {
      container: { classes: ["tab-body"], id: "tabs" },
      template: `modules/${MODULE_ID}/templates/talents-tab.hbs`,
      scrollable: [""]
    };

    // Wrap the sheet's _preparePartContext (the function that supplies data
    // to each part's template) so our part also receives our data.
    const original = SheetClass.prototype._preparePartContext;
    SheetClass.prototype._preparePartContext = async function (partId, context, options) {
      const result = await original.call(this, partId, context, options);
      if (partId === TAB_ID) Object.assign(result, buildContext(this));
      return result;
    };
  }

  // Every time any actor sheet draws, hook our click/change listeners in.
  Hooks.on("renderActorSheetV2", onRenderSheet);
}

// Is the sheet currently in edit mode? (dnd5e has a play mode and an edit
// mode, switched by the padlock-style toggle.) VERIFY: `_mode` and `MODES`.
function isEditMode(sheet) {
  const modes = sheet.constructor.MODES;
  if (sheet._mode === undefined || !modes) return sheet.isEditable;
  return sheet._mode === modes.EDIT;
}

// ---------------------------------------------------------------------------
// 2. Build the data for the template
// ---------------------------------------------------------------------------
function buildContext(sheet) {
  const actor = sheet.actor;
  const owner = actor.isOwner; // only owners may change anything
  const editMode = owner && isEditMode(sheet);
  const pool = getPool(actor);
  const threshold = getBuddingThreshold();

  // One "row" of display data per talent.
  const rows = TALENTS.map((def) => {
    const t = getTalent(actor, def.id);
    const atMax = isMaxRank(t);

    return {
      id: def.id,
      name: def.name,
      img: def.img,
      rank: t.rank,
      rankImg: RANKS[rankIndex(t.rank)].img,
      atMax,
      allocated: t.allocated,
      invested: t.invested,
      cost: t.cost,
      // Width of the progress bar, 0-100.
      percent: atMax ? 100 : Math.min(100, Math.round((t.allocated / t.cost) * 100)),
      // "+" works any time (not just edit mode) but needs points to spend and
      // room left in the bar.
      canAllocate: owner && !atMax && pool > 0 && t.allocated < t.cost,
      canPromote: owner && canPromote(t),
      trait: t.trait,
      isStrength: t.trait === TRAITS.STRENGTH,
      isWeakness: t.trait === TRAITS.WEAKNESS,
      budding: t.budding,
      // A Strength cannot be a Budding Talent, so the checkbox is disabled.
      buddingDisabled: t.trait === TRAITS.STRENGTH,
      buddingPercent: Math.min(100, Math.round((t.invested / threshold) * 100)),
      // Dropdown options, with the current value pre-selected.
      rankOptions: RANKS.map((r) => ({ id: r.id, label: r.label, selected: r.id === t.rank })),
      traitOptions: [
        { id: TRAITS.NONE, label: "THR.Trait.None", selected: t.trait === TRAITS.NONE },
        { id: TRAITS.STRENGTH, label: "THR.Trait.Strength", selected: t.trait === TRAITS.STRENGTH },
        { id: TRAITS.WEAKNESS, label: "THR.Trait.Weakness", selected: t.trait === TRAITS.WEAKNESS }
      ]
    };
  });

  // Everything is stored under `thr` so it can't clash with dnd5e's own data.
  return { thr: { pool, owner, editMode, threshold, rows } };
}

// ---------------------------------------------------------------------------
// 3. Make the tab interactive
// ---------------------------------------------------------------------------
function onRenderSheet(sheet, html) {
  // Ignore vehicles, groups, etc.
  if (!SUPPORTED_ACTOR_TYPES.includes(sheet.actor?.type)) return;

  // Find our tab's content in the freshly drawn sheet.
  const root = html.querySelector(`[data-application-part="${TAB_ID}"]`);
  if (!root) return;

  // The sheet can redraw only parts of itself, so make sure we only attach
  // listeners once per element (otherwise every click would fire twice).
  if (root.dataset.thrBound) return;
  root.dataset.thrBound = "true";

  // One listener for ALL buttons in the tab ("event delegation"): we look at
  // which element was clicked using its data-thr-action attribute.
  root.addEventListener("click", (event) => {
    const button = event.target.closest("[data-thr-action]");
    if (!button || button.disabled) return;
    const talentId = button.closest("[data-talent-id]")?.dataset.talentId;

    if (button.dataset.thrAction === "allocate") {
      new AllocationApp(sheet.actor, talentId).render({ force: true });
    } else if (button.dataset.thrAction === "promote") {
      promoteTalent(sheet.actor, talentId);
    }
  });

  // One listener for ALL inputs/dropdowns: fires when the user changes a value.
  root.addEventListener("change", (event) => {
    const input = event.target.closest("[data-thr-field]");
    if (!input) return;

    const field = input.dataset.thrField;
    // Checkboxes give true/false, everything else gives text.
    const value = input.type === "checkbox" ? input.checked : input.value;

    if (field === "pool") {
      setPool(sheet.actor, value);
      return;
    }
    const talentId = input.closest("[data-talent-id]")?.dataset.talentId;
    editTalentField(sheet.actor, talentId, field, value);
  });
}
