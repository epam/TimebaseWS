---
title: Array Join Operations
tags: [QQL, ARRAY, ARRAY_JOIN, LEFT_ARRAY_JOIN, UNNEST, FLATTEN]
---

[[SECTION:ARRAY_JOIN_OVERVIEW]]
[[TAGS: ARRAY ARRAY_JOIN UNNEST FLATTEN SYNTAX CLAUSE_ORDER]]
Purpose: Unfold (unnest) one or more array fields producing one output message per element.
Invariant: Appears after FROM and before WHERE / GROUP BY / OVER TIME.
Rules:
- Without alias the original array field becomes the element value per row.
- Rows with empty target array are dropped (unless LEFT ARRAY JOIN).
- Other arrays not listed become NULL when their array is empty for emitted rows.
  Example:
  SELECT "timestamp", "numbers", "characters" FROM "stream"
  ARRAY JOIN "characters"

[[SECTION:ARRAY_JOIN_SYNTAX]]
[[TAGS: ARRAY ARRAY_JOIN SYNTAX ALIAS CLAUSE_ORDER]]
Purpose: Define canonical syntax variants.
Syntax:
ARRAY JOIN arrayField[, arrayField2 ...]
ARRAY JOIN arrayField AS alias
ARRAY JOIN (arrayExpr)[elementFilter] AS alias
LEFT ARRAY JOIN arrayField [AS alias]
Notes:
- Alias preserves original array; element bound to alias.
- Multiple targets emit concatenated expansions (not Cartesian between unrelated empties).

[[SECTION:ARRAY_JOIN_BASIC_EXAMPLE]]
[[TAGS: ARRAY ARRAY_JOIN EXAMPLES]]
Purpose: Simple unnest of one array.
Example:
SELECT * FROM "stream"
ARRAY JOIN "characters"
Result concept: one row per element of "characters"; messages where "characters" empty removed.

[[SECTION:ARRAY_JOIN_MULTIPLE]]
[[TAGS: ARRAY ARRAY_JOIN MULTIPLE EXAMPLES]]
Purpose: Join several arrays sequentially.
Example:
SELECT "timestamp","numbers","characters" FROM "stream"
ARRAY JOIN "numbers","characters"
Behavior: Emits rows for each non‑empty listed array in input order (no cross product).

[[SECTION:ARRAY_JOIN_ALIAS_ASTERISK]]
[[TAGS: ARRAY ARRAY_JOIN ALIAS PROJECTION EXAMPLES]]
Purpose: Preserve original array while projecting element via alias.
Example:
SELECT * FROM "stream"
ARRAY JOIN "characters" AS char
Effect: Adds scalar column char while keeping "characters" unchanged.

[[SECTION:ARRAY_JOIN_COMPLEX_FILTER_TYPE]]
[[TAGS: ARRAY ARRAY_JOIN FILTERING PREDICATES TYPE]]
Purpose: Filter & type‑restrict before join.
Example (type filter then unnest):
SELECT entry FROM "binance2"
ARRAY JOIN "entries"[THIS IS "deltix.timebase.api.messages.universal.L2EntryNew"] AS entry
Example (cast + null filter):
SELECT entry."price" FROM "kraken"
ARRAY JOIN ("entries" AS ARRAY("deltix.qsrv.hf.plugins.data.kraken.types.KrakenTradeEntry"))[THIS IS NOT NULL] AS entry

[[SECTION:ARRAY_JOIN_FIELD_PROJECTIONS]]
[[TAGS: ARRAY ARRAY_JOIN FILTERING PREDICATES PROJECTION]]
Purpose: Derive fields from filtered element subarrays.
Example:
SELECT
entry["side" == ASK]."price" AS askPrice,
entry["side" == ASK]."size"  AS askSize
FROM "kraken"
ARRAY JOIN ("entries" AS ARRAY("deltix.timebase.api.messages.universal.L1entry"))[THIS IS NOT NULL] AS entry

[[SECTION:ARRAY_JOIN_WITH_WHERE]]
[[TAGS: ARRAY ARRAY_JOIN FILTERING PREDICATES WHERE]]
Purpose: Apply message‑level filters after expansion.
Example:
SELECT "price" FROM "stream"
ARRAY JOIN "entries" AS entry
WHERE entry."price" > 2000

[[SECTION:ARRAY_JOIN_MULTIPLE_EXPRESSIONS]]
[[TAGS: ARRAY ARRAY_JOIN MULTIPLE ALIAS EXPRESSIONS]]
Purpose: Join array plus computed enumeration.
Example:
SELECT entry, num FROM "packages"
ARRAY JOIN "entries" AS entry, ENUMERATE("entries") AS num
Note: ENUMERATE(...) (if provided) yields positional index.

[[SECTION:LEFT_ARRAY_JOIN]]
[[TAGS: ARRAY LEFT_ARRAY_JOIN ARRAY_JOIN UNNEST SYNTAX]]
Purpose: Preserve original rows when target array empty.
Invariant: Empty array → single original row retained (unexpanded).
Example:
SELECT "timestamp","numbers","characters" FROM "stream"
LEFT ARRAY JOIN "characters"

[[SECTION:ARRAY_JOIN_PLANNING_HINTS]]
[[TAGS: PLANNING ARRAY ARRAY_JOIN LEFT_ARRAY_JOIN FILTERING PREDICATES TYPE]]
Purpose: Cues for plan extraction.
Hints:
- Phrase "expand array", "flatten", "unnest" → ARRAY_JOIN.
- "Keep rows without elements" → LEFT_ARRAY_JOIN.
- Filters inside [] → add FILTERING PREDICATES (and TYPE if THIS IS ...).
- Alias presence → note ALIAS (helps not to overwrite original array).

[[SECTION:ARRAY_JOIN_ERROR_PATTERNS]]
[[TAGS: ARRAY ARRAY_JOIN LEFT_ARRAY_JOIN ERRORS DIAGNOSTICS REPAIR]]
Bad: WHERE before ARRAY JOIN
Bad Query:
SELECT * FROM "s" WHERE x > 0 ARRAY JOIN "arr"
Fix:
SELECT * FROM "s" ARRAY JOIN "arr" WHERE x > 0
Bad: Missing quotes
Bad Query:
SELECT * FROM s ARRAY JOIN arr
Fix:
SELECT * FROM "s" ARRAY JOIN "arr"
Bad: Using LEFT after JOIN keyword
Bad Query:
SELECT * FROM "s" ARRAY LEFT JOIN "arr"
Fix:
SELECT * FROM "s" LEFT ARRAY JOIN "arr"
Bad: Alias without AS causing ambiguity (if grammar requires AS)
Bad Query:
SELECT * FROM "s" ARRAY JOIN "arr" elem
Fix:
SELECT * FROM "s" ARRAY JOIN "arr" AS elem

[[SECTION:ARRAY_JOIN_CONTRAST]]
[[TAGS: ARRAY ARRAY_JOIN LEFT_ARRAY_JOIN CONTRAST]]
Contrast:
- ARRAY JOIN: drops rows with empty target array.
- LEFT ARRAY JOIN: retains original row when target array empty.
- Alias vs no alias: alias adds new column; no alias replaces array field value.

[[SECTION:REFERENCE_END]]
[[TAGS: END INDEX]]
End of array join reference.
