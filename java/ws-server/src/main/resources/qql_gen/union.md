---
title: Union Keyword
tags: [qql, union, polymorphic, fixed-type, stream, casting, stream_union, restrictions, tips, caution, examples, reference]
---

[[SECTION:OVERVIEW]]
[[TAGS: OVERVIEW UNION PURPOSE]]
UNION combines results of multiple queries (same or different streams) into a single chronologically ordered dataset by message timestamp. Resulting dataset may be polymorphic (multiple classes) or fixed-type (single class) depending on TYPE usage in component queries.

[[SECTION:POLYMORPHIC_DATASET]]
[[TAGS: POLYMORPHIC MULTI_CLASS]]
A UNION produces a polymorphic dataset when component queries emit different message classes. Fields remain scoped to their originating class.

Example:
SELECT
trade.price AS "price",
trade.size AS "size"
TYPE "TradeMessage"
FROM kraken
ARRAY JOIN entries[THIS IS KrakenTradeEntry] AS trade
UNION
SELECT
bbo[side == ASK].price AS "offerPrice",
bbo[side == ASK].size AS "offerSize",
bbo[side == BID].price AS "bidPrice",
bbo[side == BID].size AS "bidSize"
TYPE "BestBidOfferMessage"
FROM kraken
ARRAY JOIN (entries AS array(L1entry))[THIS IS NOT NULL] AS bbo

Example:
WITH entries[THIS IS TradeEntry] AS 'entries'
SELECT
sum{}(sum(entries.size)) AS 'volume',
first{}(entries[0].price) AS 'open',
last{}(entries[-1].price) AS 'close',
max{}(max(entries.price)) AS 'high',
min{}(min(entries.price)) AS 'low'
TYPE "Bar1min"
FROM bitfinex
OVER TIME(1m)
WHERE symbol == 'BTCUSD'
AND notEmpty(entries)
UNION
WITH entries[THIS IS TradeEntry] AS 'entries'
SELECT
sum{}(sum(entries.size)) AS 'volume',
first{}(entries[0].price) AS 'open',
last{}(entries[-1].price) AS 'close',
max{}(max(entries.price)) AS 'high',
min{}(min(entries.price)) AS 'low'
TYPE "Bar5min"
FROM bitfinex
OVER TIME(5m)
WHERE symbol == 'BTCUSD'
AND notEmpty(entries)

[[SECTION:ALTERNATIVE_POLYMORPHIC_CONSTRUCTION]]
[[TAGS: RECORD TYPE WHEN POLYMORPHIC]]
Tip: A polymorphic dataset can also be produced with RECORD ... TYPE ... WHEN construction (mentioned as alternative in source text).

[[SECTION:FIXED_TYPE_DATASET]]
[[TAGS: FIXED_TYPE SINGLE_CLASS]]
If all UNION branches emit the same TYPE name, the result is a fixed-type dataset. Fields from all branches merge into one class; identical field names align into single columns when types match.

Example:
SELECT
trade.price AS "price",
trade.size AS "size"
TYPE "TradeAndBBO"
FROM kraken
ARRAY JOIN entries[THIS IS KrakenTradeEntry] AS trade
UNION
SELECT
bbo[side == ASK].price AS "offerPrice",
bbo[side == ASK].size AS "offerSize",
bbo[side == BID].price AS "bidPrice",
bbo[side == BID].size AS "bidSize"
TYPE "TradeAndBBO"
FROM kraken
ARRAY JOIN (entries AS array(L1entry))[THIS IS NOT NULL] AS bbo

[[SECTION:CASTING_TO_COMMON_TYPE]]
[[TAGS: CASTING COMMON_TYPE MERGE]]
You may UNION different original message types under a newly chosen common TYPE name to obtain a fixed-type dataset whose class schema is the union of all fields (existing descriptive text retained).

[[SECTION:STREAM_UNION]]
[[TAGS: STREAM_UNION MULTI_STREAM]]
Feature (available starting from QQL 5.6): UNION can apply directly to multiple streams so a single query subscribes to all of them.

Example:
with this.entries[this is L1Entry][0] as trade
select
trade.exchangeId as exhcnage,
max{}(trade.price) as high,
min{}(trade.price) as low,
first{}(trade.price) as open,
last{}(trade.price) as close
from (binance UNION kraken UNION bitfinex)
over time(5s)
where trade != null and symbol == 'BTC/USD'

[[SECTION:RESTRICTIONS]]
[[TAGS: RESTRICTIONS RULES]]
Restrictions (retained from source text):
* Message types (classes) with identical names across UNIONed streams must be binary identical (same number of fields, names, types, order).
* Union streams must be enclosed in brackets: from (stream1 UNION stream2).

[[SECTION:TIPS]]
[[TAGS: TIPS GUIDELINES]]
Tip: RECORD ... TYPE ... WHEN can also yield a polymorphic dataset.

[[SECTION:CAUTION]]
[[TAGS: CAUTION VERSION]]
Caution: Stream UNION feature availability starts from QQL 5.6.

[[SECTION:REFERENCE_END]]
[[TAGS: END UNION REFERENCE]]
End of UNION reference.
