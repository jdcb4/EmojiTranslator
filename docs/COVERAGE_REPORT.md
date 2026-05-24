# Coverage Report

Generate the current report with:

```powershell
pnpm run analyse:coverage
```

The starter dataset lives at `src/data/converter/movie-title-test-set.json`.

Use this report to decide whether to add direct mappings, conservative synonyms, homophones, partial-word rules, or explicit manual-review cases. Movie-specific overrides are deprecated and are not used by hybrid coverage.

## Current Baseline

Last run on 2026-05-23:

```text
Movie titles tested: 100

Excellent: 74
Usable: 16
Needs review: 0
Rejected: 10

Average confidence: 0.85
Average emoji length: 2.6

Top unmapped title words:
1. gump - 1
2. redemption - 1
3. ryan - 1
4. lebowski - 1
5. aladdin - 1
6. shrek - 1
7. e - 1
8. kane - 1
9. mary - 1
10. poppins - 1
```

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
