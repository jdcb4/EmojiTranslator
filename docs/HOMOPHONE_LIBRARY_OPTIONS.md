# Homophone Library Options

This note compares heavier homophone and phonetic matching options for EmojiTranslator.
The goal is to decide what, if anything, should be added after the current exact,
alias, compound, plural, and reviewed partial-word rules.

Raw local outputs:

- [`../review/homophone-lab/evaluate-homophone-methods.mjs`](../review/homophone-lab/evaluate-homophone-methods.mjs)
- [`../review/homophone-library-evaluation.json`](../review/homophone-library-evaluation.json)

The lab dependencies were installed under ignored `review/homophone-lab`, not added to
the production app.

## Summary Recommendation

Use a CMUdict-style pronunciation dictionary as the only credible automatic
homophone fallback.

Do not enable Soundex, Metaphone, Double Metaphone, NYSIIS, Fuzzy Soundex, or
similar phonetic hashes as automatic user-facing rules. They recover more titles
but create too many bad clues.

The practical path is:

1. Add a `dictionary_homophone` fallback based on exact pronunciation equality.
2. Keep it lower confidence than curated explicit mappings.
3. Reject ambiguous candidate buckets.
4. Use looser phonetic algorithms only for offline review-candidate generation.

## Options Tested

| Option                       | Package tested                     |   Version | What it does                                                             | App suitability                                                     |
| ---------------------------- | ---------------------------------- | --------: | ------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| CMU exact pronunciation      | `cmu-pronouncing-dictionary`       |     3.0.0 | Looks up ARPABET pronunciations and matches words with identical phones. | Best automatic option. Low coverage, high precision.                |
| CMU stressless pronunciation | `cmu-pronouncing-dictionary`       |     3.0.0 | Same as CMU exact, but removes stress markers from vowel phones.         | Similar result to exact in current tests. Keep as optional later.   |
| Soundex                      | `phonetics`, `talisman`, `natural` | See below | Encodes broad English-ish sound groups.                                  | Too coarse. Many false positives.                                   |
| Metaphone                    | `phonetics`, `talisman`, `natural` | See below | Encodes approximate English pronunciation.                               | Better than Soundex, still too noisy for automatic clues.           |
| Double Metaphone             | `phonetics`, `natural`             | See below | Produces primary/alternate phonetic keys.                                | Finds many true homophones but also many bad matches.               |
| NYSIIS                       | `talisman`                         |     1.1.4 | Name-oriented phonetic encoding.                                         | Lower false positives in pair tests, but weaker coverage.           |
| Fuzzy Soundex                | `talisman`                         |     1.1.4 | Broader sound matching than Soundex.                                     | More coverage, still too noisy.                                     |
| Natural phonetics            | `natural`                          |     8.1.1 | Provides SoundEx, Metaphone, DoubleMetaphone, SoundExDM.                 | Heavy package for algorithms we can get elsewhere. Not recommended. |

Package links:

- [`cmu-pronouncing-dictionary`](https://www.npmjs.com/package/cmu-pronouncing-dictionary)
- [`phonetics`](https://www.npmjs.com/package/phonetics)
- [`talisman`](https://yomguithereal.github.io/talisman/)
- [`natural`](https://www.npmjs.com/package/natural)
- [CMUdict source project](https://github.com/cmusphinx/cmudict)

## Targeted Pair Benchmark

The benchmark used 17 known good homophone pairs and 13 known bad pairs that
previous experiments had incorrectly matched.

Good pairs included:

- `night / knight`
- `for / four`
- `eye / i`
- `flower / flour`
- `right / write`
- `steal / steel`

Bad pairs included:

- `comedy / comet`
- `ugly / eagle`
- `slave / selfie`
- `gump / gambia`
- `haine / honey`
- `rouge / rocky`

| Method                       | True homophones found | False matches |
| ---------------------------- | --------------------: | ------------: |
| CMU exact pronunciation      |               17 / 17 |        0 / 13 |
| CMU stressless pronunciation |               17 / 17 |        0 / 13 |
| `phonetics` Soundex          |               12 / 17 |        6 / 13 |
| `phonetics` Metaphone        |               10 / 17 |        3 / 13 |
| `phonetics` Double Metaphone |               17 / 17 |       10 / 13 |
| `talisman` Soundex           |               12 / 17 |        6 / 13 |
| `talisman` Metaphone         |               11 / 17 |        3 / 13 |
| `talisman` NYSIIS            |                8 / 17 |        0 / 13 |
| `talisman` Fuzzy Soundex     |               14 / 17 |        6 / 13 |
| `natural` SoundEx            |               12 / 17 |        6 / 13 |
| `natural` Metaphone          |               11 / 17 |        3 / 13 |
| `natural` DoubleMetaphone    |               17 / 17 |        9 / 13 |
| `natural` SoundExDM          |               10 / 17 |        7 / 13 |

The targeted benchmark is small, but it is useful because it tests exactly the
failure mode we care about: "sounds somewhat similar" is not good enough for a
rebus clue.

## Broad Corpus Simulation

Baseline corpus after Unicode emoji expansion:

| Band         | Count |
| ------------ | ----: |
| Excellent    |   158 |
| Usable       |   112 |
| Needs review |    59 |
| Rejected     |   975 |

The broad corpus simulation post-processed the unmatched tokens from
`review/large-corpus-coverage-after-unicode.json`. It is not a fully integrated
converter run, but it is enough to compare library quality.

| Method                       | Excellent | Usable | Needs review | Rejected | Moved out of rejected | Accepted from rejected | Changed outputs |
| ---------------------------- | --------: | -----: | -----------: | -------: | --------------------: | ---------------------: | --------------: |
| Baseline                     |       158 |    112 |           59 |      975 |                     - |                      - |               - |
| CMU exact pronunciation      |       158 |    116 |           59 |      971 |                     5 |                      4 |              27 |
| CMU stressless pronunciation |       158 |    116 |           59 |      971 |                     5 |                      4 |              27 |
| `talisman` Metaphone         |       158 |    153 |          118 |      875 |                   101 |                     41 |             293 |
| `talisman` NYSIIS            |       158 |    143 |          100 |      903 |                    73 |                     29 |             255 |
| `talisman` Fuzzy Soundex     |       158 |    152 |          118 |      876 |                   100 |                     38 |             289 |

The higher-coverage methods look attractive by count, but the examples show that
much of the extra coverage is not good clue quality.

## Good Outputs

These are examples where a dictionary homophone fallback is useful.

| Title                       | Match           | Output effect | Comment                                                                      |
| --------------------------- | --------------- | ------------- | ---------------------------------------------------------------------------- |
| `Citizen Kane`              | `Kane -> cane`  | Adds `🦯`     | Good rebus clue for the surname.                                             |
| `Life of Pi`                | `Pi -> pie`     | Adds `🥧`     | Strong common homophone.                                                     |
| `Trois couleurs: Bleu`      | `Bleu -> blue`  | Adds `🟦`     | Useful for a French title where the English sound is obvious.                |
| `The Man Who Would Be King` | `Would -> wood` | Adds `🪵`     | Strong homophone clue.                                                       |
| `Paan Singh Tomar`          | `Singh -> sing` | Adds `🎤🎵`   | Potentially useful, but should be reviewed because it touches a proper name. |

## Bad Outputs

These are examples that should not ship as automatic user-facing output.

| Method family                | Bad match         | Why it is bad                                                      |
| ---------------------------- | ----------------- | ------------------------------------------------------------------ |
| Double Metaphone             | `comedy -> comet` | Similar code, different word and concept.                          |
| Double Metaphone             | `ugly -> eagle`   | Looks plausible algorithmically but not as a clue.                 |
| Double Metaphone / Metaphone | `slave -> selfie` | Bad semantic jump.                                                 |
| Soundex / Fuzzy Soundex      | `gump -> gambia`  | Country flag output for an invented/proper name.                   |
| Soundex / Fuzzy Soundex      | `haine -> honey`  | Similar-ish sound, poor clue.                                      |
| Soundex / Metaphone          | `rouge -> rocky`  | Wrong concept.                                                     |
| Fuzzy Soundex                | `Would -> wealth` | Worse than the exact homophone `wood`.                             |
| Fuzzy Soundex                | `Theory -> three` | Could be useful in a wordplay game, but too aggressive by default. |

## Resource Impact

Approximate installed package footprint in the isolated lab:

| Package                      | Version | Local package size | Notes                                                       |
| ---------------------------- | ------: | -----------------: | ----------------------------------------------------------- |
| `phonetics`                  |   1.0.7 |           45.1 KiB | Tiny, but algorithms were not precise enough.               |
| `talisman`                   |   1.1.4 |          536.8 KiB | Moderate size, broad algorithm coverage.                    |
| `cmu-pronouncing-dictionary` |   3.0.0 |            4.5 MiB | Larger because it ships pronunciation data. Best precision. |
| `natural`                    |   8.1.1 |           13.2 MiB | Broad NLP toolkit. Too heavy for the specific need.         |

The full isolated `node_modules` folder was 69.6 MiB because of transitive
dependencies across all tested packages.

Runtime considerations:

- `phonetics` and `talisman` are cheap to load and compute, but the output quality
  is the blocker.
- `cmu-pronouncing-dictionary` is heavier because it needs dictionary data, but
  lookup is cheap once indexed.
- `natural` is not a good fit for the app runtime. It is much heavier, exposes the
  same broad phonetic algorithms, and did not improve quality enough to justify
  the footprint.

Cloudflare/Railway considerations:

- For Cloudflare Workers, avoid loading a full NLP toolkit into the request path.
- If CMUdict is adopted, prefer a build-time generated JSON index containing only
  pronunciation buckets that map to available emoji concepts.
- A reduced generated index should be much smaller than shipping the full raw
  dictionary and faster to initialise.
- Railway has more runtime tolerance, but the same quality gates should apply.

## Proposed Implementation Shape

Add a new fallback stage after reviewed partial-word rules:

1. Normalize the unresolved token.
2. Look up exact CMU pronunciation.
3. Find other words with the same pronunciation.
4. Intersect those words with known emoji concepts.
5. Reject if there are no candidates.
6. Reject if the candidate bucket is too large.
7. Prefer candidates with curated primary mappings over Unicode-derived aliases.
8. Emit a low-confidence `dictionary_homophone` rule.

Suggested scoring:

- Below curated exact aliases.
- Below explicit reviewed homophones.
- Below reviewed partial-word rules.
- Above rejected/unmapped.

Suggested initial restrictions:

- English ASCII tokens only.
- No automatic matching for very short tokens except curated cases.
- No automatic matching for likely proper names unless the result is very strong.
- No fallback when more than 3 emoji candidates are available.
- Log rejected candidate buckets into review artifacts.

## Decision

Use CMU exact pronunciation as the next implementation candidate.

Use Metaphone/Double Metaphone/NYSIIS/Fuzzy Soundex only as offline tooling to
suggest mappings for human review, not as automatic converter behavior.
