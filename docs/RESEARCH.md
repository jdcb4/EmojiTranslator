# Research Summary

Emoji movie quizzes commonly use several clue styles:

- Literal title words, such as `lion` to `🦁`.
- Rebus or sound-alike clues, such as `I` to `👁️`.
- Partial-word chunks, such as `before` to `🐝4️⃣`.
- Movie-specific iconic clues, such as using a ship/ice/romance sequence for `Titanic`.

The runtime converter is deterministic. It uses static JSON tables and does not call an LLM.

Current product focus is strict title and rebus conversion. Movie-specific iconic clues are deprecated for runtime use because they do not translate the title itself.

## Data-Source Plan

- Start with manually reviewed, highly recognisable emoji concepts in `src/data/converter/emoji-concepts.json`.
- Expand with movie-title-first coverage analysis from `src/data/converter/movie-title-test-set.json`.
- Add homophones only when they are common and fair in a quiz context.
- Treat `src/data/converter/movie-overrides.json` as archived reference data only.
- Keep LLM use limited to build-time suggestions that are reviewed before entering runtime data.

## Expansion Priorities

- Add mappings or explicit omissions for high-frequency title words reported by `pnpm run analyse:coverage`.
- Prefer strict/rebus mappings over title-specific overrides.
- Add validators for duplicate, ambiguous, or low-recognisability mappings as the tables grow.
