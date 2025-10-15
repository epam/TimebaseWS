---
title: Select Queries
tags: [qql, select, queries, syntax, projection, wildcard, objects, fields, nested, enums, aliases, distinct, ambiguity, reverse, first_last, record, polymorphic]
---

[[SECTION:OVERVIEW]]
[[TAGS: OVERVIEW PURPOSE SELECT]]
Select queries extract full messages or specific fields, apply predicates, handle polymorphic classes, enums, aliases, distinct values, ordering variants (reverse, first, last), and nested object paths.

[[SECTION:SYNTAX_SKELETON]]
[[TAGS: SYNTAX SKELETON CLAUSES GRAMMAR]]
Canonical form:
[WITH expr_list]
SELECT [DISTINCT|RUNNING]
simple_expr_list|record_expr_list
[FROM stream_name|REVERSE(stream_name)|LIVE(stream_name)]
[[LEFT] ARRAY JOIN expr_list]
[[TRIGGER|RESET] OVER [EVERY] [count_expr|time_expr]]
[WHERE expr]
[GROUP BY expr_list]
[HAVING expr]
[LIMIT limit [OFFSET offset]]|[LIMIT offset, limit]
[UNION ...]
simple_expr_list:
expr_list [TYPE type_name]
record_expr_list:
RECORD expr_list TYPE type_name WHEN expr, ...

[[SECTION:SIMPLE_EXPRESSIONS]]
[[TAGS: SIMPLE CONSTANT EXPRESSIONS]]
Constant / pure expressions without stream source:
SELECT 42
SELECT 1 == 1
SELECT 2 + 2
SELECT 2 + 2, 1 == 1, 42

[[SECTION:WILDCARD_OBJECT_SELECTION]]
[[TAGS: WILDCARD OBJECT FULL SELECT STAR]]
Selecting entire stream messages (polymorphic preserved):
SELECT * FROM tickquerydemo
Reverse order:
SELECT * FROM REVERSE(tickquerydemo)
First message:
SELECT first(*) FROM tickquerydemo
Last message:
SELECT last(*) FROM tickquerydemo

[[SECTION:FIELD_PROJECTION]]
[[TAGS: FIELDS PROJECTION MULTI_COLUMN]]
Project specific fields (missing field per class yields null/blank in output):
SELECT price, bidPrice, offerPrice FROM tickquerydemo

[[SECTION:OBJECT_FIELD_EXPANSION]]
[[TAGS: OBJECT EXPANSION STAR QUALIFIED]]
Expand all fields of an object variable:
SELECT entry.* FROM binance
SELECT order.* FROM orders

[[SECTION:AMBIGUOUS_FIELDS]]
[[TAGS: AMBIGUITY DISAMBIGUATION TYPE QUALIFICATION]]
If multiple classes define same field name (e.g., algoId) unqualified usage is ambiguous:
-- Ambiguous (error if multiple classes share algoId)
SELECT algoId FROM stream_name
Filter also ambiguous:
SELECT * FROM stream_name WHERE algoId == 14
Disambiguate with class qualifier:
SELECT * FROM stream_name WHERE "AlgoInstrumentConfig":algoId == 14
Or cast THIS to specific class:
SELECT * FROM stream_name WHERE (THIS AS "AlgoInstrumentConfig").algoId == 14

[[SECTION:NESTED_FIELDS]]
[[TAGS: NESTED PATH ACCESS]]
Access nested object paths via dot notation:
SELECT order.info.size FROM orders
Path order.info.size traverses order -> info -> size.

[[SECTION:ENUM_FILTERING]]
[[TAGS: ENUM FILTER VALUES QUALIFIED]]
Filter by enum constant:
SELECT order FROM orders WHERE order.info.side == BUY
Filter array / collection parent on enum:
SELECT entries FROM packages WHERE packageType == VENDOR_SNAPSHOT
Disambiguate duplicate enum value with qualified enum:
SELECT entries FROM packages WHERE packageType == "deltix.timebase.api.messages.universal.PackageType":VENDOR_SNAPSHOT
Specify enum origin explicitly:
SELECT * FROM "securities" WHERE type == "deltix.timebase.api.messages.InstrumentType":FX

[[SECTION:ALIASES]]
[[TAGS: ALIASES COLUMN NAMING REFERENCE AS]]
Assign alias to expression or field:
SELECT symbol AS 'sym' FROM securities
Alias reuse in WHERE:
SELECT order.info.size AS 'size' FROM orders WHERE size > 1000
Rules:
1. AS acts as alias when new identifier names a projection column.
2. AS acts as cast when identifier matches existing object/class.
   Use quoted string after AS to force alias interpretation.

[[SECTION:DISTINCT_SELECTION]]
[[TAGS: DISTINCT DEDUP FIELD_VALUES]]
Distinct field values:
SELECT DISTINCT symbol FROM securities
Returned synthetic class includes $SYMBOL field; timestamp null; symbol empty; unnamed type marker.

[[SECTION:RECORD_POLYMORPHIC_NOTE]]
[[TAGS: RECORD POLYMORPHIC SHAPING]]
record_expr_list form enables conditional polymorphic projections:
RECORD expr_list TYPE type_name WHEN condition, ...
(See polymorphic data + RECORD reference for detailed usage.)

[[SECTION:BEST_PRACTICES]]
[[TAGS: PRACTICES GUIDELINES]]
1. Qualify ambiguous field names with class or cast.
2. Use object.* expansion carefully—omit when only few fields needed.
3. Prefer string literal aliases (AS 'name') to avoid cast ambiguity.
4. Qualify enum when identical constant appears in multiple enums.

[[SECTION:EXAMPLES_MIN]]
[[TAGS: EXAMPLES QUICK]]
Full objects:
SELECT * FROM tickquerydemo
Specific fields:
SELECT price, bidPrice FROM tickquerydemo
Nested:
SELECT order.info.size FROM orders
Enum filter:
SELECT order FROM orders WHERE order.info.side == BUY
Alias reuse:
SELECT order.info.size AS 's' FROM orders WHERE s > 1000
Distinct:
SELECT DISTINCT symbol FROM securities
Disambiguated field:
SELECT * FROM stream_name WHERE "AlgoInstrumentConfig":algoId == 14

[[SECTION:REFERENCE_END]]
[[TAGS: END SELECT QUERIES REFERENCE]]
End of select queries reference.
