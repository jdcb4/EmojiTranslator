# Active Rulesets

This is the human-readable reference for the converter rules currently applied at runtime. Keep this file updated whenever a rule, rule order, or user-facing example changes.

## Runtime Modes

- `strict` translates title words conservatively using direct mappings, reviewed synonyms, phrase rules, and a small set of clear symbols.
- `rebus` allows strict rules plus homophones and reviewed partial-word splits.
- `hybrid` runs strict and rebus, then selects the strongest accepted candidate.

Movie-specific clue overrides are deprecated. The runtime translates the supplied title text, not plot details or famous scenes.

## Rule Order

### Phrase Rules

Phrase rules run before single-token rules.

1. Small number plus noun: `[2-5] [mappable noun]` repeats the noun emoji by the stated count.
   - `Three Kings` -> `👑👑👑`
   - `2 Cars` -> `🚗🚗`
2. Larger numbers stay numeric so clues do not become noisy.
   - `Ocean's Eleven` -> `🌊1️⃣1️⃣`

### Strict Token Rules

Strict mode applies token rules in this order:

1. Ignored articles: `the`, `a`, and `an` do not appear in the output.
2. Connector symbol: `and` maps to `+`.
   - `Beauty and the Beast` -> `💄+👹`
3. Single-letter rebus convention: `I` maps to the eye sound-alike `👁️`.
   - `I, Robot` -> `👁️🤖`
4. Number tokens: digits, number words, and Roman numerals map to number emoji.
   - `Apollo 13` -> `🚀1️⃣3️⃣`
   - `Rocky IV` -> `🪨4️⃣`
5. Reviewed compound words from `compound-rules.json` can map to a combined emoji clue when the split is literal enough for strict mode.
6. Plural noun repetition: reviewed plural words repeat the singular emoji twice.
   - `Cars` -> `🚗🚗`
   - `Aliens` -> `👽👽`
   - `Rings` -> `💍💍`
   - `Shoes` -> `👟👟`
7. Word lookup from `emoji-concepts.json`: exact words, reviewed plural forms, curated synonyms, then weaker related words.
8. Remaining low-value connectors are ignored when they are not mapped by an earlier rule: `of`, `in`, `on`, `at`, `to`, `for`, `with`, `from`, `there`, `will`, and `be`.
9. Unmapped important words lower confidence and may reject the result.

### Rebus Token Rules

Rebus mode applies token rules in this order:

1. Homophones from `homophones.json`.
   - `to` -> `2️⃣`
   - `for` -> `4️⃣`
   - `meet` -> `🥩`
   - `whole` -> `🕳️`
   - `would` -> `🪵`
2. Connector symbol: `and` maps to `+`.
3. Number tokens: digits, number words, and Roman numerals map to number emoji.
4. Reviewed compound and partial-word rules from `compound-rules.json`.
   - `Forrest` -> `🌲🌲`
   - `Truman` -> `✅👨`
   - `Nemo` -> `🦵🚜`
   - `season` -> `🌊☀️`
   - `cabin` -> `🚕🏨`
5. Plural noun repetition.
6. Word lookup from `emoji-concepts.json`.
7. Ignored articles and low-value connectors.
8. Exact dictionary homophone fallback from `pronunciation-homophones.json`.
   - `Kane` -> `cane` -> `🦯`
   - `Pi` -> `pie` -> `🥧`
   - `would` -> `wood` -> `🪵`
9. Optional experimental whole-word phonetic fallback when `allowPhoneticWords` is enabled.
10. Programmatic part-word fallback for still-unmapped words.

- `Foreman` -> `4️⃣👨`
- `Forrest` can be split as `for + rest` -> `4️⃣🛌`, but the reviewed `🌲🌲` rule still wins at runtime.
- `Shawshank` can be split as `shaw + shank` -> `🏖️🔪`.
- `Nemo` can be split as `ne + mo` -> `🦵🚜`.
- `Truman` can be split as `tru + man` -> `✅👨`.

11. Unmapped important words lower confidence and may reject the result.

## Mapping Conventions

- Prefer literal title translation over movie trivia.
- Prefer recognisable emoji over clever but obscure clues.
- Prefer no clue over a misleading clue.
- Plural words use two repeated emoji by default unless an explicit small number supplies the exact count.
- `and` uses `+` to preserve title structure without adding a misleading emoji.
- Singing words use a microphone-led clue.
  - `sing`, `singin`, `singing` -> `🎤🎵`
- Combo concepts may use multiple emoji when a single emoji would be misleading.
  - `band` -> `🎸🥁🎹`
- Direction and time words can use common symbols when the relationship is clear.
  - `before` -> `⬅️`
  - `back` -> `↩️`
  - `future` -> `🔮`
- Imported homophone lists are promoted conservatively. Clear true homophones can be added to `homophones.json`; single-letter aliases, risky function-word mappings, and homophones that fight a clearer literal reading are skipped.
- Partial-word rebus mappings must be explicitly reviewed and stored; the converter does not auto-segment arbitrary words.
- Exact dictionary homophone fallback is generated from CMUdict into static data. It only uses identical pronunciations, rejects large candidate buckets, excludes most very short inputs, and scores below reviewed partial-word rules.
- Whole-word phonetic fallback is experimental and disabled by default because Double Metaphone buckets can be ambiguous.
- Programmatic part-word fallback is a last resort in rebus mode. It is bounded to short words, requires every chunk to map, rejects ambiguous phonetic matches, and scores below reviewed partial-word rules.
- Ambiguous part-word phonetic matching can be experimentally enabled with `allowAmbiguousPartWordPhonetics`; default runtime behavior still rejects ambiguous chunks.

## Confidence Rules

- Exact mappings score highest.
- Plural repetition scores slightly below exact singular mappings because the exact quantity is implied.
- Curated synonyms score lower than exact mappings.
- Related words score lower and should be used sparingly.
- Partial-word rebus rules score lower than strict mappings because they are more playful.
- Exact dictionary homophone fallback scores below reviewed partial-word rules because it is generated rather than manually curated.
- Programmatic part-word fallback scores below reviewed partial-word rules because its chunks are generated rather than manually curated.
- Results below the acceptance threshold are returned for review rather than forced as good clues.
