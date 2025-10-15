---
title: Array Operations
tags: [QQL, ARRAY, ARRAY_OPS, EXPRESSIONS, ARITHMETIC, COMPARISON]
---

[[SECTION:ARRAY_OPS_OVERVIEW]]
[[TAGS: ARRAY ARRAY_OPS EXPRESSIONS OVERVIEW]]
Purpose: Element‑wise operations on arrays and between arrays and scalars.
Invariant: Operations never change ordering; index i in result derives only from index i of operands (and/or scalar).
Example:
SELECT "prices" + 1 FROM "ticks"

[[SECTION:ARRAY_OPS_BROADCAST_SCALAR_LEFT]]
[[TAGS: ARRAY ARRAY_OPS ARITHMETIC SCALAR SYNTAX]]
Purpose: Apply scalar on left to every element of array on right.
Rule: scalar ◦ Array(b) → Array(type(scalar ◦ b))
Example:
SELECT 100 - "prices" FROM "ticks"

[[SECTION:ARRAY_OPS_BROADCAST_SCALAR_RIGHT]]
[[TAGS: ARRAY ARRAY_OPS ARITHMETIC SCALAR SYNTAX]]
Purpose: Apply scalar on right to every element of array on left.
Rule: Array(a) ◦ scalar → Array(type(a ◦ scalar))
Example:
SELECT "sizes" * 2 FROM "ticks"

[[SECTION:ARRAY_OPS_ARRAY_ARRAY]]
[[TAGS: ARRAY ARRAY_OPS ARITHMETIC]]
Purpose: Element‑wise operation between two arrays.
Rule: Array(a) ◦ Array(b) → Array(type(a ◦ b))
Invariant: Arrays must have equal length (mismatched length → error if enforced).
Example:
SELECT "bids" - "asks" FROM "orderBook"

[[SECTION:ARRAY_OPS_COMPARISONS]]
[[TAGS: ARRAY ARRAY_OPS COMPARISON PREDICATES FILTERING]]
Purpose: Element‑wise comparisons yield Boolean arrays.
Rule: Array(a) op Array(b) → Array(BOOLEAN)
Example:
SELECT "bids" > "asks" FROM "orderBook"

[[SECTION:ARRAY_OPS_TYPE_PROMOTION]]
[[TAGS: ARRAY ARRAY_OPS TYPES CONVERSION]]
Purpose: Determine resulting element type after operation.
Rules:
- Numeric widening follows scalar promotion rules.
- Mixing numeric + BOOLEAN unsupported.
- Division with integers may promote to FLOAT.
  Example:
  SELECT "volumes" / 1000 FROM "ticks"

[[SECTION:ARRAY_OPS_CHAINING]]
[[TAGS: ARRAY ARRAY_OPS EXPRESSIONS]]
Purpose: Combine multiple element‑wise operations.
Rule: Standard precedence applies; parenthesize for clarity.
Example:
SELECT ("prices" - "costs") / 10 FROM "ticks"

[[SECTION:ARRAY_OPS_WITH_FUNCTIONS]]
[[TAGS: ARRAY ARRAY_OPS FUNCTIONS STATELESS_FUNCTIONS]]
Purpose: Use stateless functions around array expressions.
Example:
SELECT ABS("deltas") FROM "stream"

[[SECTION:ARRAY_OPS_LENGTH_DERIVATION]]
[[TAGS: ARRAY ARRAY_OPS ARRAY_LENGTH AGG]]
Purpose: Derive metrics from resulting arrays.
Example:
SELECT size(("prices" - "costs")) FROM "ticks"

[[SECTION:ARRAY_OPS_CONTRAST]]
[[TAGS: ARRAY ARRAY_OPS CONTRAST]]
Contrast:
- Scalar + Array → broadcast.
- Array + Array → element‑wise.
- Comparison → Boolean array.
- Aggregation over elements (e.g., SUM) requires explicit supported function (if provided), not implicit.

[[SECTION:ARRAY_OPS_ERROR_PATTERNS]]
[[TAGS: ARRAY ARRAY_OPS ERRORS DIAGNOSTICS REPAIR]]
Bad: Unquoted field
Bad Query:
SELECT prices + 1 FROM "ticks"
Fix:
SELECT "prices" + 1 FROM "ticks"
Bad: Mixed array lengths 
Bad Query:
SELECT "bids" - "asksShort" FROM "orderBook"
Fix: Align lengths or pre‑filter to matching arrays.
Bad: Unsupported op
Bad Query:
SELECT "flags" * "prices" FROM "ticks"
Fix: Use valid numeric arrays only or CAST appropriately.

[[SECTION:ARRAY_OPS_PLANNING_HINTS]]
[[TAGS: PLANNING ARRAY ARRAY_OPS ARITHMETIC PREDICATES]]
Planning cues:
- Scalar broadcast detected → add ARRAY_OPS.
- Array vs array arithmetic → ARRAY_OPS + ARITHMETIC.
- Element‑wise comparison used in filter → add ARRAY_OPS PREDICATES FILTERING.
- Need length metric → include ARRAY_OPS plus any aggregation tags if aggregated later.

[[SECTION:REFERENCE_END]]
[[TAGS: END INDEX]]
End of array operations reference.
