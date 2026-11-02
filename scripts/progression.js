// progression.js
// ---------------------------------------------------------------------------
// All the RULES of the module live here: how much a rank costs, how points
// are committed, how promotion works and when a Budding Talent completes.
//
// Every function here is "pure": it never touches Foundry or the actor. It
// receives a talent object, and returns a NEW talent object (or null when the
// action is not allowed). Keeping rules separate from the UI makes them easy
// to test (run `npm test`) and easy to read.
//
// A "talent state" object looks like this:
//   {
//     rank: "C+",        // current rank id
//     allocated: 3,      // points locked in toward the NEXT rank
//     invested: 15,      // lifetime points locked in (used by Budding)
//     trait: "none",     // "none" | "strength" | "weakness"
//     budding: false,    // is this a Budding Talent?
//     cost: 10           // points needed to leave the current rank (null at S)
//   }
// ---------------------------------------------------------------------------

import { RANKS, MAX_RANK_INDEX, TRAITS } from "./config.js";

// Points needed to advance FROM each rank, by rank index.
// Index 0 (E -> E+) costs 1, index 9 (A+ -> S) costs 18. S has no entry.
export const BASE_COSTS = [1, 2, 4, 6, 8, 10, 12, 14, 16, 18];

// A Weakness on the A+ rank would look one step past the table, so it is
// capped at this value instead.
export const WEAKNESS_CEILING = 20;

// Turn a rank id like "B+" into its number (0-10). Unknown ids become 0 (E).
export function rankIndex(rankId) {
  const found = RANKS.find((r) => r.id === rankId);
  return found ? found.index : 0;
}

// How many points are needed to advance from `index` to the next rank,
// given the talent's trait. Returns null for rank S (nothing left to buy).
//   - no trait:  use the normal table
//   - Strength:  treat the rank as ONE LOWER (but never below 1 point)
//   - Weakness:  treat the rank as ONE HIGHER (but never above 20 points)
export function getCost(index, trait) {
  if (index >= MAX_RANK_INDEX) return null;

  if (trait === TRAITS.STRENGTH) {
    return BASE_COSTS[Math.max(index - 1, 0)];
  }
  if (trait === TRAITS.WEAKNESS) {
    const harder = index + 1;
    // BASE_COSTS stops at index 9, so anything beyond it uses the ceiling.
    return harder >= BASE_COSTS.length ? WEAKNESS_CEILING : BASE_COSTS[harder];
  }
  return BASE_COSTS[index];
}

// A brand-new talent: rank E, no points, no trait.
export function createTalent() {
  return {
    rank: "E",
    allocated: 0,
    invested: 0,
    trait: TRAITS.NONE,
    budding: false,
    cost: getCost(0, TRAITS.NONE)
  };
}

// Fill in anything missing from saved data (for example a talent the actor
// has never touched) so the rest of the code can rely on every field existing.
export function normalizeTalent(raw = {}) {
  const base = createTalent();
  const talent = { ...base, ...raw };
  // If no cost was saved yet, work it out from the current rank and trait.
  if (raw.cost === undefined) {
    talent.cost = getCost(rankIndex(talent.rank), talent.trait);
  }
  return talent;
}

// Is this talent already at the top rank (S)?
export function isMaxRank(talent) {
  return rankIndex(talent.rank) >= MAX_RANK_INDEX;
}

// The most points the player may add right now: limited by how many points
// they have in the pool AND by how many are still missing in the progress bar.
export function maxAllocatable(talent, pool) {
  if (isMaxRank(talent) || talent.cost === null) return 0;
  return Math.max(0, Math.min(pool, talent.cost - talent.allocated));
}

// Lock in `amount` points from the pool into this talent. This is what the
// Confirm button of the allocation dialog calls. Committed points can never
// be taken back. Returns { talent, pool } or null if the request is invalid.
export function commitAllocation(talent, pool, amount) {
  if (!Number.isInteger(amount) || amount <= 0) return null;
  if (amount > maxAllocatable(talent, pool)) return null;

  return {
    talent: {
      ...talent,
      allocated: talent.allocated + amount,
      invested: talent.invested + amount
    },
    pool: pool - amount
  };
}

// The Promote button only appears when the progress bar is full.
export function canPromote(talent) {
  return (
    !isMaxRank(talent) && talent.cost !== null && talent.allocated >= talent.cost
  );
}

// Move to the next rank. The progress bar resets to 0 and the new cost is
// worked out from the trait the talent has RIGHT NOW. `invested` is kept.
export function promote(talent) {
  if (!canPromote(talent)) return null;
  const nextIndex = rankIndex(talent.rank) + 1;
  return {
    ...talent,
    rank: RANKS[nextIndex].id,
    allocated: 0,
    cost: getCost(nextIndex, talent.trait)
  };
}

// Directly set the rank (edit mode only). Progress resets and the cost is
// recalculated; lifetime `invested` is left alone.
export function setRank(talent, rankId) {
  const index = rankIndex(rankId);
  return {
    ...talent,
    rank: RANKS[index].id,
    allocated: 0,
    cost: getCost(index, talent.trait)
  };
}

// Change the trait (edit mode only). Note that `cost` is NOT changed: a new
// trait only affects FUTURE ranks, never the progress already in the bar.
// Making a talent a Strength also removes its Budding flag, because a
// Strength cannot be Budding.
export function setTrait(talent, trait) {
  const next = { ...talent, trait };
  if (trait === TRAITS.STRENGTH) next.budding = false;
  return next;
}

// Turn the Budding flag on or off. Returns null if the talent is a Strength,
// since a Strength can't also be Budding. (Weakness + Budding is allowed.)
export function setBudding(talent, on) {
  if (on && talent.trait === TRAITS.STRENGTH) return null;
  return { ...talent, budding: Boolean(on) };
}

// Check whether a Budding Talent has reached the threshold. If so it becomes
// a Strength (replacing any Weakness) and stops being Budding. Only `trait`
// and `budding` change: `allocated` and `cost` stay as they were, so the
// Strength helps from the NEXT rank onward.
// Returns { talent, completed } where `completed` says if it just happened.
export function applyBudding(talent, threshold) {
  const ready =
    talent.budding &&
    talent.trait !== TRAITS.STRENGTH &&
    talent.invested >= threshold;

  if (!ready) return { talent, completed: false };

  return {
    talent: { ...talent, trait: TRAITS.STRENGTH, budding: false },
    completed: true
  };
}
