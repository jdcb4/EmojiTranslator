# Data Tooling

EmojiTranslator keeps runtime data in static JSON files under
`src/data/converter`. The scripts in `scripts/` are repeatable maintenance
tools for analysing coverage, reviewing candidates, enriching data, and
regenerating derived files. Generated review artifacts are written to
`review/`, which is ignored by git.

## Coverage And Candidate Review

Use these scripts when testing a movie/book/title corpus and mining new
candidate mappings:

```powershell
pnpm run analyse:corpus -- --input "C:\path\to\titles.txt" --output review\corpus-coverage.json
pnpm run generate:candidates -- --input review\corpus-coverage.json --output review\candidate-review.json --limit 1000
pnpm run llm:candidates -- --input review\candidate-review.json --output review\llm-candidate-suggestions.json
pnpm run summarise:llm -- --input review\llm-candidate-suggestions.json --output review\llm-candidate-summary.json
pnpm run promote:llm-candidates -- --input review\llm-candidate-suggestions.json --summary review\llm-candidate-promotion-summary.json
```

`llm:candidates` uses OpenRouter through `scripts/openRouterUtils.ts` and reads
`OPEN_ROUTER_API_KEY` from the process environment or `.env`.

Promotion is intentionally conservative. It validates action type, confidence,
word shape, emoji presence, and existing mappings before mutating runtime JSON.

## Unicode Emoji Expansion

Use these scripts when refreshing the base Unicode emoji library:

```powershell
pnpm run fetch:unicode
pnpm run llm:unicode
pnpm run promote:unicode
```

This pipeline fetches Unicode Emoji data, asks the LLM for conservative
one-word meanings and aliases where CLDR names are too broad, then promotes
validated entries into `emoji-concepts.json`.

## Flag Enrichment

Regional flag aliases are enriched separately:

```powershell
pnpm run augment:flags
```

This uses REST Countries metadata plus a small manual table for Unicode/CLDR
special regions. It adds country or region names, alternate spellings,
capital cities, demonyms, and ISO-style short codes to regional flag concepts.

Short flag codes are available as full-word mappings, but the programmatic
part-word fallback deliberately ignores short regional flag chunks so words do
not split into arbitrary country codes.

## Derived Homophones

After changing `emoji-concepts.json`, regenerate exact-pronunciation homophones:

```powershell
pnpm run generate:homophones
```

The generator uses CMUdict locally and writes the static runtime table at
`src/data/converter/pronunciation-homophones.json`.

## Experimental Comparisons

The comparison scripts are retained for bounded experiments and should not be
treated as production defaults:

```powershell
pnpm run compare:phonetic
pnpm run compare:part-ambiguity
```

They measure the coverage impact of optional phonetic fallbacks.
