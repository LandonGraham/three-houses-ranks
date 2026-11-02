# Three Houses Ranks for D&D 5th Edition

A Foundry VTT v14 module for the dnd5e system. It adds a **Talents** tab to
Character and NPC sheets (vehicles and groups are excluded).

## Features
- 11 talents, each ranked E, E+, D, D+, C, C+, B, B+, A, A+, S.
- A pool of **unallocated XP**; the `+` button opens a confirm-to-commit
  allocation window. Committed points are locked in permanently.
- A **Promote** button appears when a talent's progress bar is full (never automatic).
- **Strength** / **Weakness**: the next rank costs as if one rank lower / higher
  (minimum 1 point, maximum 20).
- **Budding Talent**: once 12 lifetime points (GM setting) are invested, it becomes a
  Strength. A trait change only affects *future* ranks, never the current bar.
- Ranks, traits, the pool and Budding can be edited directly in the sheet's edit mode.

## Rank costs
| E | E+ | D | D+ | C | C+ | B | B+ | A | A+ |
|---|----|---|----|---|----|---|----|---|----|
| 1 | 2  | 4 | 6  | 8 | 10 | 12| 14 | 16| 18 |

## Images
Place your 32x32 images in:
- `assets/talents/<id>.webp` (swords, lances, axes, bows, brawling, reason, faith, authority, armor, riding, flying)
- `assets/ranks/<file>.webp` (`e`, `e-plus`, `d`, `d-plus`, `c`, `c-plus`, `b`, `b-plus`, `a`, `a-plus`, `s`)

If you use PNG, change `IMAGE_EXT` in `scripts/config.js`.

## Macro / module API
```js
const api = game.modules.get("three-houses-ranks").api;
api.meetsRank(actor, "riding", "C");   // true if Riding is C or higher
await api.addToPool(actor, 3);          // award 3 XP points
```
Hooks: `threeHousesRanks.rankChanged (actor, talentId, oldRank, newRank)` and
`threeHousesRanks.buddingCompleted (actor, talentId)`.

## Development
- `npm test` runs the unit tests for the rules in `scripts/progression.js`.
- Install by copying this folder to `Data/modules/three-houses-ranks` in Foundry.
- The sheet integration (`scripts/sheet-tab.js`) has not yet been tested inside Foundry;
  see the `VERIFY` comments there if the tab does not appear.
