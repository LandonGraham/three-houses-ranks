// api.js
// ---------------------------------------------------------------------------
// The public "toolbox" that other modules and macros can use, for example to
// check a talent prerequisite for a weapon or mount. It is attached to the
// module as:   game.modules.get("three-houses-ranks").api
//
// Examples (in a macro):
//   const api = game.modules.get("three-houses-ranks").api;
//   api.meetsRank(actor, "riding", "C");   // true if Riding is C or higher
//   await api.addToPool(actor, 3);         // DM awards 3 XP points
// ---------------------------------------------------------------------------

import { RANKS, TALENTS } from "./config.js";
import { rankIndex } from "./progression.js";
import {
  getTalent,
  getPool,
  getBuddingThreshold,
  addToPool,
  setPool
} from "./actor-data.js";

export const api = {
  // The lists, in case other code wants to display them.
  RANKS,
  TALENTS,

  // The rank id ("B+") of a talent on an actor.
  getRank: (actor, talentId) => getTalent(actor, talentId).rank,

  // The rank as a number from 0 (E) to 10 (S), handy for comparing.
  getRankIndex: (actor, talentId) => rankIndex(getTalent(actor, talentId).rank),

  // True if the actor's rank is at least `minRank` (e.g. "C").
  meetsRank: (actor, talentId, minRank) =>
    rankIndex(getTalent(actor, talentId).rank) >= rankIndex(minRank),

  // Points still needed to leave the current rank (null at S).
  getCost: (actor, talentId) => getTalent(actor, talentId).cost,

  // "none", "strength" or "weakness".
  getTrait: (actor, talentId) => getTalent(actor, talentId).trait,

  // Is this talent currently a Budding Talent?
  isBudding: (actor, talentId) => getTalent(actor, talentId).budding,

  // Unallocated XP pool helpers (useful for DM macros).
  getPool,
  addToPool,
  setPool,

  // The global Budding threshold from the module settings.
  getBuddingThreshold
};
