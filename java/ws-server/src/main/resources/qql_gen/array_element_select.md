---
title: Array Element Selection
tags: [QQL, ARRAY, INDEXING, SLICING]
---

[[SECTION:ARRAY_ELEMENT_INDEX]]
[[TAGS: ARRAY ARRAY_INDEXING ARRAY_OPS SELECT SYNTAX]]
Purpose: Select a single array element by zero‑based index.
Invariant: Index inside [] must be an integer literal (no quotes).
Rules:
- Projection form: field[index]
- Out-of-range index returns no value (skip) (behavior depends on engine; do not assume error).
  Example:
  SELECT "entries"[0] FROM "packages"

[[SECTION:ARRAY_ELEMENT_NEGATIVE_INDEX]]
[[TAGS: ARRAY ARRAY_INDEXING NEGATIVE_INDEX ARRAY_OPS SYNTAX]]
Purpose: Access elements from the tail using negative indices.
Invariant: -1 = last element.
Example:
SELECT "entries"[-1] FROM "packages"

[[SECTION:ARRAY_ELEMENT_INDEX_LIST]]
[[TAGS: ARRAY ARRAY_INDEXING MULTI_SELECT ARRAY_OPS SYNTAX]]
Purpose: Return an array of selected elements by explicit index list.
Rules:
- Use double brackets: field[[i1, i2, ...]]
- Order preserved as listed.
  Example:
  SELECT "entries"[[2,3]] FROM "packages"

[[SECTION:ARRAY_ELEMENT_BOOLEAN_MASK]]
[[TAGS: ARRAY ARRAY_FILTER BOOLEAN_MASK FILTERING PREDICATES ARRAY_OPS]]
Purpose: Filter array elements by Boolean mask or element predicate.
Forms:
- field[[true,false,true]]
- field[predicate_on_element]
  Predicate form evaluates per element.
  Example (mask):
  SELECT "entries"[[true,false,true]] FROM "packages"
  Example (predicate):
  SELECT "entries"["entries".price > 2000] FROM "packages"

[[SECTION:ARRAY_SLICING_BASIC]]
[[TAGS: ARRAY SLICING ARRAY_SLICE RANGE ARRAY_OPS SYNTAX]]
Purpose: Extract a contiguous slice.
Syntax: field[start:end]
Variants:
- field[start:] from start to end.
- field[:end] from 0 to end-1.
  Indices: start inclusive, end exclusive.
  Example (range):
  SELECT "entries"[1:3] FROM "packages"
  Example (prefix):
  SELECT "entries"[:2] FROM "packages"
  Example (suffix):
  SELECT "entries"[2:] FROM "packages"

[[SECTION:ARRAY_SLICING_WITH_STEP]]
[[TAGS: ARRAY SLICING STEP ARRAY_OPS SYNTAX]]
Purpose: Slice with stride or reverse order.
Syntax: field[start:end:step]
Rules:
- step negative → reverse traversal.
- Omit start/end with trailing colons.
  Examples:
  SELECT "entries"[::] FROM "packages"
  SELECT "entries"[::-1] FROM "packages"
  SELECT "entries"[1:5:2] FROM "packages"

[[SECTION:ARRAY_POSITION_FUNCTION]]
[[TAGS: ARRAY POSITION FUNCTION ARRAY_FILTER FILTERING PREDICATES ARRAY_OPS]]
Purpose: Filter elements by their positional index using position().
Invariant: position() usable only inside the [] filter context.
Examples:
SELECT "entries"[position() > 3].price FROM "stream"
SELECT "entries"[price < 1000 AND position() > 3].price FROM "stream"

[[SECTION:ARRAY_MIXED_PROJECTIONS]]
[[TAGS: ARRAY PROJECTION EXPRESSIONS ARRAY_OPS]]
Purpose: Combine scalar projections with array extraction.
Example:
SELECT "symbol", "entries"[0] FROM "packages"

[[SECTION:ARRAY_ERROR_PATTERNS]]
[[TAGS: ARRAY ERRORS DIAGNOSTICS REPAIR ARRAY_OPS]]
Bad: Missing double quotes around stream → SELECT entries[0] FROM packages  
Fix:
SELECT "entries"[0] FROM "packages"
Bad: Using single bracket list → "entries"[2,3]  
Fix:
SELECT "entries"[[2,3]] FROM "packages"
Bad: Curly braces for slice → "entries"{1:3}  
Fix:
SELECT "entries"[1:3] FROM "packages"

[[SECTION:ARRAY_PLANNING_HINTS]]
[[TAGS: PLANNING ARRAY ARRAY_OPS PLAN_EXTRACTION]]
Planning cues:
- Single index → add tags ARRAY, ARRAY_INDEXING.
- Negative index → add NEGATIVE_INDEX.
- Slicing with step → add SLICING, STEP.
- position() usage → add POSITION, FILTERING, PREDICATES.

[[SECTION:REFERENCE_END]]
[[TAGS: END INDEX]]
End of array element selection reference.
