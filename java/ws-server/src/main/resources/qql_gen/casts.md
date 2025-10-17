---
title: Casts
tags: [qql, casts, object, polymorphic, array, primitive, syntax, alias, extension, best_practices, examples]
---

[[SECTION:CASTS_OVERVIEW]]
[[TAGS: CASTS OVERVIEW PURPOSE]]
Casting changes the object (message) or value interpretation to:
1. Restrict a polymorphic object to one or more concrete types.
2. Expand (declare) a wider polymorphic set (missing types yield NULL rows for those cast branches).
3. Convert primitive scalar types.
   AS acts either as a cast (object / primitive) or as an alias (column rename) per disambiguation rules.

[[SECTION:CASTS_SYNTAX_OBJECT]]
[[TAGS: CASTS OBJECT SYNTAX POLYMORPHIC]]
Object cast (narrow to single concrete type):
SELECT sourceObj AS package.TypeName
Polymorphic object cast (restrict to listed types):
SELECT sourceObj AS object(package.TypeA, package.TypeB)
Semantics:
- If runtime type ∈ listed types → projected as that concrete type.
- Otherwise result NULL (row preserved unless filtered out later).

[[SECTION:CASTS_ALIAS_DISAMBIGUATION]]
[[TAGS: CASTS ALIAS DISAMBIGUATION]]
AS resolves as:
1. Cast when the token after AS matches an existing object type name or object(...) / array(...).
2. Alias when the token is not a known type.
   Force alias when a name collides with a type: wrap in single quotes.
   Example:
   SELECT entry AS 'TradeEntry'   (alias, not cast)
   SELECT entry AS TradeEntry     (cast if TradeEntry is known type)

[[SECTION:CASTS_EXTENDING_TYPES]]
[[TAGS: CASTS EXTEND POLYMORPHIC NEW_TYPES]]
You may declare additional types not present in current data:
SELECT entry AS object(pkg.L1Entry, pkg.L2Entry, pkg.TradeEntry)
If pkg.TradeEntry never occurs, projected entries of that declared branch yield NULL fields for that type; keeps a stable wider polymorphic schema.

[[SECTION:CASTS_ARRAY]]
[[TAGS: CASTS ARRAY POLYMORPHIC FIXED]]
Array cast syntax parallels object cast:
Fixed single-type array:
entries AS array(pkg.TradeEntry)
Polymorphic array:
entries AS array(pkg.L1Entry, pkg.L2Entry)
Filtering post cast (example predicate form):
(entries AS array(pkg.TradeEntry))[THIS IS NOT NULL]
Cast inside path:
(entries.attributes[THIS IS pkg.FixAttribute] AS array(pkg.FixAttribute)).key

[[SECTION:CASTS_ARRAY_SELECTION_PATTERN]]
[[TAGS: CASTS ARRAY PATTERN L1 L2]]
Pattern extracting bid/ask from polymorphic entries:
SELECT
entry[side == ASK].price AS askPrice,
entry[side == ASK].size  AS askSize,
entry[side == BID].price AS bidPrice,
entry[side == BID].size  AS bidSize
FROM "kraken"
ARRAY JOIN (entries AS array(pkg.universal.L1entry))[THIS IS NOT NULL] AS entry

[[SECTION:CASTS_PRIMITIVES]]
[[TAGS: CASTS PRIMITIVE SCALAR CONVERSION]]
Primitive casts use AS with target scalar type:
byteField AS INT16
byteField AS FLOAT64
tsIntField AS TIMESTAMP
'1970-01-01 00:00:02.000'd AS INT64
Lossy direction: higher precision → lower precision (e.g., INT16 → INT8) may truncate / overflow.

[[SECTION:CASTS_EXAMPLES_OBJECT]]
[[TAGS: CASTS EXAMPLES OBJECT]]
Select information objects cast to concrete type:
SELECT order.info AS pkg.orders.LimitOrderInfo
Polymorphic narrowing then access:
SELECT entry AS object(pkg.entries.L1Entry, pkg.entries.L2Entry) FROM "packages" ARRAY JOIN entries AS entry
Extension with extra type (missing → NULL rows for that branch):
SELECT entry AS object(pkg.entries.L1Entry, pkg.entries.L2Entry, pkg.entries.TradeEntry) FROM "packages" ARRAY JOIN entries AS entry

[[SECTION:CASTS_EXAMPLES_ARRAY]]
[[TAGS: CASTS EXAMPLES ARRAY]]
Cast polymorphic Entries array to fixed TradeEntry array:
SELECT entries AS array(pkg.entries.TradeEntry) FROM "packages"
Filter non‑empty post cast (illustrative predicate syntax):
SELECT entries AS array(pkg.entries.TradeEntry)[THIS IS NOT NULL] FROM "packages"
Polymorphic array cast:
SELECT entries AS array(pkg.entries.L1Entry, pkg.entries.L2Entry) FROM "packages"
Attribute extraction after narrowing:
SELECT (entries.attributes[THIS IS pkg.FixAttribute] AS array(pkg.FixAttribute)).key FROM "packages"
Project prices from TradeEntry subarray:
SELECT (entries AS array(pkg.universal.TradeEntry)).price AS Price FROM "binance2" WHERE size(entries[THIS IS pkg.universal.TradeEntry]) > 0

[[SECTION:CASTS_EXAMPLES_PRIMITIVE]]
[[TAGS: CASTS EXAMPLES PRIMITIVE]]
Multiple primitive casts:
SELECT
byteField AS INT8,
byteField AS INT16,
byteField AS INT32,
byteField AS INT64,
byteField AS DECIMAL,
byteField AS FLOAT32,
byteField AS FLOAT64,
byteField AS CHAR,
byteField AS BOOLEAN,
byteField AS TIMESTAMP,
byteField AS VARCHAR
FROM "alltypes"
Integer ↔ timestamp and array form:
SELECT
1000 AS TIMESTAMP,
'1970-01-01 00:00:02.000'd AS INT64,
['1970-01-01 00:00:01.000'd, '1970-01-01 00:00:02.000'd] AS array(INT64)

[[SECTION:CASTS_BEST_PRACTICES]]
[[TAGS: CASTS BEST_PRACTICES GUIDELINES]]
1. Narrow early to reduce downstream field ambiguity.
2. Use polymorphic casts only when multiple runtime types required in one column set.
3. Add new types in casts sparingly; NULL heavy expansions can confuse consumers.
4. Filter NULL results explicitly after casts when subsequent logic assumes presence.
5. Keep primitive casts minimal; avoid unnecessary chaining (e.g., INT8 → INT16 → INT32).

[[SECTION:CASTS_ANTI_PATTERNS]]
[[TAGS: CASTS ANTI_PATTERNS]]
Avoid:
1. Casting solely to rename (use alias with quoted name instead).
2. Declaring large unused type lists (object(A,B,C,...)) when only one appears.
3. Relying on extended types to signal absence instead of a clear nullable field.
4. Silent lossy downcasts on critical numeric metrics.
5. Casting arrays repeatedly inside tight projections (cache intermediate if language permits).

[[SECTION:CASTS_REFERENCE_END]]
[[TAGS: CASTS END REFERENCE]]
End of casts reference.
