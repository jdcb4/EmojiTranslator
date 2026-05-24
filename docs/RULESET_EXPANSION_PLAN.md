# Ruleset Expansion Plan

The active converter modes are strict, rebus, and hybrid. Movie-specific clue overrides are deprecated for runtime use.

The current runtime rules are listed in `docs/RULESETS.md`. This file is for expansion workflow, candidate review, and future rule ideas.

## Goals

- Improve title-word coverage without using runtime AI.
- Keep mappings conservative, explainable, and editable.
- Prefer no clue over a misleading clue.
- Use build-time AI only to suggest candidates that are then validated and reviewed.

## Data Layers

1. Direct word mappings in `emoji-concepts.json`.
2. Curated synonyms in `emoji-concepts.json`.
3. Compound and partial-word rules in `compound-rules.json`.
4. Homophones in `homophones.json`.
5. Phrase-level composition rules in the converter engine.
6. Explicit ignore/connector behavior in the converter engine.

## Expansion Workflow

1. Run `pnpm run analyse:coverage`.
2. Sort unmapped words by frequency and by whether they are important content words.
3. For each word, choose one action:
   - add direct emoji mapping
   - add conservative synonym mapping
   - add homophone mapping
   - add compound/partial-word rule
   - mark as intentionally unmappable for review
4. Add targeted tests for each new rule category.
5. Re-run coverage and compare accepted/rejected counts.

## Candidate Review Rules

- Exact visual noun mappings can score high.
- Common title verbs and direction words can use symbols when familiar, such as `before` to `⬅️`, `back` to `↩️`, and `future` to `🔮`.
- Single-letter title tokens may use sound-alike rebus mappings when they are standard quiz conventions, such as `I` to `👁️`.
- Connector words stay ignored in strict mode unless there is a strong reason to map them.
- `and` maps to `+` because it preserves title structure without needing another emoji.
- Connector words may map in rebus mode when the clue is obvious, such as `to` to `2️⃣`.
- Abstract synonyms need lower scores and stronger review.

## Compound Phrase Rules

Phrase rules should run before single-token conversion when they preserve the title meaning better than separate token mappings.

### Small Number + Noun

Pattern: `[small number] [mappable noun]`

Examples:

- `Three Kings` -> `👑👑👑`
- `2 Cars` -> `🚗🚗`

Rules:

- Apply only for counts from 2 to 5.
- Apply only when the noun has a direct, plural, or curated synonym mapping.
- Do not apply to weak related-word mappings.
- Do not apply above 5 because long repeated emoji sequences become noisy.
- Keep larger numbers as numeric emoji, such as `Ocean's Eleven` -> `🌊1️⃣1️⃣`.

### Plural Noun Repetition

Pattern: `[plural mappable noun]`

Examples:

- `Cars` -> `🚗🚗`
- `Aliens` -> `👽👽`

Rules:

- Apply when a title token matches a reviewed plural form for a singular emoji concept.
- Repeat the singular emoji twice by default to signal plurality without inventing an exact count.
- Run after explicit `[small number] [noun]` phrase rules, so `Three Kings` still maps to exactly three crowns.
- Score slightly below an exact singular word because the quantity is implied rather than stated.
- Do not apply to weak related-word mappings.

Candidate future phrase patterns:

- `[color] [noun]`, such as `Black Panther` -> color marker + noun when both are title-faithful.
- `[direction/preposition] [noun]`, such as `Inside Out` or `Overboard`, using spatial emoji only when obvious.
- `[adjective] [noun]`, such as `Little Women`, where the adjective can be visualised without overloading the noun.
- `[noun] of [noun]`, where the connector can be ignored but the two nouns still compose cleanly.

### Reviewed Partial-Word Rebus

Pattern: one title token is split into reviewed sound-like or meaning-like chunks.

Examples:

- `Forrest` -> `forest` -> `🌲🌲`
- `Truman` -> `true + man` -> `✅👨`
- `Nemo` -> `knee + mow` -> `🦵🚜`

Rules:

- Apply in rebus mode, not strict mode.
- Store every split explicitly in `compound-rules.json`; do not auto-segment arbitrary words at runtime yet.
- Prefer two chunks over three or more.
- Use only visually recognisable chunks.
- Penalise as `partial_word` because the clue is more playful and less literal than strict title translation.
- Reject partial-word outputs when they are more confusing than the unmapped word.

## Build-Time AI Use

Use OpenRouter only for candidate generation or review assistance, never runtime conversion.

Default model: `google/gemini-3-flash-preview`.

Batch prompt shape:

```text
We are expanding a deterministic movie-title-to-emoji converter.
For each word, suggest only fair strict or rebus mappings.
Return JSON with directMappings, synonyms, homophones, compounds, rejectReason, and confidence.
Be conservative and do not force mappings.
```

Every generated suggestion must be deduplicated, validated, reviewed, and committed as static JSON before runtime use.

## Large-Scale Candidate Mining Plan

The scalable workflow should be a review pipeline, not direct mutation of runtime data.

### 1. Build a Larger Corpus

Use a repeatable source list of roughly 1,000-10,000 titles across movies and books. Store imported titles as local review input, not runtime data.

Good sources to support:

- A local text/CSV/JSON import supplied by the user.
- Wikidata exports for notable films, novels, plays, and television titles.
- Open Library or public-domain book title exports.
- Curated IMDb/TMDb-style exports only when licensing and API access are clear.

### 2. Analyse Current Coverage

Run `pnpm run analyse:corpus -- --input path/to/titles.json --output review/corpus-coverage.json`. The input may be JSON, CSV, or plain text. The script emits:

- title-level result
- token-level rule used
- unmapped words with frequency
- rejected title examples for each unmapped word
- generated part-word segmentations tried
- whether a word failed because every split was unmapped, ambiguous, too long, or below score threshold

### 3. Generate Candidate Fixes

For high-frequency failures, run `pnpm run generate:candidates -- --input review/corpus-coverage.json --output review/candidate-review.json`. The review file proposes candidate actions:

- direct emoji concept addition
- synonym addition to an existing concept
- homophone addition
- part-word fallback support via new chunk concepts or homophones
- intentional omission because no fair clue exists

The script should rank candidates by likely impact:

1. Frequent words that appear in many rejected titles.
2. Words where adding one general concept would fix many titles.
3. Chunks that appear across many failed part-word splits.
4. Proper names and invented terms only when a fair rebus split exists.

### 4. Use LLM Review in Batches

Use OpenRouter as an offline assistant to propose candidates, not as runtime logic. Batch 50-100 failed words or chunks at a time, and require structured JSON:

```json
{
  "word": "shawshank",
  "recommendedAction": "part_word",
  "directMapping": null,
  "homophones": [{ "input": "shaw", "soundsLike": "shore", "emoji": "🏖️" }],
  "chunkConcepts": [
    { "word": "shank", "emoji": "🔪", "reason": "slang knife" }
  ],
  "rejectReason": null,
  "confidence": 0.82
}
```

Reject or quarantine any LLM suggestion that:

- maps a title by plot rather than title text
- relies on obscure trivia
- introduces a highly ambiguous emoji without a strong reason
- conflicts with an existing high-confidence concept
- produces more than 4 chunks for one word

Generate the prompt with `pnpm run prompt:candidates -- --input review/candidate-review.json --limit 25`. To run the same review through OpenRouter, use `pnpm run llm:candidates -- --input review/candidate-review.json --output review/llm-candidate-suggestions.json --limit 120 --batch-size 40`. The command reads `OPEN_ROUTER_API_KEY` from the process environment or local `.env`, never logs the key, and writes suggestions only to ignored review JSON.

To fetch a repeatable public title corpus, use `pnpm run fetch:corpus -- --output review/large-title-corpus.json --summary review/large-title-corpus-summary.json`. The fetcher currently targets a public IMDb Top 1000 CSV mirror, Rotten Tomatoes' 300 best movies page, and Project Gutenberg's top downloaded ebooks page.

### 5. Human-Reviewed Import

Generated candidates should land in `review/` or `src/data/converter/candidate-*` files first. A separate promotion step should validate and move approved entries into:

- `emoji-concepts.json`
- `homophones.json`
- `compound-rules.json`
- an intentional omissions file once that exists

### 6. Regression Loop

For each promoted batch:

1. Add targeted tests for new rule categories.
2. Run `pnpm run verify`.
3. Run starter coverage and large-corpus coverage.
4. Compare accepted/rejected counts and inspect any new false positives.
5. Update `docs/RULESETS.md`, `docs/COVERAGE_REPORT.md`, and `docs/TEST_OUTPUTS.txt` where needed.

## Near-Term Backlog

- Add a validator that rejects duplicate words across competing high-confidence emoji concepts.
- Add an intentional omissions file for words that should usually stay unmapped.
- Add per-mode coverage output for strict and rebus separately.
- Add batch suggestion tooling that reads high-frequency unmapped words and writes a review-only candidate file.
- Add corpus import and coverage tooling for large movie/book title lists.
- Add OpenRouter batch review tooling that produces candidate JSON without editing runtime data.
- Add recognisability and ambiguity thresholds to prevent weak generated synonyms from entering runtime data.
- Add a proper-name review file so names like `Nemo`, `Ryan`, or `Lebowski` can be marked as intentionally unmapped without showing up as ordinary coverage gaps.
