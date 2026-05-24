# Changelog

Notable changes by version. Newest entries go at the top.

## 0.19.0 - 2026-05-24

- Added a Node/Railway API entrypoint alongside the existing Cloudflare Worker API.
- Added public API rate limiting with bearer-token admin bypass.
- Added API documentation covering request/response shape, auth, rate-limit headers, and errors.
- Split frontend/API build scripts so the monorepo can produce static frontend and backend-only API artifacts.
- Lazy-loaded the local converter in the frontend so the initial app shell is lighter.

## 0.18.0 - 2026-05-24

- Incorporated a conservative subset of the supplied external rebus/homophone libraries.
- Added 56 reviewed explicit homophone mappings, including `meet -> meat`, `whole -> hole`, `our -> hour`, and `won -> one`.
- Added 8 reviewed partial-word rebus rules, including `season`, `notice`, `belief`, `focus`, `cabin`, `super`, `carpet`, and `decade`.
- Wrote an ignored import summary at `review/external-rebus-library-import-summary.json`.

## 0.17.0 - 2026-05-24

- Added a generated exact-pronunciation dictionary homophone fallback for rebus mode.
- Added `cmu-pronouncing-dictionary` as a development-time generator dependency.
- Added `pnpm run generate:homophones` to regenerate the static pronunciation homophone table.
- Documented that the frontend can run as static assets, with the Hono API remaining optional.

## 0.16.0 - 2026-05-23

- Added an experimental option to pick the strongest ambiguous part-word phonetic candidate instead of rejecting the chunk.
- Added a comparison script for measuring broad-corpus coverage with ambiguous part-word phonetic matching enabled or disabled.

## 0.15.0 - 2026-05-23

- Added an experimental whole-word Double Metaphone fallback behind `allowPhoneticWords`.
- Added a comparison script for measuring broad-corpus coverage with whole-word phonetic matching enabled or disabled.

## 0.14.0 - 2026-05-23

- Added a Unicode Emoji 17.0 ingestion pipeline for official base emoji definitions.
- Added OpenRouter tooling to produce validated one-word primary meanings and aliases for Unicode emoji.
- Added promotion tooling to merge Unicode-derived concepts into the static converter data.
- Promoted 1,747 Unicode-derived base emoji concepts, bringing the runtime concept table to 1,923 entries.

## 0.13.0 - 2026-05-23

- Promoted the approved high-confidence LLM candidate batch into reviewed static mappings.
- Added reviewed plural handling for `rings` and `shoes`, plus a combo clue for `band`.
- Added a repeatable LLM suggestion summary script that includes emoji outputs for manual-review items.

## 0.12.0 - 2026-05-23

- Added repeatable review-only corpus fetching for public movie and book title lists.
- Added OpenRouter batch review tooling for high-frequency unmapped candidate words, writing suggestions to ignored `review/` artifacts without mutating runtime mappings.
- Documented the expanded corpus and LLM review commands.

## 0.11.0 - 2026-05-23

- Added `Shawshank` part-word fallback support as `shaw -> shore` plus `shank -> knife`, producing `🏖️🔪`.
- Updated hybrid tie-breaking to prefer the candidate that maps more title words when confidence is equal.
- Added review-only corpus analysis and candidate-generation scripts for scaling coverage mining across larger title lists.
- Documented a wider corpus-mining plan for identifying direct mappings, homophones, and part-word candidates across larger movie and book title sets.

## 0.10.0 - 2026-05-23

- Added a bounded programmatic part-word rebus fallback for unmapped words after reviewed rules are exhausted.
- Added hyphenation and phonetic matching dependencies for syllable-like segmentation and conservative sound-alike chunk matching.
- Added general `rest`, `knee`, and `mow` mappings plus focused fallback tests for `Forrest`, `Nemo`, `Truman`, and weak-reject behavior.

## 0.9.0 - 2026-05-23

- Added a singing-specific mapping so `sing`, `singin`, and `singing` use `🎤🎵` instead of a generic music note.
- Updated tests and generated title outputs for `Singin' in the Rain`.

## 0.8.0 - 2026-05-23

- Added an explicit connector-symbol rule so `and` is represented by `+`.
- Updated tests and generated title outputs for titles such as `Beauty and the Beast`.

## 0.7.0 - 2026-05-23

- Added a general plural repetition rule so plural title words use multiple singular emoji, such as `Cars` -> `🚗🚗`.
- Added tests and ruleset documentation for plural concepts such as `Cars` and `Aliens`.

## 0.6.0 - 2026-05-23

- Added reviewed partial-word rebus examples for `Forrest`, `Truman`, and `Nemo`.
- Documented the current syllable/part-word architecture and its runtime limits.

## 0.5.0 - 2026-05-23

- Expanded strict/rebus coverage from 21 accepted starter titles to 86 accepted titles out of 100.
- Added reviewed mappings for common title words including star, war, park, knight, lamb, wall, street, hotel, black, panther, doctor, galaxy, knife, runner, music, notebook, blood, inside/out, mission, impossible, and more.
- Added compound rules for `godfather`, `braveheart`, `goodfellas`, `ghostbusters`, `robocop`, and `casablanca`.
- Left proper names and invented names unmapped where a title-faithful strict/rebus clue would be misleading.

## 0.4.0 - 2026-05-23

- Added a phrase-level small-number-plus-noun rule, such as `Three Kings` -> `👑👑👑`.
- Documented compound phrase expansion rules and near-term candidate patterns.

## 0.3.0 - 2026-05-23

- Deprecated movie-clue mode as an active runtime option.
- Updated hybrid mode to rank strict and rebus candidates only.
- Added strict/rebus mappings for `I`, `before`, `back`, `to`, and `future` examples.
- Added a ruleset expansion plan for strict and rebus coverage growth.

## 0.2.0 - 2026-05-23

- Added the deterministic movie-title-to-emoji conversion engine.
- Added editable static JSON tables for emoji concepts, homophones, compounds, movie overrides, and a 100-title coverage set.
- Added the React converter UI with strict, rebus, movie-clue, and hybrid modes.
- Added an optional Hono API endpoint for `POST /api/convert` targeting Cloudflare Workers.
- Added coverage analysis with `pnpm run analyse:coverage`.
- Added research and coverage documentation.

## 0.1.0 - 2026-05-23

- Initialised the EmojiTranslator Vite, React, and TypeScript app scaffold.
- Added pnpm scripts for development, typechecking, linting, formatting, testing, building, and verification.
- Added Tailwind CSS design tokens and starter UI primitives.
- Added Vitest and React Testing Library setup.
- Installed baseline project agent skills under `.agents/skills`.
- Updated project documentation to reflect the initial scaffold.
