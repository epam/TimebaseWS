---
title: Keywords
tags: [qql, keywords, settings, with, type, field, this, case_insensitive, limit, offset, escaping, aliases, pagination, examples]
---

[[SECTION:OVERVIEW]]
[[TAGS: OVERVIEW PURPOSE KEYWORDS]]
This reference covers core QQL keywords for aliasing, result typing, field naming, message self‑reference, identifier case rules, string escaping, and basic output limiting (pagination style). Semantics are specific to QQL; do not assume external SQL behavior.

[[SECTION:WITH_KEYWORD]]
[[TAGS: WITH ALIAS TEMP EXPRESSIONS]]
WITH declares reusable aliases / variables / expressions evaluated before the main SELECT.
Declared names can be referenced later in the query.
Example:
WITH
entries AS array(deltix.timebase.api.messages.universal.L2EntryNew) AS 'l2',
max(l2[side == BID].price) AS 'maxBid',
min(l2[side == ASK].price) AS 'minAsk'
SELECT
max{}(maxBid) AS 'highBid',
min{}(minAsk) AS 'lowAsk'
FROM kraken
OVER time(1m)
WHERE packageType == PERIODICAL_SNAPSHOT AND symbol == 'BTCUSD'

[[SECTION:TYPE_KEYWORD]]
[[TAGS: TYPE RESULT_CLASS OUTPUT_MAPPING]]
TYPE sets the result message type name for the query output (mapping projection to a concrete class).
Example:
SELECT
bbo[side == ASK].price AS "offerPrice",
bbo[side == ASK].size AS "offerSize",
bbo[side == BID].price AS "bidPrice",
bbo[side == BID].size AS "bidSize"
TYPE "deltix.timebase.api.messages.BestBidOfferMessage"
FROM kraken
ARRAY JOIN (entries AS array(deltix.timebase.api.messages.universal.L1entry))[THIS IS NOT NULL] AS bbo

[[SECTION:FIELD_KEYWORD]]
[[TAGS: FIELD COLUMN_NAMING MULTI_MAPPING]]
FIELD assigns a column name inside a RECORD projection variant. Unlike simple aliases, multiple columns may reuse the same FIELD name in different RECORD clauses.
Example:
SELECT
RECORD entry.price FIELD 'price' TYPE t1 WHEN entry is L1Entry
RECORD entry.price FIELD 'price', entry.size FIELD 'size' TYPE t2 WHEN entry is L2EntryNew
FROM binance
array join entries AS entry
Note: FIELD naming differs from aliasing via AS (AS enforces uniqueness; FIELD may repeat across variant records).

[[SECTION:THIS_KEYWORD]]
[[TAGS: THIS SELF MESSAGE ACCESS]]
THIS references the entire current message object or its nested members.
Examples:
SELECT THIS FROM packages
SELECT THIS.entries FROM packages

[[SECTION:CASE_SENSITIVITY]]
[[TAGS: IDENTIFIERS CASE RULES QUOTING]]
Identifiers are case insensitive unless enclosed in double quotes.
test = Test = TEST
"test" != "Test" != "TEST"
Use double quotes when:
1. Special characters present.
2. Starts with a digit.
   Processor matches fields, classes, streams case‑insensitively when unquoted.

[[SECTION:ESCAPING]]
[[TAGS: STRINGS ESCAPING LITERALS]]
Supported backslash escapes: \', \", \\, \n, \r, \t, \b, \f
Example: value s4'2 written as 's4\'2'

[[SECTION:LIMIT_OFFSET]]
[[TAGS: LIMIT OFFSET PAGINATION WINDOWING]]
LIMIT restricts number of returned records.
OFFSET shifts the start position (server still scans preceding records).
Accepted forms:
1. LIMIT <limit>
2. LIMIT <limit> OFFSET <offset>
3. LIMIT <offset>, <limit>
   Examples:
   SELECT RUNNING entries, count{}() FROM kraken LIMIT 10 OFFSET 5
   SELECT RUNNING entries, count{}() FROM kraken LIMIT 10, 15
   Note: OFFSET still requires reading skipped rows internally.

[[SECTION:ALIASES_NOTES]]
[[TAGS: ALIASES NAMING AS FIELD DISTINCT]]
Differences:
- AS assigns a single alias (must be unique in projection scope).
- FIELD labels columns inside RECORD contexts; repetition allowed across alternative RECORD branches.
  Clarify intent when mixing both styles.

[[SECTION:EXAMPLES_MIN]]
[[TAGS: EXAMPLES QUICK]]
WITH + aggregation:
WITH a == max(price) SELECT a FROM md
Result typing:
SELECT bidPrice AS "bidPrice" TYPE "deltix.timebase.api.messages.BestBidOfferMessage" FROM quotes
Pagination pattern:
SELECT price FROM ticks LIMIT 100
THIS usage:
SELECT THIS FROM packages
Field naming in RECORD:
SELECT RECORD entry.price FIELD 'price' TYPE t WHEN entry is L1Entry FROM s ARRAY JOIN entries AS entry

[[SECTION:REFERENCE_END]]
[[TAGS: END KEYWORDS REFERENCE]]
End of keywords reference.
