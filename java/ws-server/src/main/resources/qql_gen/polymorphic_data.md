---
title: Polymorphic Data
tags: [qql, polymorphic, streams, record, union, query_state, pum, group_by_symbol, examples]
---

[[SECTION:OVERVIEW]]
[[TAGS: OVERVIEW POLYMORPHIC MULTI_TYPE STREAMS]]
Polymorphism: a single stream may contain multiple message classes. Queries over such a stream can return intermixed classes or produce new polymorphic outputs. Example (mixed TradeMessage + BestBidOfferMessage):
SELECT * FROM "tickquerydemo"

[[SECTION:BASIC_POLYMORPHIC_OUTPUT]]
[[TAGS: OUTPUT MIXED CLASSES DISPLAY]]
Selecting * emits original messages unchanged; headers show concrete class.
Example header pattern:
>deltix.timebase.api.messages.TradeMessage,TIMESTAMP,SYMBOL,TYPE,price,size
>deltix.timebase.api.messages.BestBidOfferMessage,TIMESTAMP,SYMBOL,TYPE,offerPrice,offerSize,bidPrice,bidSize

[[SECTION:RECORD_CONSTRUCTION]]
[[TAGS: RECORD TYPE WHEN POLYMORPHIC OUTPUT]]
RECORD ... TYPE ... WHEN builds a polymorphic result set by defining alternative RECORD projections, each guarded by a WHEN condition.
Pattern:
RECORD field_expr FIELD "name"[, ...] TYPE "ResultClassA" WHEN condition
RECORD field_expr FIELD "name"[, ...] TYPE "ResultClassB" WHEN condition
Example:
WITH entry AS L1Entry AS l1
SELECT
RECORD
entry.price FIELD "price",
entry.size FIELD "size"
TYPE "TradeMessage"
WHEN entry IS KrakenTradeEntry
RECORD
l1[side == ASK].price FIELD "offerPrice",
l1[side == ASK].size FIELD "offerSize",
l1[side == BID].price FIELD "bidPrice",
l1[side == BID].size FIELD "bidSize"
TYPE "BestBidOfferMessage"
WHEN entry IS L1Entry
FROM "kraken"
ARRAY JOIN entries AS entry

[[SECTION:UNION_CONSTRUCTION]]
[[TAGS: UNION POLYMORPHIC COMPOSITION]]
UNION combines separate SELECT blocks into a polymorphic dataset when each block assigns a TYPE.
Example:
SELECT
trade.price AS "price",
trade.size AS "size"
TYPE "TradeMessage"
FROM "kraken"
ARRAY JOIN entries[THIS IS KrakenTradeEntry] AS trade
UNION
SELECT
bbo[side == ASK].price AS "offerPrice",
bbo[side == ASK].size AS "offerSize",
bbo[side == BID].price AS "bidPrice",
bbo[side == BID].size AS "bidSize"
TYPE "BestBidOfferMessage"
FROM "kraken"
ARRAY JOIN (entries AS array(L1entry))[THIS IS NOT NULL] AS bbo

[[SECTION:POLYMORPHIC_UNION_MODEL]]
[[TAGS: PUM QUERY_STATE UNION MODEL]]
Selecting fields drawn from multiple underlying classes (e.g. price, bidPrice, offerPrice) constructs a Polymorphic Union Model (PUM). Engine maintains a single Query State object containing all referenced fields; each incoming source message updates only the fields it provides. NULL persists for fields not yet seen.

[[SECTION:QUERY_STATE_UPDATES]]
[[TAGS: QUERY_STATE FIELD_UPDATES TEMPORAL]]
Execution flow:
1. Initialize Query State fields (price, bidPrice, offerPrice) to NULL.
2. For each incoming message, update only the present fields.
3. Emit current Query State snapshot after each update (when selecting those fields).
   Result may mix symbols if not partitioned (undesired blending across instruments).

[[SECTION:GROUP_BY_SYMBOL]]
[[TAGS: GROUP_BY SYMBOL QUERY_STATE PARTITION]]
Adding GROUP BY SYMBOL creates an independent Query State per distinct symbol. Without it, all symbols share one state causing cross‑symbol field mixing. GROUP BY SYMBOL yields final (last) state per symbol after processing (last record per group semantics).

[[SECTION:EXAMPLE_PUM_NO_GROUP]]
[[TAGS: EXAMPLE PUM MIXED]]
Example (no grouping):
SELECT price, bidPrice, offerPrice FROM "tickquerydemo"
Produces blended updates where price from one symbol may appear with bid/offer from another.

[[SECTION:EXAMPLE_PUM_WITH_GROUP]]
[[TAGS: EXAMPLE GROUP_BY SYMBOL CORRECT]]
Example (partitioned):
SELECT price, bidPrice, offerPrice FROM "tickquerydemo" GROUP BY SYMBOL
Outputs one final record per symbol with independently maintained Query State.

[[SECTION:BEST_PRACTICE]]
[[TAGS: PRACTICE POLYMORPHIC STATE]]
Use:
- RECORD ... WHEN for conditional polymorphic shaping in a single SELECT.
- UNION when composing distinct full queries into one polymorphic result.
- GROUP BY SYMBOL (or additional keys) to avoid cross‑entity state contamination when combining fields from multiple classes.

[[SECTION:REFERENCE_END]]
[[TAGS: END POLYMORPHIC DATA]]
End of polymorphic data reference.
