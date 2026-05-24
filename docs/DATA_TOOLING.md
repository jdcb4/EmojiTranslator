# Data Tooling

EmojiTranslator keeps runtime data in static JSON files under
`src/data/converter`. The scripts in `scripts/` are repeatable maintenance
tools for analysing coverage, reviewing candidates, enriching data, and
regenerating derived files. Generated review artifacts are written to
`review/`, which is ignored by git.

## Game Clue Dataset

The game dataset is generated from a broad Wikidata title corpus plus Box
Office Mojo's top domestic lifetime grossing movies:

```powershell
pnpm run fetch:game-corpus
pnpm run generate:game-dataset
```

`fetch:game-corpus` queries Wikidata for film, TV-series, and book/novel labels
ordered by sitelinks. It also fetches the five 200-title pages from Box Office
Mojo's top lifetime gross chart and marks those movies as high-recognition
titles. The merged corpus is written to `review/game-title-corpus.json`.

`generate:game-dataset` converts that corpus with the existing hybrid
converter, rejects titles below the confidence threshold, rejects clues with
unmapped tokens, and writes the static runtime dataset to
`src/data/game/title-clues.json`. It also assigns each clue a stable six-letter
code used by static share URLs such as `?clue=ABCDEF`. The default threshold is
`0.9`; use
`--min-confidence` only when intentionally changing the quality/quantity tradeoff.

The current generated dataset was built from 9,144 unique source titles and kept
1,030 clues: 551 movie, 227 TV, and 252 book clues. Of those accepted clues, 180
are marked high-recognition from Box Office Mojo and 63 are both high-recognition
and three-or-more-emoji clues.

Runtime clue selection is weighted but still static. High-recognition clues get
double weight, and clues with three or more emoji get double weight. A clue that
meets both conditions is four times as likely as a normal clue.

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
