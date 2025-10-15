---
title: Data Type Conversions
tags: [qql, data_types, conversions, numeric, promotion, casting, decimal, float, integer, timestamp, interval, nullability, array, best_practices, anti_patterns, examples]
---

[[SECTION:DATA_TYPE_CONVERSIONS_OVERVIEW]]
[[TAGS: CONVERSIONS OVERVIEW NUMERIC TYPES]]
Type conversion determines result types for mixed‑type expressions.
Principles:
1. Safe widening is implicit (no precision loss).
2. Narrowing (possible loss) must be explicit via inline cast: expr AS TargetType.
3. Small integers promote to at least Int32 in arithmetic.
4. DECIMAL preserves exact decimal; floats (Float32/Float64) are approximate.
5. Timestamp arithmetic: Timestamp +/‑ Int64(duration) → Timestamp; Timestamp - Timestamp → Int64 (milliseconds).

[[SECTION:NUMERIC_PROMOTION_HIERARCHY]]
[[TAGS: PROMOTION HIERARCHY ORDER]]
Integer widening path:
Int8 → Int16 → Int32 → Int64 → DECIMAL
Floating path:
Float32 → Float64
Cross family:
- Integer + DECIMAL → DECIMAL
- Integer + Float(32/64) (no DECIMAL present) → widest Float
- DECIMAL + Float → require explicit choice (cast one side) to avoid silent precision preference.

[[SECTION:NUMERIC_OPERATION_RULES]]
[[TAGS: RULES NUMERIC OPERATIONS]]
Examples (result type):
Int8 + Int16 → Int32
Int32 + Int64 → Int64
Int64 + DECIMAL → DECIMAL
Int32 + Float32 → Float32
Float32 + Float64 → Float64
DECIMAL + Float64 → (cast one side: (value AS DECIMAL) + other  OR (value AS Float64) + other)
Unary minus keeps operand type (after any initial promotion).
Division:
- Integer / Integer → Int64 (truncating) unless one side cast to DECIMAL or Float.
- DECIMAL / DECIMAL → DECIMAL
- Float / Float → widened float

[[SECTION:TYPE_RESOLUTION_MATRIX]]
[[TAGS: MATRIX PROMOTION REFERENCE]]
Result (A op B) after implicit widening (D = DECIMAL, F32 = Float32, F64 = Float64):
Int   Int64   D       F32     F64
Int         Int32 Int64   D       F32     F64
Int64       Int64 Int64   D       F32     F64
D           D     D       D       (cast)  (cast)
F32         F32   F32     (cast)  F32     F64
F64         F64   F64     (cast)  F64     F64
(cast) = must explicitly cast one side (choose D or float).

[[SECTION:TIMESTAMP_CONVERSIONS]]
[[TAGS: TIMESTAMP CONVERSIONS DURATION]]
Rules:
1. "timestamp" + Int64Duration → Timestamp
2. "timestamp" - Int64Duration → Timestamp
3. "timestamp" - "timestamp" → Int64 (milliseconds)
4. Mixing Timestamp with DECIMAL/Float without intent is invalid (cast only if converting numeric duration).
5. Interval literals (5m, 30s) are Int64 millisecond values.

[[SECTION:INTERVAL_USAGE]]
[[TAGS: INTERVAL DURATION ARITHMETIC]]
Intervals behave as Int64:
"timestamp" + 5m
"timestamp" - 30s
(5m + 30s) → Int64 (ms)
Add/subtract final Int64 to timestamp to regain Timestamp type.

[[SECTION:NULLABILITY_CONVERSIONS]]
[[TAGS: NULLABILITY MERGE RULES]]
Nullability merge:
nullable op non_null → nullable
nullable op nullable → nullable
non_null op non_null → non_null
Example:
(priceNullable + 1) → nullable
To narrow (expr AS Int32 NOT NULL) only after ensuring no NULL (semantic guarantee).

[[SECTION:NULL_AND_NAN_SEMANTICS]]
[[TAGS: NULL NAN SEMANTICS FILTERING]]
NULL propagates through most expressions.
NaN (floats) is not NULL; filter both if needed:
WHERE val IS NOT NULL AND val = val   -- second clause excludes NaN.

[[SECTION:ARRAY_CONVERSION_RULES]]
[[TAGS: ARRAY CONVERSIONS PROMOTION]]
Array literal unification:
1. Integers → promote to highest present (≥ Int32).
2. Presence of DECIMAL (no floats) → whole array DECIMAL.
3. Presence of Float64 → array Float64 (unless DECIMAL present—then cast explicitly).
4. DECIMAL mixed with any float → cast elements first.
5. Empty [] not allowed without typed context.

[[SECTION:CAST_SYNTAX]]
[[TAGS: CAST SYNTAX USAGE]]
Inline cast pattern (no CAST keyword):
expr AS TypeName
Examples:
price AS DECIMAL
count AS Float64
longVal AS Int32
("timestamp" - baseTs) / 1000 AS DECIMAL

[[SECTION:MIXED_TYPE_EXAMPLES]]
[[TAGS: EXAMPLES MIXED TYPES]]
SELECT (quantity * price) FROM "ticks"                 -- Int32 * DECIMAL → DECIMAL
SELECT (size AS Float64) / 1000 FROM "ticks"
SELECT ("timestamp" - prevTs) FROM "events"            -- Int64 duration
SELECT "timestamp" + 5m FROM "events"
SELECT (("timestamp" - baseTs) / 1000 AS DECIMAL) FROM "events"
SELECT ((floatVal AS DECIMAL) + decAdj) FROM "stream"

[[SECTION:EDGE_CASES]]
[[TAGS: EDGE CASES PRECISION]]
1. DECIMAL + Float: pick target explicitly (avoid silent float widening).
2. Integer division truncates—cast one side to DECIMAL for fractional result.
3. Large Int64 to Float64 may lose precision > 2^53.
4. Negative interval arithmetic preserves sign (no special handling).

[[SECTION:BEST_PRACTICES]]
[[TAGS: BEST_PRACTICES CONVERSIONS]]
1. Use DECIMAL for monetary/exact math; convert to Float only at boundaries.
2. Cast early to control downstream promotions.
3. Normalize time diffs: ("timestamp" - baseTs) / 1000 AS DECIMAL for seconds.
4. Keep durations Int64 until final human unit conversion.
5. Avoid chained casts—choose definitive target type once.
6. Verify absence of NULL before narrowing nullability.

[[SECTION:ANTI_PATTERNS]]
[[TAGS: ANTI_PATTERNS CONVERSIONS]]
Avoid:
1. Relying on implicit DECIMAL ↔ Float mixing.
2. Expecting integer division to yield fractions.
3. Narrowing Int64 to Int32 without range validation.
4. Treating Timestamp as plain number for arbitrary arithmetic.
5. Building arrays with mixed DECIMAL and float without prior explicit casts.

[[SECTION:EXAMPLES_MIN]]
[[TAGS: EXAMPLES QUICK]]
Decimal sum:
SELECT (bidPrice AS DECIMAL) + (offerPrice AS DECIMAL) FROM "quotes"
Timestamp delta (seconds):
SELECT (("timestamp" - baseTs) / 1000 AS DECIMAL) FROM "events"
Integer promotion:
SELECT (small1 + small2) AS total FROM "metrics"
Add duration:
SELECT "timestamp" + 30s FROM "events"

[[SECTION:REFERENCE_END]]
[[TAGS: END REFERENCE CONVERSIONS]]
End of data type conversions reference.
