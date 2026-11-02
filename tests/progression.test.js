// Unit tests for the rules in scripts/progression.js.
// Run them with:  npm test
// They use Node's built-in test runner, so nothing needs to be installed.

import test from "node:test";
import assert from "node:assert/strict";
import {
  getCost,
  createTalent,
  commitAllocation,
  maxAllocatable,
  canPromote,
  promote,
  setTrait,
  setBudding,
  applyBudding,
  rankIndex
} from "../scripts/progression.js";

test("cost table, Strength and Weakness edge cases", () => {
  assert.equal(getCost(rankIndex("C+"), "none"), 10);
  assert.equal(getCost(rankIndex("C+"), "strength"), 8); // one rank lower
  assert.equal(getCost(rankIndex("E"), "strength"), 1); // floor of 1
  assert.equal(getCost(rankIndex("A+"), "weakness"), 20); // ceiling of 20
  assert.equal(getCost(rankIndex("E"), "weakness"), 2);
  assert.equal(getCost(rankIndex("S"), "none"), null); // no cost at S
});

test("commit is capped by pool and by the remaining bar", () => {
  const talent = createTalent(); // E costs 1
  assert.equal(maxAllocatable({ ...talent, cost: 4, allocated: 1 }, 10), 3);
  assert.equal(maxAllocatable({ ...talent, cost: 4 }, 2), 2);
  assert.equal(commitAllocation({ ...talent, cost: 4 }, 10, 5), null);
  const result = commitAllocation({ ...talent, cost: 4 }, 10, 3);
  assert.equal(result.pool, 7);
  assert.equal(result.talent.allocated, 3);
  assert.equal(result.talent.invested, 3);
});

test("rank S cannot receive points", () => {
  const s = { ...createTalent(), rank: "S", cost: null };
  assert.equal(maxAllocatable(s, 99), 0);
  assert.equal(commitAllocation(s, 99, 1), null);
});

test("promote needs a full bar, resets progress, keeps invested", () => {
  let t = { ...createTalent(), cost: 2, allocated: 1, invested: 1 };
  assert.equal(canPromote(t), false);
  t = { ...t, allocated: 2, invested: 2 };
  assert.equal(canPromote(t), true);
  const next = promote(t);
  assert.equal(next.rank, "E+");
  assert.equal(next.allocated, 0);
  assert.equal(next.invested, 2);
  assert.equal(next.cost, 2); // E+ -> D costs 2
});

test("Budding completes mid-rank without changing the current bar", () => {
  const t = {
    ...createTalent(),
    rank: "C",
    cost: 8,
    allocated: 5,
    invested: 12,
    budding: true
  };
  const { talent, completed } = applyBudding(t, 12);
  assert.equal(completed, true);
  assert.equal(talent.trait, "strength");
  assert.equal(talent.budding, false);
  assert.equal(talent.allocated, 5); // unchanged
  assert.equal(talent.cost, 8); // unchanged
  // The Strength only applies to the NEXT rank (C -> C+ done, then C+ -> B: 10 becomes 8).
  const next = promote({ ...talent, allocated: 8 });
  assert.equal(next.rank, "C+");
  assert.equal(next.cost, 8);
});

test("Weakness + Budding becomes a Strength", () => {
  const t = { ...createTalent(), trait: "weakness", budding: true, invested: 12 };
  assert.equal(applyBudding(t, 12).talent.trait, "strength");
});

test("a Strength cannot be Budding", () => {
  const strong = setTrait(createTalent(), "strength");
  assert.equal(setBudding(strong, true), null);
  // Making a Budding talent a Strength clears the flag.
  const budding = setBudding(createTalent(), true);
  assert.equal(setTrait(budding, "strength").budding, false);
});

test("a trait change never alters the stored cost", () => {
  const t = { ...createTalent(), rank: "C+", cost: 10 };
  assert.equal(setTrait(t, "strength").cost, 10);
});
