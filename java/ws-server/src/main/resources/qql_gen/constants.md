---
title: Constants
tags: [qql, constants, literals, numeric, integer, long, decimal64, double, float, interval, boolean, timestamp, date, string, char, arrays, escape, typing, coercion, best_practices, anti_patterns, examples]
---

[[SECTION:CONSTANTS_OVERVIEW]]
[[TAGS: CONSTANTS LITERALS OVERVIEW]]
Constants (literals) provide inline scalar or array values in QQL expressions (projections, filters, GROUP BY keys, function arguments). Type inference follows suffix + literal form rules.

[[SECTION:NUMERIC_SCALARS]]
[[TAGS: NUMERIC INTEGER LONG DECIMAL DOUBLE FLOAT]]
Numeric literal categories:
1. Integer (no suffix, no decimal point) → INTEGER (Int32). Example: 123
2. Long (trailing L / l) → INT64. Example: 123L
3. Decimal (decimal point or scientific notation without f/F) → DECIMAL64. Examples: 12.5  -0.003  1.36e-5  -1.2e10
4. Floating / Double (trailing f / F) → DOUBLE (binary floating). Examples: 12.5f  0.0f  1.36e-5f
5. Negative forms use leading -. Example: -237  -2.5  -3.4e2
   Notes:
- Prefer DECIMAL64 for monetary / exact scale semantics; use DOUBLE only for engineering / approximate data.
- Scientific notation allowed for decimal or double depending on f suffix.

[[SECTION:TIME_INTERVAL_LITERALS]]
[[TAGS: INTERVAL DURATION TIME RANGE]]
Interval literal pattern (ordered concatenation of parts):
{days}d{hours}h{minutes}m{seconds}s{milliseconds}ms
Examples: 1h  5m30s  1d10h20m42s500ms  3000ms
Result type: INT64 (duration in milliseconds).
Mixing INT64 durations and interval literals in arithmetic allowed (consistent INT64).

[[SECTION:NUMERIC_ARRAYS]]
[[TAGS: ARRAYS NUMERIC INTEGER LONG DECIMAL DOUBLE]]
Array literal syntax: [elem1, elem2, ...]
All elements must resolve to a single compatible type:
1. INTEGER array: [1, 2, -3]
2. LONG array: [1L, 2L, 3L] or mixture promoting to LONG: [1L, 2, 3]
3. DECIMAL64 array: [1.2, -3, 4.50] (integers promoted to DECIMAL64)
4. DOUBLE array: [1.2f, 3f, -0.1f]
5. Interval array (INT64): [1h, 5m30s, 120000L]
   Rules:
- A single f suffix inside otherwise decimal numbers forces DOUBLE array.
- Mixed DECIMAL64 + DOUBLE not allowed (explicit CAST if needed).
- Empty array literal ([]) unsupported without explicit typed context (avoid).

[[SECTION:BOOLEAN_LITERALS]]
[[TAGS: BOOLEAN TRUE FALSE]]
Boolean literals: true  false
Boolean arrays: [true, false, true]
No numeric coercion (do not rely on 0 / 1 mapping).

[[SECTION:TIMESTAMP_LITERALS]]
[[TAGS: TIMESTAMP DATE TIME LITERALS]]
Timestamp literal pattern: 'text'd
Datetime text format:
YYYY
YYYY-MM
YYYY-MM-DD
YYYY-MM-DD HH
YYYY-MM-DD HH:MM
YYYY-MM-DD HH:MM:SS
YYYY-MM-DD HH:MM:SS.sssssssss
Optional space + time zone (e.g., America/New_York).
Examples:
'2024'd
'2024-03-28'd
'2024-03-28 14'd
'2024-03-28 14:02:59.1'd
'2024-03-28 14:02:59.317859261'd
'2008 America/New_York'd
Arrays: ['2024-01-01'd, '2024-01-02 12:30'd]
Omitted components default: month=01, day=01, time=00:00:00.000, zone=UTC.

[[SECTION:STRING_LITERALS]]
[[TAGS: STRING VARCHAR LITERALS ESCAPE]]
String literal: single quoted UTF8 sequence.
Examples: 'Hello'  'Don\'t panic!'  'Line\nBreak'
Arrays: ['A', 'B', 'C']
Escape sequences (backslash prefixed) allowed for quotes and control chars (see special escapes section).
Empty string: '' (distinct from NULL).
No implicit trimming of whitespace.

[[SECTION:CHAR_LITERALS]]
[[TAGS: CHAR CHARACTER LITERALS]]
Character literal: single quoted char followed by c suffix.
Examples: 'A'c  '1'c  '\''c
Char arrays: ['A'c, 'Z'c, '0'c]
Difference vs 1-length string:
- CHAR stores a single code point.
- Use VARCHAR for variable length text or when empty string valid.

[[SECTION:SPECIAL_ESCAPE_SEQUENCES]]
[[TAGS: ESCAPE SEQUENCES STRING CHAR]]
Supported escape sequences inside string / char:
\'  single quote
\"  double quote
\\  backslash
\t  tab
\b  backspace
\r  carriage return
\f  formfeed
\n  newline
Example: 'Hello, it\'s me!'

[[SECTION:TYPE_INFERENCE_RULES]]
[[TAGS: TYPING INFERENCE COERCION]]
Inference:
1. Unsuffixed integers → INTEGER; widen to LONG if any LONG present.
2. Presence of decimal point / exponent (no f) → DECIMAL64.
3. Presence of f suffix anywhere in numeric array → DOUBLE array.
4. Mixing INTEGER + DECIMAL64 → DECIMAL64.
5. Mixing INTEGER + DOUBLE (via f) → DOUBLE.
6. No automatic DECIMAL64 ↔ DOUBLE merge (explicit CAST).
7. Intervals produce INT64; arithmetic with INT32 may widen to INT64.

[[SECTION:USAGE_EXAMPLES]]
[[TAGS: EXAMPLES CONSTANTS USAGE]]
Projection of mixed constants:
SELECT 1, 2L, 3.5, 4.5f FROM "ticks"
Interval arithmetic:
SELECT 5m + 30s, 1h - 10m FROM "ticks"
Timestamp filter:
SELECT price FROM "ticks" WHERE "timestamp" >= '2024-01-01'd
Array length:
SELECT ARRAY_LENGTH([1,2,3]) FROM "ticks"
String + conditional:
SELECT ('high' IF price > 100 ELSE 'low'), price FROM "ticks"
Char comparison:
SELECT side FROM "orders" WHERE side == 'B'c

[[SECTION:BEST_PRACTICES]]
[[TAGS: BEST_PRACTICES CONSTANTS]]
1. Use DECIMAL64 for monetary precision; avoid DOUBLE unless required.
2. Keep arrays homogeneous; add explicit suffixes early to avoid unintended promotion.
3. Always include c suffix for CHAR to prevent misclassification as VARCHAR.
4. Use timestamp literals with full precision when correlating high-resolution events.
5. Prefer interval literals (5m) over raw millisecond longs for readability.
6. Escape only what is necessary; avoid over-escaping (hurts readability).
7. Factor repeated literal sets into ENUM or stream schema when they represent stable domains.

[[SECTION:ANTI_PATTERNS]]
[[TAGS: ANTI_PATTERNS CONSTANTS AVOID]]
Avoid:
1. Mixing DECIMAL64 and DOUBLE in one array (ambiguous precision).
2. Using DOUBLE for currency values.
3. Omitting c in single-character semantic constants.
4. Large inline arrays of domain codes (define ENUM instead).
5. Using raw millisecond longs (e.g., 60000L) instead of 1m.
6. Overusing timestamp literals inside loops of client code (precompute boundaries).
7. Relying on implicit widening across heterogeneous numeric forms instead of explicit CAST for clarity.

[[SECTION:MIGRATION_NOTES]]
[[TAGS: MIGRATION CONSTANTS EVOLUTION]]
Changing literal forms:
- INTEGER → LONG (add L) safe if consumers expect bigger range.
- DECIMAL64 ↔ DOUBLE change may affect precision; audit downstream calculations.
- Replacing repeated string constants with ENUM requires query + schema updates (introduce ENUM, update filters).

[[SECTION:REFERENCE_END]]
[[TAGS: CONSTANTS END REFERENCE]]
End of constants reference.
