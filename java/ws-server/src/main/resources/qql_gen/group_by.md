---
title: GROUP BY Clause
tags: [qql, group_by, aggregation, grouping, last_records, memory, maxGroupsCount, array_join, examples]
---

[[SECTION:OVERVIEW]]
[[TAGS: OVERVIEW PURPOSE GROUP_BY]]
GROUP BY aggregates messages partitioned by one or more expressions. Result emits only the last (most recent) record per group (not cumulative multi‑row result sets like typical SQL engines). Behavior is specific to QQL polymorphic stream processing; do not assume generic SQL semantics.

[[SECTION:SUPPORTED_GROUP_KEYS]]
[[TAGS: GROUP_BY TYPES SUPPORTED BOOLEAN CHAR DATETIME TIMEOFDAY INTEGER VARCHAR ENUM]]
Supported grouping key types: BOOLEAN, CHAR, DATETIME, TIMEOFDAY, INTEGER, VARCHAR, ENUM. Calculated expressions may also be used as group keys.

[[SECTION:SEMANTICS]]
[[TAGS: SEMANTICS LAST_RECORD PARTITION]]
For each distinct key (or key tuple) the engine maintains an aggregated state. Output after grouping reflects the final (last) aggregated record per key within the query scope (time range / input scan). Stateful aggregate functions (e.g. count{}(), avg{}()) operate per group.

[[SECTION:ARRAY_JOIN_INTERACTION]]
[[TAGS: ARRAY_JOIN ENTRIES GROUP_BY DEPTH]]
When using ARRAY JOIN to project array elements (e.g. order book entries), group keys can reference the joined alias (e.g. entry.level). Aggregations then apply at the per‑element granularity.

[[SECTION:MEMORY_LIMITS]]
[[TAGS: MEMORY LIMITS MAXGROUPSCOUNT CACHING PERFORMANCE]]
Large group cardinality may exceed in‑memory thresholds. When group count surpasses configured maxGroupsCount (default 1,000,000 via JVM property -DTimeBase.qql.maxGroupsCount=1000000) groups may spill / cache to disk causing performance degradation and potential phased processing delays.

[[SECTION:BASIC_EXAMPLES]]
[[TAGS: GROUP_BY EXAMPLES BASIC]]
Group by single implicit identity field (symbol):
SELECT * FROM "binance" GROUP BY "symbol"

Group by array entry level (after ARRAY JOIN):
SELECT entry.*, entry.level, count{}()
FROM "binance"
ARRAY JOIN "entries" AS entry
GROUP BY entry.level

Group by multiple keys (entry level + symbol):
SELECT entry.*, entry.level, count{}()
FROM "binance"
ARRAY JOIN "entries" AS entry
GROUP BY entry.level, "symbol"

Group by computed modulus expression:
SELECT THIS.*, avg{}(totalQuantity)
FROM "infoA"
GROUP BY (infoIdA % 3)

[[SECTION:NOTES]]
[[TAGS: GROUP_BY NOTES CAUTION CARDINALITY]]
1. High cardinality grouping → potential disk caching (performance impact).
2. Only final record per group emitted (not incremental group updates).
3. Use computed expressions judiciously; they expand key space.

[[SECTION:REFERENCE_END]]
[[TAGS: END GROUP_BY]]
End of GROUP BY reference.
