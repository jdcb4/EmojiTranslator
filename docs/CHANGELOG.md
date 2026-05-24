# Changelog

Notable changes by version. Newest entries go at the top.

## 0.35.1 - 2026-05-24

- Fixed the black-flag concept so pirate and pirates map to the full pirate-flag emoji instead of plain black flags.
- Regenerated game clues after the pirate mapping correction.

## 0.35.0 - 2026-05-24

- Added Box Office Mojo's top 1,000 domestic lifetime grosses as a high-recognition movie source for game clue generation.
- Regenerated the game clue dataset with 1,030 accepted clues, including 180 accepted high-recognition movie clues.
- Weighted random clue selection to double high-recognition clues and double clues with three or more emoji.

## 0.34.0 - 2026-05-24

- Removed the total clue count from the game UI.
- Updated clue sharing to include a Wordle-style text block with instructions, emoji clue, and share link.
- Added static hash navigation so the game remains the landing page and links to the Emoji Translator at `#translator`.
- Added a translator link back to the game.

## 0.33.0 - 2026-05-24

- Added stable six-letter clue codes to the generated game dataset.
- Added static share URLs using `?clue=CODE` so specific clues can be opened without a backend.
- Added a game share action that uses the phone share sheet when available and falls back to copying the clue link.

## 0.32.0 - 2026-05-24

- Added the first emoji-title guessing game fork backed by a static generated clue dataset.
- Added Wikidata corpus-fetching and game-dataset generation scripts for movie, TV, and book titles.
- Added title-answer normalisation and typo-tolerant matching for punctuation-insensitive near hits.

## 0.31.0 - 2026-05-24

- Simplified result-card labels by renaming `Result` to `Emojified title`.
- Removed redundant Clipboard and Match quality panel titles.
- Renamed the submit button to `Emojify!`.

## 0.30.0 - 2026-05-24

- Removed the visible scroll behavior from the emoji output line.
- Kept clipboard and match-quality panels side by side on mobile.

## 0.29.0 - 2026-05-24

- Improved the mobile result card layout so long emoji strings sit above the clipboard and match-quality controls.
- Standardised the clipboard and match-quality panels with matching sizing and alignment.

## 0.28.1 - 2026-05-24

- Consolidated OpenRouter candidate-review scripts onto the shared helper module.
- Added data-tooling documentation for corpus analysis, LLM review, Unicode ingestion, flag enrichment, and homophone regeneration.
- Updated coverage documentation with the current 250-title sample result.

## 0.28.0 - 2026-05-24

- Added a reviewed `mary -> marry` homophone mapping to the wedding emoji `💒`.
- Added regression coverage for the Mary/marry rebus mapping.

## 0.27.0 - 2026-05-24

- Mapped `swear` and common inflections to the red exclamation mark `❗`.
- Added a regression test for direct `Swear` conversion.

## 0.26.0 - 2026-05-24

- Promoted `strangelove` to a reviewed compound rule as `strange + love` -> `❓❤️`.
- Added a regression test so `Strangelove` is accepted in strict mode rather than only appearing as a weak programmatic fallback.

## 0.25.0 - 2026-05-24

- Added a reviewed `infinity`/`infinite` mapping to the infinity symbol `♾️`.
- Added a regression test for direct infinity conversion.

## 0.24.0 - 2026-05-24

- Added repeatable flag augmentation tooling using REST Countries metadata.
- Enriched all 259 regional-indicator flag concepts with short codes, country or region names, alternate spellings, capitals, and demonyms where available.
- Added special-region metadata for Unicode regional flags that are not returned by REST Countries.
- Prevented short flag codes from being used as generated part-word chunks while keeping them available as full-word mappings.
- Regenerated pronunciation homophones after the enlarged flag mapping set.

## 0.23.0 - 2026-05-24

- Added explicit mappings for `it`/`IT` -> `💻`, `how` -> `❓`, `buy` -> `🛒`, and `bye` -> `👋`.
- Added reviewed rebus homophones for `by`/`bys` via `buy`, and `bi` via `bye`.
- Added regression tests for these short-word and by-style homophone mappings.

## 0.22.0 - 2026-05-24

- Added repeatable promotion tooling for high-confidence LLM-reviewed corpus candidates.
- Tested the supplied 250-title movie corpus before and after LLM-assisted mapping expansion.
- Promoted 89 movie-corpus-derived mappings: 68 concepts, 6 homophones, and 15 part-word rules.
- Regenerated pronunciation homophones after the new concept mappings were added.

## 0.21.0 - 2026-05-24

- Added a copy-to-clipboard icon button beside the emoji output.
- Expanded sample titles with longer accepted examples.
- Removed a duplicate package dependency entry.

## 0.20.0 - 2026-05-24

- Simplified the frontend to a hybrid-only title translator with no visible API, mode, or difficulty controls.
- Moved the emoji result above the input form and replaced technical confidence/accepted fields with human-readable match-quality labels.
- Replaced weak-match warnings with a single stronger no-match message.
- Collapsed token rule explanations behind a closed-by-default rules panel.
- Added extra mobile bottom spacing so the title input remains usable when phone keyboards appear.

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
