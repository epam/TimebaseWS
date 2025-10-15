---
title: Timestamp Type Operations
tags: [qql, timestamp, operations, literals, intervals, arithmetic, difference, casting, filtering, intraday, windowing, best_practices, pitfalls, examples]
---

[[SECTION:OVERVIEW]]
[[TAGS: OVERVIEW PURPOSE TIMESTAMP EPOCH]]
TIMESTAMP represents an absolute instant in milliseconds since Unix epoch (1970‑01‑01 00:00:00.000 UTC). Built‑in field "timestamp" exists on every message; do not redeclare in DDL.

[[SECTION:LITERALS]]
[[TAGS: LITERALS SYNTAX TIMESTAMP]]
Literal syntax (example pattern):
'2024-01-10 09:30:00.000'd
Rules:

- Date part: YYYY-MM-DD
- Time part: HH:MM:SS.mmm
- Trailing d designates timestamp literal.

[[SECTION:INTERVAL_UNITS]]
[[TAGS: INTERVAL UNITS COMPOSITE]]
Interval tokens concatenate without separators:
5s 2m 3h 7d
Composable (e.g., 1d5h, 2h30m). Evaluation converts to total milliseconds.

[[SECTION:ARITHMETIC]]
[[TAGS: ARITHMETIC ADD SUBTRACT]]
timestamp + integer(ms) → timestamp
timestamp - integer(ms) → timestamp
timestamp + interval → timestamp
timestamp - interval → timestamp
timestamp - timestamp → INT64 (millisecond delta)

[[SECTION:ARITHMETIC_EXAMPLES]]
[[TAGS: EXAMPLES ARITHMETIC]]
SELECT '2022-10-10 10:10:10.000'd + 10
SELECT '2022-10-10 10:10:10.000'd + 1d5h
SELECT '2022-10-10 10:10:10.010'd - '2022-10-10 10:10:10.000'd

[[SECTION:COMPARISONS]]
[[TAGS: COMPARISON FILTERING]]
Standard operators: == != > >= < <=
SELECT * FROM "trades"
WHERE "timestamp" >= '2024-01-01 00:00:00.000'd
AND "timestamp" <  '2024-02-01 00:00:00.000'd

[[SECTION:RANGE_FILTERING]]
[[TAGS: FILTER RANGE BETWEEN]]
SELECT * FROM "quotes"
WHERE "timestamp" >= '2024-03-01 09:30:00.000'd
AND "timestamp" <= '2024-03-01 16:00:00.000'd

[[SECTION:RELATIVE_WINDOWS]]
[[TAGS: RELATIVE LOOKBACK NOW PATTERN]]
Pattern for last N hours:
SELECT * FROM "ticks"
WHERE "timestamp" >= '2024-03-10 12:00:00.000'd - 2h

[[SECTION:CASTING]]
[[TAGS: CASTING TIMEOFDAY EXTRACTION]]
Extract intraday time:
SELECT ("timestamp" AS TIMEOFDAY) FROM "trades"
Compare intraday window:
SELECT * FROM "trades"
WHERE ("timestamp" AS TIMEOFDAY) >= 34200000   -- 09:30:00.000
AND ("timestamp" AS TIMEOFDAY) <  57600000   -- 16:00:00.000

[[SECTION:DURATION_DERIVATION]]
[[TAGS: DURATION DIFFERENCE MILLIS]]
Compute session span:
WITH startTs == '2024-01-10 09:30:00.000'd, endTs == '2024-01-10 16:00:00.000'd
SELECT endTs - startTs

[[SECTION:ORDERING]]
[[TAGS: ORDER TEMPORAL SORT]]
Temporal ascending is natural stream order; explicit ordering clause not shown—processing preserves ingestion chronology unless engine provides override constructs.

[[SECTION:OVER_TIME_INTEGRATION]]
[[TAGS: WINDOW OVER_TIME RANGE]]
Timestamp participates in window bounding:
SELECT RUNNING max{}("price")
FROM "ticks"
OVER TIME (1h)
Filters still may further narrow:
SELECT RUNNING avg{}("price")
FROM "ticks"
OVER TIME (30m)
WHERE "timestamp" >= '2024-03-01 10:00:00.000'd

[[SECTION:DERIVED_CLASSIFICATION]]
[[TAGS: INTRADAY CLASSIFICATION SESSION]]
Label regular session vs after-hours:
SELECT
("timestamp" AS TIMEOFDAY) AS 'tod',
price,
(("timestamp" AS TIMEOFDAY) >= 34200000
AND ("timestamp" AS TIMEOFDAY) < 57600000) AS 'isRegular'
FROM "trades"

[[SECTION:BEST_PRACTICES]]
[[TAGS: BEST_PRACTICES TIMESTAMP]]

1. Use inclusive start, exclusive end pattern for day boundaries.
2. Prefer interval arithmetic over manual millisecond constants for clarity.
3. Cast to TIMEOFDAY only for intraday classification—not for absolute ordering.
4. Subtract timestamps only when both are guaranteed non-null and ordered.

[[SECTION:COMMON_MISTAKES]]
[[TAGS: PITFALLS ERRORS]]

1. Adding two timestamps (meaningless)—use intervals instead.
2. Treating timestamp difference as seconds (result is milliseconds).
3. Forgetting to place OVER TIME before WHERE.
4. Mixing DATE-ONLY semantics—always full datetime in literals.

[[SECTION:PERFORMANCE_NOTES]]
[[TAGS: PERFORMANCE FILTER SELECTIVITY]]
Early range filters on "timestamp" reduce scan volume—apply them before complex expression filters to leverage engine index/partition pruning (if implemented).

[[SECTION:QUICK_EXAMPLES]]
[[TAGS: EXAMPLES QUICK]]
Last day price range (explicit bounds):
SELECT price FROM "ticks"
WHERE "timestamp" >= '2024-03-20 00:00:00.000'd
AND "timestamp" <  '2024-03-21 00:00:00.000'd
Rolling max 2h:
SELECT RUNNING max{}("price") FROM "ticks" OVER TIME (2h)
Latency (ms) from reference anchor:
WITH anchor = '2024-03-20 14:00:00.000'd
SELECT "timestamp" - anchor FROM "events"

[[SECTION:REFERENCE_END]]
[[TAGS: END TIMESTAMP OPS REFERENCE]]
End of timestamp operations reference.
