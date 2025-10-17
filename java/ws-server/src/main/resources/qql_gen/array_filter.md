---
title: Array Filtering
tags: [QQL, ARRAY, ARRAY_FILTER, FILTERING, PREDICATES, TYPE, NULLABILITY]
---

[[SECTION:ARRAY_FILTER_TYPE]]
[[TAGS: ARRAY ARRAY_FILTER FILTERING TYPE PREDICATES SYNTAX]]
Purpose: Filter array elements by their runtime class/type.
Invariant: Use THIS IS "ClassName" (or THIS IS NOT) inside [] after the array field.
Rules:
- Syntax: "arrayField"[THIS IS "ClassName"]
- Combine with other element predicates using AND / OR.
  Example:
  SELECT "entries"[THIS IS "deltix.timebase.api.messages.universal.L1Entry"] FROM "bitfinex"

[[SECTION:ARRAY_FILTER_TYPE_LENGTH]]
[[TAGS: ARRAY ARRAY_FILTER FILTERING TYPE PREDICATES AGG]]
Purpose: Filter by type then test resulting length.
Invariant: Length check uses ARRAY_LENGTH() over the filtered projection.
Example:
SELECT "entries"[THIS IS "deltix.timebase.api.messages.universal.L1Entry"] FROM "bitfinex" WHERE size("entries"[THIS IS "deltix.timebase.api.messages.universal.L1Entry"]) > 0

[[SECTION:ARRAY_FILTER_NULLABILITY]]
[[TAGS: ARRAY ARRAY_FILTER NULLABILITY FILTERING PREDICATES]]
Purpose: Exclude NULL elements (object arrays).
Invariant: Use THIS IS NOT NULL (or THIS IS NULL) inside filter brackets.
Example:
SELECT "entries"[THIS IS NOT NULL] FROM "packages"

[[SECTION:ARRAY_FILTER_FIELD_PREDICATES]]
[[TAGS: ARRAY ARRAY_FILTER FILTERING PREDICATES]]
Purpose: Keep elements whose internal field values satisfy a condition.
Invariant: THIS. may be omitted before a direct field name.
Examples:
SELECT "entries"[THIS."price" > 2000] FROM "packages"
SELECT "entries"["price" > 2000] FROM "packages"

[[SECTION:ARRAY_FILTER_NESTED_FIELD]]
[[TAGS: ARRAY ARRAY_FILTER FILTERING PREDICATES EXPRESSIONS]]
Purpose: Apply compound predicates to element fields.
Example:
SELECT "entries"[ "price" > 4000 AND "size" >= 10 ] FROM "packages"

[[SECTION:ARRAY_FILTER_FIELD_EXTRACTION]]
[[TAGS: ARRAY ARRAY_FILTER PROJECTION FILTERING PREDICATES]]
Purpose: Project a field from filtered elements.
Examples:
SELECT "entries"[ "price" > 4000 ]."price" FROM "packages"
SELECT "entries"[ "size" > 10 ]."size" FROM "packages"

[[SECTION:ARRAY_FILTER_CHAINING]]
[[TAGS: ARRAY ARRAY_FILTER FILTERING CHAINING PREDICATES]]
Purpose: Apply a second filter to the field array result.
Invariant: Second bracket applies to the resulting projected array.
Example:
SELECT "entries"[ "price" > 4000 ]."price"[THIS < 5000] FROM "packages"

[[SECTION:ARRAY_FILTER_TYPE_AND_FIELD]]
[[TAGS: ARRAY ARRAY_FILTER FILTERING TYPE PREDICATES]]
Purpose: Combine type and field predicates.
Example:
SELECT "entries"[ THIS IS "Trade" AND "price" > 1000 ] FROM "stream"

[[SECTION:ARRAY_FILTER_PLANNING_HINTS]]
[[TAGS: PLANNING ARRAY ARRAY_FILTER FILTERING PREDICATES TYPE NULLABILITY]]
Purpose: Planning cues for Stage A plan extraction.
Hints:
- Presence of [THIS IS ...] → add TYPE.
- Use of THIS IS NOT NULL → add NULLABILITY.
- Field comparisons inside [] → add FILTERING PREDICATES.
- Chained filters (].[) → note complexity; no new tag unless step / position also used.

[[SECTION:ARRAY_FILTER_ERROR_PATTERNS]]
[[TAGS: ARRAY ARRAY_FILTER ERRORS DIAGNOSTICS REPAIR]]
Bad: Missing quotes around stream
Bad Query:
SELECT "entries"[THIS IS "Trade"] FROM stream
Fix:
SELECT "entries"[THIS IS "Trade"] FROM "stream"
Bad: Unquoted field name
Bad Query:
SELECT entries[price > 2000] FROM "packages"
Fix:
SELECT "entries"["price" > 2000] FROM "packages"
Bad: Using IS NULL without THIS (object required)
Bad Query:
SELECT "entries"[IS NULL] FROM "packages"
Fix:
SELECT "entries"[THIS IS NULL] FROM "packages"

[[SECTION:ARRAY_FILTER_CONTRAST]]
[[TAGS: ARRAY ARRAY_FILTER CONTRAST TYPE NULLABILITY PREDICATES]]
Contrast:
- Type filter: THIS IS "ClassName"
- Null filter: THIS IS (NOT) NULL
- Field predicate: ("field" op value) optionally prefixed with THIS.

[[SECTION:REFERENCE_END]]
[[TAGS: END INDEX]]
End of array filtering reference.
