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
- Each talent row shows: talent icon, name, Strength/Weakness icon, Budding icon, XP (`0/6`),
  `+`, rank icon and rank dropdown, laid out as 8 equal-width columns (long names wrap).
- In edit mode, click the Strength/Weakness icon slot to cycle Neutral/Strength/Weakness and
  the Budding slot to toggle Budding. The rank dropdown and XP pool are also edit-mode only.

## Rank costs
| E | E+ | D | D+ | C | C+ | B | B+ | A | A+ |
|---|----|---|----|---|----|---|----|---|----|
| 1 | 2  | 4 | 6  | 8 | 10 | 12| 14 | 16| 18 |

## Images
Place your images in the folders below. Sizes are set in `styles/ranks.css` and keep each type's
ratio: talent icons 45x45, Strength/Weakness 94x94, Budding 174x158, rank 112x120.
- `assets/talents/<id>.png` (swords, lances, axes, bows, brawling, reason, faith, authority, armor, riding, flying)
- `assets/ranks/<file>.png` (`e`, `e-plus`, `d`, `d-plus`, `c`, `c-plus`, `b`, `b-plus`, `a`, `a-plus`, `s`)

- `assets/traits/strength.png` and `assets/traits/weakness.png`
- `assets/budding/budding-0.png` to `budding-3.png` (0/3, 1/3, 2/3, 3/3 complete).
  The icon advances every third of the Budding threshold (every 4 points by default).

If you use another format, change `IMAGE_EXT` in `scripts/config.js`.

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

## Foundry updates
The module manifest is served from:
`https://raw.githubusercontent.com/LandonGraham/three-houses-ranks/main/module.json`

After this branch is merged into `main`, tag a release as `v0.1.0` (matching
the version in `module.json`) to have GitHub Actions create a GitHub Release
with `three-houses-ranks.zip`. Later releases should use a new version in both
the manifest and tag. Foundry's automatic updater requires the repository and
release asset to be publicly readable.
