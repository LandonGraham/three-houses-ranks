// actor-data.js
// ---------------------------------------------------------------------------
// The bridge between the pure rules (progression.js) and real Foundry actors.
// It reads and writes the data saved on an actor, and fires the module's
// hooks so other modules/macros can react.
//
// Where data is saved: Foundry lets modules attach "flags" to any document.
// Ours live at   actor.flags["three-houses-ranks"]   and look like:
//   { pool: 4, talents: { swords: {rank, allocated, ...}, riding: {...} } }
// ---------------------------------------------------------------------------

import { MODULE_ID, TALENTS } from "./config.js";
import * as rules from "./progression.js";

// Read the budding threshold from the world setting (default 12).
export function getBuddingThreshold() {
  return game.settings.get(MODULE_ID, "buddingThreshold");
}

// How many unallocated XP points the actor has.
export function getPool(actor) {
  return actor.getFlag(MODULE_ID, "pool") ?? 0;
}

// Get one talent's state. normalizeTalent fills in defaults, so a talent that
// was never touched still returns rank E with 0 points.
export function getTalent(actor, talentId) {
  const saved = actor.getFlag(MODULE_ID, `talents.${talentId}`);
  return rules.normalizeTalent(saved ?? {});
}

// Is this a talent id we know about? Guards against typos in macros.
function isKnownTalent(talentId) {
  return TALENTS.some((t) => t.id === talentId);
}

// Save a new state for one talent (and optionally the pool) in ONE update, so
// the two can never get out of sync. Then fire the right hooks.
async function saveTalent(actor, talentId, newTalent, { pool, previous } = {}) {
  const updates = {
    [`flags.${MODULE_ID}.talents.${talentId}`]: newTalent
  };
  if (pool !== undefined) updates[`flags.${MODULE_ID}.pool`] = pool;

  await actor.update(updates);

  // Tell other modules the rank changed (only if it really did).
  if (previous && previous.rank !== newTalent.rank) {
    Hooks.callAll(
      "threeHousesRanks.rankChanged",
      actor,
      talentId,
      previous.rank,
      newTalent.rank
    );
  }
}

// After any change that could add points or set the Budding flag, check if the
// Budding Talent is complete. If it is, turn it into a Strength.
async function checkBudding(actor, talentId, talent) {
  const { talent: updated, completed } = rules.applyBudding(
    talent,
    getBuddingThreshold()
  );
  if (!completed) return talent;

  await saveTalent(actor, talentId, updated);
  Hooks.callAll("threeHousesRanks.buddingCompleted", actor, talentId);
  ui.notifications.info(
    game.i18n.format("THR.BuddingCompleted", {
      actor: actor.name,
      talent: TALENTS.find((t) => t.id === talentId).name
    })
  );
  return updated;
}

// Set the unallocated pool directly (used by the pool field and by DM macros).
export async function setPool(actor, value) {
  const pool = Math.max(0, Math.trunc(Number(value)) || 0);
  await actor.update({ [`flags.${MODULE_ID}.pool`]: pool });
}

// Add (or subtract, with a negative number) points to the pool.
export async function addToPool(actor, amount) {
  await setPool(actor, getPool(actor) + Math.trunc(Number(amount) || 0));
}

// Lock in `amount` points from the pool into a talent (allocation dialog's
// Confirm button). Returns true on success.
export async function commitAllocation(actor, talentId, amount) {
  if (!isKnownTalent(talentId)) return false;

  const previous = getTalent(actor, talentId);
  const result = rules.commitAllocation(previous, getPool(actor), amount);
  if (!result) return false; // invalid request, nothing is changed

  await saveTalent(actor, talentId, result.talent, {
    pool: result.pool,
    previous
  });
  await checkBudding(actor, talentId, result.talent);
  return true;
}

// Move a talent to its next rank (only works when the bar is full).
export async function promoteTalent(actor, talentId) {
  if (!isKnownTalent(talentId)) return false;

  const previous = getTalent(actor, talentId);
  const promoted = rules.promote(previous);
  if (!promoted) return false;

  await saveTalent(actor, talentId, promoted, { previous });
  return true;
}

// Edit one field of a talent directly (edit mode only on the sheet).
// `field` is one of: rank, trait, budding, allocated, invested.
export async function editTalentField(actor, talentId, field, value) {
  if (!isKnownTalent(talentId)) return false;

  const previous = getTalent(actor, talentId);
  let next = previous;

  switch (field) {
    case "rank":
      next = rules.setRank(previous, value);
      break;
    case "trait":
      next = rules.setTrait(previous, value);
      break;
    case "budding":
      next = rules.setBudding(previous, value);
      if (!next) {
        // A Strength can't be Budding, so tell the user why nothing happened.
        ui.notifications.warn(game.i18n.localize("THR.StrengthCannotBud"));
        return false;
      }
      break;
    case "allocated":
    case "invested":
      // Whole numbers, never negative.
      next = { ...previous, [field]: Math.max(0, Math.trunc(Number(value)) || 0) };
      break;
    default:
      return false;
  }

  await saveTalent(actor, talentId, next, { previous });
  await checkBudding(actor, talentId, next);
  return true;
}
