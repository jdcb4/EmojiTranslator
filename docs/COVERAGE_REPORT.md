# Coverage Report

Generate the current report with:

```powershell
pnpm run analyse:coverage
```

The starter dataset lives at `src/data/converter/movie-title-test-set.json`.

Use this report to decide whether to add direct mappings, conservative synonyms, homophones, partial-word rules, or explicit manual-review cases. Movie-specific overrides are deprecated and are not used by hybrid coverage.

## Current 250-Title Sample

Last run on 2026-05-24 against `C:\Users\joedo\OneDrive\Desktop\Movies.txt`
after the latest reviewed mappings:

```text
Corpus titles tested: 250

Excellent: 92
Usable: 54
Needs review: 23
Rejected: 81

Accepted: 146 / 250 (58.4%)
Average confidence: 0.65
Average emoji length: 3.2

Top unmapped title words:
1. episode - 3
2. lives - 2
3. m - 2
4. verse - 2
5. your - 2
6. across - 1
7. affair - 1
8. amadeus - 1
9. amelie - 1
10. apocalypse - 1
```

The latest generated artifact is `review/movies-250-current.json`.

## Starter Dataset Baseline

Generate the starter 100-title dataset with `pnpm run analyse:coverage`.

## Broad Corpus Review Run

Last large review run on 2026-05-23 after Unicode Emoji 17.0 base mapping promotion:

```text
Corpus titles tested: 1304

Excellent: 158
Usable: 112
Needs review: 59
Rejected: 975

Average confidence: 0.26
Average emoji length: 2.2

Top unmapped words:
1. de - 20
2. le - 12
3. my - 12
4. der - 11
5. or - 9
6. adventures - 8
7. harry - 8
8. les - 8
9. me - 7
10. by - 6
```

Corpus source summary is generated at `review/large-title-corpus-summary.json`.
Candidate review artifacts are generated at `review/large-candidate-review.json`, `review/large-llm-suggestions.json`, `review/large-llm-suggestions-summary.json`, and `review/large-corpus-coverage-after-promotion.json`.
Unicode expansion artifacts are generated at `review/unicode-base-emojis.json`, `review/unicode-emoji-llm-review.json`, `review/unicode-promotion-summary.json`, and `review/large-corpus-coverage-after-unicode.json`.
