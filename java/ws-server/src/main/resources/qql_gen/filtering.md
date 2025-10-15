---
title: Filtering
tags: [qql, filtering, where, predicates, timestamp, time_index, symbol, type, enum, nullability, range, between, performance, optimization, best_practices, anti_patterns, examples]
---

[[SECTION:OVERVIEW]]
[[TAGS: OVERVIEW PURPOSE]]
Filtering reduces the stream of polymorphic messages using WHERE predicates over fields, built‑ins ("timestamp","symbol","type"), and expressions.

[[SECTION:WHERE_SYNTAX]]
[[TAGS: WHERE SYNTAX BASIC]]
Pattern:
SELECT projection_list
FROM "stream"
[OVER TIME (<interval>)]
WHERE condition
Conditions combine comparison + logical operators. All identifiers must be double quoted.

[[SECTION:COMPARISON_OPERATORS]]
[[TAGS: OPERATORS COMPARISON]]
Supported: == != > >= < <= BETWEEN (inclusive). Avoid = (use ==).

[[SECTION:LOGICAL_OPERATORS]]
[[TAGS: OPERATORS LOGICAL]]
Combine predicates with AND OR; negate with NOT. Parentheses control precedence.

[[SECTION:LITERALS]]
[[TAGS: LITERALS STRING NUMERIC BOOLEAN DATE]]
String: 'TEXT'
Numeric: 42 3.14
Boolean: true false
Date/time literal (indexed filtering): 'YYYY-MM-DD HH:MM:SS'd (trailing d).

[[SECTION:SYMBOL_FILTERING]]
[[TAGS: SYMBOL FILTER]]
Example:
SELECT "price" FROM "ticks" WHERE "symbol" == 'XBANK'

[[SECTION:TYPE_FILTERING]]
[[TAGS: TYPE POLYMORPHISM CLASS]]
Filter specific message class:
SELECT "price" FROM "md"
WHERE THIS IS "deltix.timebase.api.messages.TradeMessage"

[[SECTION:ENUM_FILTERING]]
[[TAGS: ENUM FILTER]]
ENUM values compare by label string:
SELECT "price" FROM "trades"
WHERE "aggressorSide" == 'BUY'

[[SECTION:NULL_FILTERING]]
[[TAGS: NULL IS_NULL IS_NOT_NULL]]
Use IS NULL / IS NOT NULL:
SELECT "price" FROM "quotes" WHERE "offerPrice" IS NOT NULL

[[SECTION:RANGE_FILTERS]]
[[TAGS: RANGE BETWEEN INCLUSIVE]]
BETWEEN inclusive ends:
"timestamp" BETWEEN '2024-01-01 00:00:00'd AND '2024-01-01 01:00:00'd
Alternative open/closed:
"timestamp" >= '2024-01-01 00:00:00'd AND "timestamp" < '2024-01-01 01:00:00'd

[[SECTION:TIME_FILTERING]]
[[TAGS: TIMESTAMP FILTER]]
Direct comparison:
SELECT "bidPrice","offerPrice" FROM "quotes"
WHERE "timestamp" > '2024-02-10 12:00:00'd

[[SECTION:TIME_INDEX_OPTIMIZATION]]
[[TAGS: PERFORMANCE INDEX OPTIMIZATION TIMESTAMP]]
Engine uses time index when:

1. Predicate directly compares "timestamp" with one or two date literals (>, >=, <, <=, BETWEEN).
2. Combined with AND range form: "timestamp" >= lit1 AND "timestamp" < lit2.
   Avoid wrapping "timestamp" in functions or arithmetic (breaks optimization).

[[SECTION:COMBINED_PREDICATES]]
[[TAGS: COMPLEX AND OR]]
Example combining symbol + time + value:
SELECT "price","size" FROM "trades"
WHERE "symbol" == 'XBANK'
AND "timestamp" BETWEEN '2024-02-10 12:00:00'd AND '2024-02-10 12:05:00'd
AND "size" > 1000

[[SECTION:EXPRESSION_FILTERS]]
[[TAGS: EXPRESSIONS DERIVED]]
Derived expressions allowed:
SELECT ("offerPrice" - "bidPrice") AS DECIMAL FROM "quotes"
WHERE ("offerPrice" - "bidPrice") > 0.5

[[SECTION:ARRAY_PREDICATES]]
[[TAGS: ARRAY FILTER]]
If arrays present, use array functions (see array docs):
SELECT ARRAY_LENGTH("entries") FROM "orderBook"
WHERE ARRAY_LENGTH("entries") > 10

[[SECTION:OVER_TIME_INTERACTION]]
[[TAGS: OVER_TIME WINDOW WHERE]]
OVER TIME applies before WHERE evaluation; WHERE still filters emitted windowed rows:
SELECT RUNNING AVG{}("price") FROM "ticks"
OVER TIME (1h)
WHERE "price" > 0

[[SECTION:PERFORMANCE_NOTES]]
[[TAGS: PERFORMANCE HINTS]]

1. Narrow time range early—major scan reduction.
2. Equality on "symbol" + time range is highly selective.
3. Use TYPE filter to skip unrelated classes quickly.
4. Avoid non-sargable timestamp expressions (wrapping or casting).

[[SECTION:BEST_PRACTICES]]
[[TAGS: BEST_PRACTICES]]

1. Use canonical operators (== not =).
2. Combine time + symbol + type for precise subsets.
3. Normalize spreads or derived metrics once, reuse (WITH if supported).
4. Prefer open upper bound form for half-open intervals in rolling analytics.

[[SECTION:ANTI_PATTERNS]]
[[TAGS: ANTI_PATTERNS AVOID]]
Avoid:

1. Wrapping "timestamp" in functions (breaks index use).
2. Using = instead of ==.
3. Relying on implicit class fields across mixed TYPE set without guarding TYPE.
4. Broad unbounded scans when only recent slice needed.
5. Comparing DECIMAL to FLOAT without explicit cast choice upstream (precision drift).

[[SECTION:EXAMPLES_MIN]]
[[TAGS: EXAMPLES QUICK]]
Symbol single:
SELECT "price" FROM "trades" WHERE "symbol" == 'GREATCO'
Time slice:
SELECT "price" FROM "ticks" WHERE "timestamp" BETWEEN '2024-02-10 10:00:00'd AND '2024-02-10 10:01:00'd
Type + value:
SELECT "price","size" FROM "md"
WHERE THIS IS "deltix.timebase.api.messages.TradeMessage" AND "size" > 500
Spread filter:
SELECT ("offerPrice" - "bidPrice") AS DECIMAL FROM "quotes"
WHERE ("offerPrice" - "bidPrice") > 0.25

[[SECTION:REFERENCE_END]]
[[TAGS: END REFERENCE]]
End of filtering reference.
