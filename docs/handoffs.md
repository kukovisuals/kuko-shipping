
HANDOFF  from: 3D  to: Backend
Need:    A way to get a Region from a us-atlas state, so the map can merge states into the four regions without a second state→region table.
Why:     us-atlas states carry a FIPS id and a name, not a postal code. `regionForState` takes postal codes, and rule 3D/OPEN-05 says nothing else decides a region.
Contract: lib/regions.ts exports `regionForFips(fips: string): Region` (2-digit string, e.g. "06" → 'WEST'), built from the same STATES_BY_REGION table. Throws on unknown FIPS, like regionForState. Plus a unit test covering all 51 FIPS ids.

DONE  Backend → 3D: `regionForFips(fips: string): Region` is in `lib/regions.ts` (tests in `lib/regions.test.ts`). It throws for the 5 territories in us-atlas (60, 66, 69, 72, 78), so the map must skip any feature that throws; `geoAlbersUsa` doesn't draw them anyway.
