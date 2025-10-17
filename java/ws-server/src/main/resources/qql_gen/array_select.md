---
title: Array Selection
tags: [QQL, ARRAY, ARRAY_SELECT, PROJECTION, FILTERING, PREDICATES, BOOLEAN_AGG]
---

[[SECTION:ARRAY_SELECT_OVERVIEW]]
[[TAGS: ARRAY ARRAY_SELECT PROJECTION OVERVIEW]]
Purpose: Select whole arrays, element fields, element-wise expressions, and boolean reductions (ANY / ALL).
Invariant: Projection preserves original element order unless filtered.

[[SECTION:ARRAY_SELECT_WHOLE]]
[[TAGS: ARRAY ARRAY_SELECT PROJECTION]]
Purpose: Project entire array as stored.
Example:
SELECT "entries" FROM "binance2"
Behavior: Non-existent array field → NULL result (engine dependent).

[[SECTION:ARRAY_SELECT_ELEMENT_FIELD]]
[[TAGS: ARRAY ARRAY_SELECT PROJECTION FIELD_ACCESS]]
Purpose: Project a single field from each element producing a parallel array.
Syntax: "arrayField"."elementField"
Example:
SELECT "entries"."price" FROM "bitfinex"

[[SECTION:ARRAY_SELECT_ELEMENT_COMPARISON]]
[[TAGS: ARRAY ARRAY_SELECT COMPARISON BOOLEAN_ARRAY PREDICATES]]
Purpose: Element-wise comparison producing BOOLEAN array.
Example:
SELECT "entries"."price" > 10 FROM "bitfinex"

[[SECTION:ARRAY_SELECT_BOOLEAN_REDUCTION]]
[[TAGS: ARRAY ARRAY_SELECT BOOLEAN_AGG ANY ALL]]
Purpose: Collapse boolean element array to single scalar via ANY / ALL.
Examples:
SELECT ANY("entries"."price" > 10) FROM "bitfinex"
SELECT ALL("entries"."price" > 0) FROM "bitfinex"

[[SECTION:ARRAY_SELECT_TYPE_FILTER]]
[[TAGS: ARRAY ARRAY_SELECT FILTERING TYPE PREDICATES]]
Purpose: Restrict array to elements of a given runtime class.
Syntax: "entries"[THIS IS "Fully.Qualified.ClassName"]
Example:
SELECT "entries"[THIS IS "deltix.timebase.api.messages.universal.L1Entry"] FROM "bitfinex"

[[SECTION:ARRAY_SELECT_TYPE_FILTER_FIELD]]
[[TAGS: ARRAY ARRAY_SELECT FILTERING TYPE PROJECTION]]
Purpose: Project field from elements passing type filter.
Example:
SELECT "entries"[THIS IS "deltix.timebase.api.messages.universal.L1Entry"]."price" FROM "bitfinex"

[[SECTION:ARRAY_SELECT_ALIAS_WITH]]
[[TAGS: ARRAY ARRAY_SELECT ALIAS WITH FILTERING TYPE]]
Purpose: Bind filtered array to alias for reuse.
Example:
WITH l1 == "entries"[THIS IS "deltix.timebase.api.messages.universal.L1Entry"]
SELECT l1."price", l1."size" FROM "kraken"
WHERE size(l1) > 0

[[SECTION:ARRAY_SELECT_SIDE_PARTITION]]
[[TAGS: ARRAY ARRAY_SELECT FILTERING PREDICATES]]
Purpose: Derive side-specific subarrays (e.g., BID / ASK) via element predicates.
Example:
WITH l1 == "entries"[THIS IS "deltix.timebase.api.messages.universal.L1Entry"]
SELECT
l1["side" == ASK]."price" AS askPrice,
l1["side" == ASK]."size"  AS askSize,
l1["side" == BID]."price" AS bidPrice,
l1["side" == BID]."size"  AS bidSize
FROM "binance"
WHERE size(l1) > 0

[[SECTION:ARRAY_SELECT_COMBINED_PREDICATES]]
[[TAGS: ARRAY ARRAY_SELECT FILTERING PREDICATES BOOLEAN_AGG TYPE]]
Purpose: Require both existence and uniform predicate satisfaction.
Example:
SELECT "entries"[THIS IS "deltix.timebase.api.messages.universal.L1Entry"]."price" AS price
FROM "bitfinex"
WHERE size("entries"[THIS IS "deltix.timebase.api.messages.universal.L1Entry"]) > 0
AND ALL("entries"[THIS IS "deltix.timebase.api.messages.universal.L1Entry"]."price" > 20)

[[SECTION:ARRAY_SELECT_SCALAR_FILTER_USING_ANY]]
[[TAGS: ARRAY ARRAY_SELECT FILTERING PREDICATES BOOLEAN_AGG]]
Purpose: Filter messages by element-wise condition summarized with ANY.
Example:
SELECT "entries"."price" AS price
FROM "bitfinex"
WHERE ANY("entries"."price" > 10)

[[SECTION:ARRAY_SELECT_PLANNING_HINTS]]
[[TAGS: PLANNING ARRAY ARRAY_SELECT FILTERING PREDICATES BOOLEAN_AGG TYPE]]
Planning cues:

- Type filter present → add TYPE.
- ANY / ALL usage → add BOOLEAN_AGG.
- Element predicate inside [] → add FILTERING PREDICATES.
- Plain field projection of elements → PROJECTION.

[[SECTION:ARRAY_SELECT_ERROR_PATTERNS]]
[[TAGS: ARRAY ARRAY_SELECT ERRORS DIAGNOSTICS REPAIR]]
Bad: Unquoted field
Bad Query:
SELECT entries.price FROM "s"
Fix:
SELECT "entries"."price" FROM "s"
Bad: Using non-canonical ARRAY_LENGTH()
Bad Query:
WHERE ARRAY_LENGTH("entries") > 0
Fix:
WHERE size("entries") > 0
Bad: Missing class quotes in type filter
Bad Query:
"entries"[THIS IS L1Entry]
Fix:
"entries"[THIS IS "L1Entry"]

[[SECTION:ARRAY_SELECT_CONTRAST]]
[[TAGS: ARRAY ARRAY_SELECT CONTRAST BOOLEAN_AGG PROJECTION]]
Contrast:

- "entries" → whole array.
- "entries"."price" → array of prices.
- "entries"."price" > 10 → boolean array.
- ANY(...) / ALL(...) → single BOOLEAN per message.

[[SECTION:REFERENCE_END]]
[[TAGS: END INDEX]]
End of array selection reference.
