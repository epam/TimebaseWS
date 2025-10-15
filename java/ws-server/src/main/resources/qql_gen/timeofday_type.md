---
title: TIMEOFDAY Data Type
tags: [ddl, data_types, timeofday, temporal, type, range, casting, filtering, example, best_practices]
---

[[SECTION:OVERVIEW]]
[[TAGS: OVERVIEW PURPOSE TEMPORAL]]
TIMEOFDAY represents a wall‑clock time (no date) with millisecond precision: 00:00:00.000 → 23:59:59.999. Stored as integer milliseconds since midnight.

[[SECTION:DEFINITION]]
[[TAGS: DEFINITION TYPE SIZE PRECISION]]
Core traits:
- Logical domain: time within a single calendar day.
- Resolution: 1 ms.
- Stored as 64‑bit integer (implementation detail; value range bounded).
- Not timezone aware (interpretation depends on session / environment).

[[SECTION:RANGE_STORAGE]]
[[TAGS: RANGE MIN MAX STORAGE]]
Range:
- Min: 0  (00:00:00.000)
- Max: 86\,399\,999 (23:59:59.999)
  Out‑of‑range assignment should raise validation error.

[[SECTION:DDL_USAGE]]
[[TAGS: DDL USAGE FIELD DECLARATION]]
Declare fields with TIMEOFDAY like any scalar:
CLASS "SampleTimeMessage" (
    "sessionOpen"  TIMEOFDAY NOT NULL,
    "sessionClose" TIMEOFDAY,
    "eventTime"    TIMEOFDAY
)

[[SECTION:SELECT_USAGE]]
[[TAGS: SELECT PROJECTION FILTERING]]
Projection:
SELECT sessionOpen, sessionClose FROM "sessions"
Filtering (e.g., events after 14:30):
SELECT * FROM "sessions" WHERE eventTime >= 52200000
(52200000 ms = 14 * 3\,600\,000 + 30 * 60 * 1000)

[[SECTION:LITERALS_REPRESENTATION]]
[[TAGS: LITERALS REPRESENTATION MILLIS]]
If no dedicated literal syntax exists (e.g., '14:30:00.000'), use millisecond integer constants.
Provide helper conversion externally; avoid embedding ad‑hoc parsing in QQL.

[[SECTION:COMPARISONS]]
[[TAGS: COMPARISON OPERATORS ORDERING]]
Standard relational operators apply: == != > >= < <=
Example (in‑range filter):
SELECT * FROM "sessions"
WHERE sessionOpen < sessionClose
AND sessionOpen >= 28800000   -- 08:00
AND sessionClose <= 61200000  -- 17:00

[[SECTION:DERIVED_CALCULATIONS]]
[[TAGS: ARITHMETIC DIFF DURATION]]
Duration inside day:
SELECT sessionClose - sessionOpen AS 'openDuration'
FROM "sessions"
Validate non‑negative:
SELECT * FROM "sessions" WHERE sessionClose - sessionOpen < 0  -- anomaly

[[SECTION:CASTING_CONVERSIONS]]
[[TAGS: CASTING CONVERSION INTEROP TIMESTAMP]]
Common patterns:
1. To TIMESTAMP (if same day context): (eventTime AS TIMESTAMP) may map to today’s date + time (implementation dependent).
2. From TIMESTAMP to TIMEOFDAY: (tsField AS TIMEOFDAY) (drops date portion).
3. Avoid casting TIMEOFDAY to DATE/TIMESTAMP if day context unspecified.

[[SECTION:INTERACTION_TIMESTAMP]]
[[TAGS: TIMESTAMP INTEROP ALIGNMENT]]
TIMESTAMP + TIMEOFDAY alignment:
SELECT ("timestamp" AS TIMEOFDAY) AS 'eventTod', sessionOpen
FROM "sessions"
Compare actual vs scheduled start within tolerance.

[[SECTION:INDEXING_OPTIMIZATION]]
[[TAGS: OPTIMIZATION FILTERING RANGE]]
Filtering by bounded intraday windows (e.g., market hours) is efficient when applied early:
SELECT * FROM "trades"
WHERE ("timestamp" AS TIMEOFDAY) BETWEEN 34200000 AND 57600000

[[SECTION:BEST_PRACTICES]]
[[TAGS: PRACTICES GUIDELINES]]
1. Store recurring schedule anchors (open/close) as TIMEOFDAY; store actual events as TIMESTAMP.
2. Keep arithmetic within bounds (no cross‑midnight subtraction without normalization).
3. Precompute millisecond constants externally for readability.
4. Use TIMESTAMP for chronological ordering; TIMEOFDAY for classification/grouping.

[[SECTION:COMMON_MISTAKES]]
[[TAGS: PITFALLS ERRORS]]
1. Treating TIMEOFDAY as timezone‑shifted (it is neutral).
2. Adding durations that exceed one day without modulo handling.
3. Casting TIMEOFDAY to TIMESTAMP expecting preserved date (date context may be arbitrary).
4. Using negative or >= 86\,400\,000 constants.

[[SECTION:VALIDATION_PATTERN]]
[[TAGS: VALIDATION SANITY CHECK]]
Detect invalid/improbable window:
SELECT * FROM "sessions"
WHERE sessionClose < sessionOpen

[[SECTION:EXAMPLES_MIN]]
[[TAGS: EXAMPLES QUICK]]
DDL snippet:
CLASS "MarketWindow" (
    "regularOpen"  TIMEOFDAY NOT NULL,
    "regularClose" TIMEOFDAY NOT NULL
)
Intraday filter:
SELECT * FROM "trades"
WHERE ("timestamp" AS TIMEOFDAY) >= 34200000  -- 09:30:00.000
AND ("timestamp" AS TIMEOFDAY) < 57600000   -- 16:00:00.000
Duration derivation:
SELECT regularClose - regularOpen AS 'sessionLen' FROM "marketSchedule"

[[SECTION:REFERENCE_END]]
[[TAGS: END TIMEOFDAY REFERENCE]]
End of TIMEOFDAY type reference.
