// allocation-app.js
// ---------------------------------------------------------------------------
// The pop-up window opened by the "+" button on a talent row, modelled on
// dnd5e's Ability Score Improvement prompt. The player picks how many points
// to move from their unallocated pool into the talent. Nothing is saved until
// they press Confirm, and once confirmed the points are locked in for good.
//
// This is a Foundry "ApplicationV2" window rendered with a Handlebars
// template (templates/allocation-dialog.hbs).
// ---------------------------------------------------------------------------

import { MODULE_ID, TALENTS, RANKS } from "./config.js";
import { rankIndex, maxAllocatable } from "./progression.js";
import { getTalent, getPool, commitAllocation } from "./actor-data.js";

// Foundry provides these building blocks. The "mixin" adds Handlebars
// template support to the basic ApplicationV2 window.
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class AllocationApp extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(actor, talentId, options = {}) {
    // A unique id per actor+talent stops duplicate windows from opening.
    super({ id: `${MODULE_ID}-allocate-${actor.id}-${talentId}`, ...options });
    this.actor = actor;
    this.talentId = talentId;
    // Points the user has chosen in this window but not yet confirmed.
    this.pending = 0;
  }

  // Window settings, and the functions run by buttons with data-action="...".
  static DEFAULT_OPTIONS = {
    classes: [MODULE_ID, "thr-allocation"],
    position: { width: 340, height: "auto" },
    window: { icon: "fa-solid fa-plus" },
    actions: {
      increase: AllocationApp.onIncrease,
      decrease: AllocationApp.onDecrease,
      max: AllocationApp.onMax,
      confirm: AllocationApp.onConfirm,
      cancel: AllocationApp.onCancel
    }
  };

  // Which template draws the window contents.
  static PARTS = {
    body: { template: `modules/${MODULE_ID}/templates/allocation-dialog.hbs` }
  };

  // The window title, e.g. "Allocate Points: Swords".
  get title() {
    const talent = TALENTS.find((t) => t.id === this.talentId);
    return game.i18n.format("THR.Allocate.Title", { talent: talent.name });
  }

  // How many points this window may currently add (re-read from the actor so
  // it stays correct if the pool changed while the window was open).
  get limit() {
    return maxAllocatable(getTalent(this.actor, this.talentId), getPool(this.actor));
  }

  // Builds the data handed to the template each time the window draws.
  async _prepareContext() {
    const def = TALENTS.find((t) => t.id === this.talentId);
    const talent = getTalent(this.actor, this.talentId);
    const pool = getPool(this.actor);

    // Keep the pending value inside the allowed range.
    this.pending = Math.min(this.pending, this.limit);

    const filled = talent.allocated + this.pending;
    return {
      talent: def,
      rankImg: RANKS[rankIndex(talent.rank)].img,
      rank: talent.rank,
      cost: talent.cost,
      allocated: talent.allocated,
      pending: this.pending,
      poolLeft: pool - this.pending, // counts down live as points are chosen
      percent: Math.round((filled / talent.cost) * 100),
      canIncrease: this.pending < this.limit,
      canDecrease: this.pending > 0,
      canConfirm: this.pending > 0
    };
  }

  // --- Button handlers. Inside these, `this` is the window. ---------------

  static onIncrease() {
    if (this.pending < this.limit) this.pending += 1;
    this.render();
  }

  // The minus button only lowers the points chosen in THIS window. It can
  // never touch points that were already locked in earlier.
  static onDecrease() {
    if (this.pending > 0) this.pending -= 1;
    this.render();
  }

  // Shortcut: choose as many points as allowed.
  static onMax() {
    this.pending = this.limit;
    this.render();
  }

  // Save the choice for good and close the window.
  static async onConfirm() {
    if (this.pending <= 0) return;
    const ok = await commitAllocation(this.actor, this.talentId, this.pending);
    if (ok) this.close();
  }

  // Close without saving anything.
  static onCancel() {
    this.close();
  }
}
