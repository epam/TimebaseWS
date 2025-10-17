---
title: Data Types Overview
tags: [ddl, data_types, overview, scalar, string, integer, float, decimal, boolean, timestamp, time_of_day, enum, object, array, encoding, nullability, casting, evolution, best_practices, anti_patterns, examples]
---

[[SECTION:OVERVIEW]]
[[TAGS: OVERVIEW TYPES INTRO]]
QQL / TimeBase schemas define message fields with explicit data types plus optional encodings and constraints. Types shape storage, wire format, precision, and evolution safety.

[[SECTION:SCALAR_TYPE_SUMMARY]]
[[TAGS: TYPES SUMMARY SCALAR]]
Primary scalar families:
1. Text: CHAR, VARCHAR
2. Logical: BOOLEAN
3. Binary: BINARY
4. Numeric Integral: INTEGER (width/unsigned via encoding)
5. Numeric Approximate: FLOAT (BINARY(32|64))
6. Numeric Exact: DECIMAL (optional precision/scale encoding)
7. Temporal Absolute: TIMESTAMP (epoch ms)
8. Temporal Day: TIME_OF_DAY (ms since 00:00)
9. Symbolic: ENUM
10. Structural: OBJECT (composite arbitrary) — rarely used in typical market data vs CLASS nesting.

[[SECTION:CHAR_VARCHAR]]
[[TAGS: STRING CHAR VARCHAR ALPHANUMERIC]]
CHAR: single Unicode code point (use for fixed semantic tokens of length 1).  
VARCHAR: variable-length UTF8 text; empty string distinct from NULL.  
Encoding hints:
- ALPHANUMERIC(N) compresses restricted character set (e.g., exchange / currency codes) — choose smallest N covering length.
  Guidelines:
- Prefer ALPHANUMERIC for dense repetitive short codes.
- Use CHAR only when exactly one character by design (not merely current data shape).

[[SECTION:BOOLEAN]]
[[TAGS: BOOLEAN TYPE]]
BOOLEAN holds true / false. Avoid overloading with tri-state semantics; use nullable BOOLEAN if third state required.

[[SECTION:BINARY]]
[[TAGS: BINARY RAW]]
BINARY stores opaque byte arrays (blobs). Avoid for structured sub-documents unless no schema stability required.

[[SECTION:INTEGER_FAMILY]]
[[TAGS: INTEGER SIGNED UNSIGNED ENCODING RANGE]]
INTEGER base type refined by encoding:
- SIGNED(8|16|32|48|64)
- UNSIGNED(30|61) (bit-length specialized)
- INTERVAL (duration semantics)
  Selection rules:
1. Choose smallest width satisfying headroom (plan for growth).
2. Use UNSIGNED only when negative values impossible (saves bits).
3. INTERVAL for semantic durations (still stored as integer ms).
   Promotion in expressions: narrow integers promote to at least Int32; mixed widths unify to widest signed needed.

[[SECTION:FLOAT_DECIMAL]]
[[TAGS: FLOAT DECIMAL PRECISION]]
FLOAT: approximate binary (BINARY(32), BINARY(64) => Float32 / Float64).  
DECIMAL: exact base-10 arithmetic (optionally DECIMAL(p) or engine default).  
Rules:
1. Monetary / financial precision → DECIMAL.
2. Sensor or analytic approximate metrics → FLOAT (pick 32 vs 64 by precision variance).
3. Mixed DECIMAL + FLOAT in expressions requires explicit cast choice (see casting section).

[[SECTION:TIMESTAMP]]
[[TAGS: TIMESTAMP TEMPORAL EPOCH]]
TIMESTAMP = UTC epoch milliseconds (no zone). Suitable for ordering, joins, windows. Never store time zone offsets—carry separately if required.

[[SECTION:TIME_OF_DAY]]
[[TAGS: TIME_OF_DAY INTRADAY MILLIS]]
TIME_OF_DAY = milliseconds since midnight (local trading session or canonical). Combine with date if spanning multiple days externally.

[[SECTION:ENUM]]
[[TAGS: ENUM SYMBOLIC CONSTANTS]]
ENUM defines fixed symbolic domain (e.g., order side, status). Evolution:
- Add new value at end (backward compatible).
- Deprecate by documentation; removing is breaking.
  Prefer ENUM over clusters of one-character VARCHAR codes when semantic domain stable.

[[SECTION:OBJECT_TYPE]]
[[TAGS: OBJECT STRUCT FLEXIBLE]]
OBJECT allows heterogeneous nested structure (schema-lite). Use sparingly; explicit CLASS hierarchies preferred for evolution clarity and query optimization.

[[SECTION:ARRAY_TYPE]]
[[TAGS: ARRAY COLLECTION HOMOGENEOUS]]
ARRAY(T) represents homogeneous ordered elements of type T. Guidelines:
1. Keep element type primitive or ENUM for efficiency.
2. For polymorphic per-element needs, model separate CLASS messages instead of ARRAY of OBJECT.
3. Avoid excessively large arrays for streaming (consider splitting messages).

[[SECTION:NULLABILITY]]
[[TAGS: NULLABILITY OPTIONAL REQUIRED]]
Field default is nullable unless specified NOT NULL. Use NOT NULL only when source guarantees presence. Tightening nullable → NOT NULL is a breaking change unless data audited to guarantee non-null historically.

[[SECTION:ENCODING_GUIDELINES]]
[[TAGS: ENCODING OPTIMIZATION]]
1. Choose ALPHANUMERIC(N) for compact fixed-symbol domains.
2. Narrow integer width to realistic max; revisit if nearing saturation.
3. Favor DECIMAL where rounding risk unacceptable.
4. Avoid premature micro-encodings; profile before optimizing exotic widths.
5. Keep encoding stable across dependent systems to reduce churn.

[[SECTION:INLINE_CASTING]]
[[TAGS: CASTING INLINE SYNTAX]]
No CAST keyword. Pattern:
expr AS TypeName
Examples:
price AS DOUBLE
(size AS DECIMAL)
("timestamp" - baseTs) / 1000 AS DECIMAL
Use to:
- Promote integer math to DECIMAL for fractional ratios.
- Convert FLOAT to DECIMAL before combining with monetary fields.
- Normalize durations: ("timestamp" - prevTs) / 1000 AS DECIMAL

[[SECTION:TYPE_SELECTION_MATRIX]]
[[TAGS: SELECTION DECISIONS]]
Scenario → Recommendation:
- Monetary price/size → DECIMAL
- High-volume counter (fits 32 bits) → INTEGER SIGNED(32)
- Exchange code 'NYSE' → VARCHAR ALPHANUMERIC(4)
- Flag / toggle → BOOLEAN NOT NULL (if always present)
- Millisecond event time → TIMESTAMP
- Intraday HH:MM:SS use → TIME_OF_DAY
- Order side {BUY, SELL} → ENUM "Side"
- Small fixed char like 'B'/'S' only → ENUM preferred over CHAR if domain explicit

[[SECTION:EVOLUTION_MIGRATION]]
[[TAGS: EVOLUTION MIGRATION CHANGE]]
Common changes:
1. Widen integer SIGNED(32) → SIGNED(64): backward compatible (reader of old ok; writer new).
2. Add ENUM value: backward compatible (old readers may show UNKNOWN).
3. Tighten nullability (nullable → NOT NULL): breaking unless historical data validated.
4. Switch FLOAT → DECIMAL: may require downstream cast updates (precision improvement).
5. Introduce ALPHANUMERIC encoding to a VARCHAR: safe if all historical values conform to allowed charset/length.
6. Shrink width or remove ENUM value: breaking—avoid.

[[SECTION:BEST_PRACTICES]]
[[TAGS: BEST_PRACTICES GUIDELINES]]
1. Treat DECIMAL vs FLOAT intentionally; never mix casually.
2. Reserve NOT NULL for invariant presence.
3. Encode small symbolic domains as ENUM or ALPHANUMERIC(N) to compress.
4. Keep arrays logically bounded; extremely large arrays hinder downstream latency.
5. Document rationale for any non-default encoding (future maintainers benefit).
6. Use consistent integer widths across related fields (e.g., bidSize / offerSize both SIGNED(32)).

[[SECTION:ANTI_PATTERNS]]
[[TAGS: ANTI_PATTERNS AVOID]]
Avoid:
1. Using FLOAT for currency values (rounding drift).
2. Marking fields NOT NULL when upstream occasionally omits them.
3. Overusing OBJECT for structured data that deserves CLASS definitions.
4. Mixing DECIMAL and FLOAT without explicit casting intent.
5. Very wide integers (SIGNED(64)) for counters guaranteed < 1e6.
6. Encoding everything as VARCHAR for "flexibility" (harms compression/query speed).
7. Storing time zone text inside every message instead of normalizing externally.

[[SECTION:EXAMPLES_MIN]]
[[TAGS: EXAMPLES QUICK]]
Simple price schema:
ENUM "Side" (BUY, SELL);
CLASS "Trade" (price DECIMAL NOT NULL, size INTEGER SIGNED(32), side "Side")
Monetary ratio:
(bidPrice AS DECIMAL) / (offerPrice AS DECIMAL) AS DECIMAL
Duration seconds:
("timestamp" - baseTs) / 1000 AS DECIMAL
Alphanumeric code:
CLASS "VenueMap" (venue VARCHAR NOT NULL ALPHANUMERIC(4), descr VARCHAR)

[[SECTION:REFERENCE_END]]
[[TAGS: END REFERENCE]]
End of data types overview reference.
