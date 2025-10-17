---
title: Overview
tags: [qql, ddl, overview, streams, create, durable, transient, syntax, options, comment, timestamp, symbol, type, example]
---

[[SECTION:CORE]]
[[TAGS: CORE OVERVIEW INTRO SYNTAX]]
QuantQuery Language (QQL) targets polymorphic time‑series streams in TimeBase.
Focus: querying heterogeneous message classes with temporal + incremental semantics.
Result set = ordered messages; each message implicitly has `timestamp`, `symbol`, `type`.
Example:
SELECT price, bidPrice FROM "quotes"

[[SECTION:DIFFERENCES_SQL]]
[[TAGS: DIFFERENCES SQL CONTRAST OVERVIEW]]
Key contrasts vs SQL:

1. Polymorphic stream messages (multiple classes) not uniform rows.
2. Stateful vs stateless functions (stateful require RUNNING + {}).
3. Explicit OVER TIME clause for bounded windows (not implicit GROUP BY windows).
4. DDL creates streams (not tables) with CLASS / ENUM blocks.
5. Built‑in identity fields not user‑declared in DDL.
   Example:
   SELECT AVG{}("price") FROM "ticks" OVER TIME (1h)

[[SECTION:MESSAGE_IDENTITY]]
[[TAGS: IDENTITY TIMESTAMP SYMBOL TYPE METADATA]]
Message identity trio: timestamp + symbol + type(class).
These fields auto‑exist; never redefine in DDL.
Example:
SELECT "timestamp", "symbol", price FROM "ticks"

[[SECTION:HEADER_OUTPUT_FORMAT]]
[[TAGS: OUTPUT FORMAT DISPLAY HEADER]]
Output shows header lines when class changes:
>ClassName,TIMESTAMP,SYMBOL,TYPE,<fields...>
Then numbered data rows.
Example (header pattern):
>BestBidOfferMessage,TIMESTAMP,SYMBOL,TYPE,offerPrice,bidPrice

[[SECTION:CLAUSE_ORDER]]
[[TAGS: CLAUSE_ORDER SYNTAX ORDER]]
Canonical order (omit unused):
[WITH expr_list]
SELECT [DISTINCT|RUNNING]
simple_expr_list|record_expr_list
[FROM stream_name|REVERSE(stream_name)|LIVE(stream_name)]
[[LEFT] ARRAY JOIN expr_list]
[[TRIGGER|RESET] OVER [EVERY] [count_expr|time_expr]]
[WHERE expr]
[GROUP BY expr_list]
[LIMIT limit [OFFSET offset]]|[LIMIT offset, limit]
[UNION ...]Example:
SELECT RUNNING AVG{}("bidPrice") FROM "quotes" OVER TIME (1h) WHERE bidPrice > 0

[[SECTION:IDENTIFIERS_LITERALS]]
[[TAGS: IDENTIFIERS LITERALS TOKENS]]
Identifiers always double quoted: "fieldName".
String: 'text'
Intervals: 5s 2m 3h 7d (unquoted).
Boolean: true false
Example:
SELECT 'X' FROM "s"

[[SECTION:POLYMORPHISM]]
[[TAGS: POLYMORPHISM CLASSES TYPE DISCRIMINATOR]]
Streams contain multiple CLASS types.
Type discriminator usable in filters if supported: THIS IS "ClassName".
Example:
SELECT price FROM "ticks" WHERE THIS IS "BestBidOfferMessage"

[[SECTION:SELECT_PROJECTIONS]]
[[TAGS: SELECT PROJECTION FIELDS EXPRESSIONS]]
Projection list may include raw fields, derived expressions, stateless calls, stateful (only with RUNNING).
Example:
SELECT bidPrice, offerPrice - bidPrice FROM "quotes"

[[SECTION:STATEFUL_FUNCTIONS]]
[[TAGS: STATEFUL FUNCTIONS RUNNING AGG]]
Rules:

1. Only valid inside SELECT RUNNING.
2. Syntax: NAME{}(arg[, ...]) — {} may hold meta‑params (empty if none).
3. Maintain cumulative state (or grouped state if GROUP BY).
   Example:
   SELECT RUNNING AVG{}("price") FROM "ticks"

[[SECTION:STATELESS_FUNCTIONS]]
[[TAGS: STATELESS FUNCTIONS EXPRESSIONS]]
Pure deterministic or simple calculations; never use {}.
Example:
SELECT ABS("price") FROM "ticks"

[[SECTION:OVER_TIME]]
[[TAGS: OVER_TIME WINDOW]]
Adds bounded temporal window.
Must appear before WHERE.
Example:
SELECT price FROM "ticks" OVER TIME (1h)

[[SECTION:WINDOWING]]
[[TAGS: WINDOWING STEP TEMPORAL]]
Example:
SELECT AVG{}("price") FROM "ticks" OVER TIME (30m)

[[SECTION:FILTERING]]
[[TAGS: WHERE FILTERING]]
WHERE filters row/message results after projection expression evaluation.
Example:
SELECT price FROM "ticks" WHERE price > 100

[[SECTION:PREDICATES]]
[[TAGS: PREDICATES OPERATORS LOGIC]]
Operators: == != > >= < <=
Logical: AND OR NOT
Membership: field IN ('A','B')
Null checks (if grammar supports): field IS NULL / IS NOT NULL
Example:
SELECT bidPrice FROM "quotes" WHERE bidPrice > 0 AND offerPrice > bidPrice

[[SECTION:GROUP_BY_HAVING]]
[[TAGS: GROUP_BY HAVING AGG]]
GROUP BY defines aggregation partitions.
Types supported by GROUP BY: BOOLEAN, CHAR, DATETIME, TIMEOFDAY, INTEGER, VARCHAR, and ENUM.
HAVING filters aggregated groups.
Referenced non‑aggregated projections must appear in GROUP BY.
Example:
SELECT RUNNING AVG{}("price") FROM "ticks" GROUP BY symbol HAVING AVG{}("price") > 10

[[SECTION:AGGREGATIONS]]
[[TAGS: AGG AGGREGATIONS STATEFUL]]
Stateful functions under RUNNING + optional GROUP BY.
OVER TIME can bound evaluation; RUNNING stays cumulative unless bounded by explicit window semantics.
Example:
SELECT RUNNING MAX{}("price") FROM "ticks" OVER TIME (1d)

[[SECTION:ARRAY_OPS]]
[[TAGS: ARRAY COLLECTION FUNCTIONS]]
Array handling through dedicated functions (e.g., ARRAY_LENGTH()).
Example:
SELECT size("depthLevels") FROM "orderBook"

[[SECTION:TEMP_WITH]]
[[TAGS: WITH TEMP DERIVED]]
WITH defines temp computed expressions (language support dependent).
Avoid placing stateful {} in WITH.
Example:
WITH spread == offerPrice - bidPrice SELECT spread FROM "quotes"

[[SECTION:TYPE_SYSTEM]]
[[TAGS: TYPES PRIMITIVES SCHEMA]]
Common scalar types: INTEGER, FLOAT, DECIMAL, VARCHAR, BOOLEAN, TIMESTAMP, ENUM, ARRAY(type).
Example:
SELECT price AS FLOAT FROM "ticks"

[[SECTION:CASTS_CONVERSIONS]]
[[TAGS: CAST CONVERSION TYPES]]
Use CAST(expr AS TYPE) or provided conversion functions.
Example:
SELECT CAST(price AS DECIMAL) FROM "ticks"

[[SECTION:DDL_OVERVIEW]]
[[TAGS: DDL OVERVIEW STREAMS INTRO]]
DDL manages stream schemas: create, modify, drop.
Core object: STREAM with CLASS and ENUM definitions bundled.
Example:
CREATE DURABLE STREAM "s" (CLASS "T" (price FLOAT64))

[[SECTION:DDL_CREATE_STREAM]]
[[TAGS: DDL CREATE STREAM SYNTAX]]
Pattern:
CREATE DURABLE|TRANSIENT STREAM "name"
(class_or_enum_decl[; ...])
[OPTIONS (...)]
[COMMENT 'text']
Do not declare implicit identity fields.
Example:
CREATE DURABLE STREAM "prices" (CLASS "Quote" (bidPrice FLOAT, offerPrice FLOAT))

[[SECTION:DDL_CLASS_ENUM]]
[[TAGS: DDL CLASS ENUM INHERITANCE]]
CLASS "Name" (fieldDecl[; ...])
ENUM "Name" (A, B, C)
Inheritance via UNDER baseClass (if supported).
Example:
CLASS "BestBidOfferMessage" (bidPrice FLOAT, offerPrice FLOAT)

[[SECTION:DDL_FIELD_RULES]]
[[TAGS: DDL FIELDS NOT_NULL CONSTRAINTS]]
Field syntax: fieldName TYPE [NOT NULL] [encoding...]
Arrays: fieldName ARRAY(FLOAT)
No duplicate field names across hierarchy.
Example:
CLASS "Trade" (price FLOAT NOT NULL, size INTEGER)

[[SECTION:DDL_DROP_STREAM]]
[[TAGS: DDL DROP STREAM REMOVE DELETE LIFECYCLE]]
DROP STREAM "name" (or DROP STREAM IF EXISTS "name") permanently removes the stream and its data.
Use IF EXISTS for idempotent maintenance scripts. Destructive and irreversible—export data first if retention is required.

[[SECTION:DDL_MODIFY_STREAM]]
[[TAGS: DDL MODIFY STREAM SCHEMA EVOLUTION REPLACE]]
MODIFY STREAM performs a full schema replacement:

1. You must restate every CLASS / ENUM and option (even unchanged).
2. Omitted types/fields are treated as removed (subject to confirm flags).
3. Suitable for large, coordinated refactors (introducing inheritance, bulk field reordering).
Pattern (abridged):
   MODIFY STREAM "name" (
       CLASS "A" (...);
       CLASS "B" UNDER "A" (...)
   )
   [OPTIONS (...)]
   [COMMENT 'text']
   [CONFIRM CONVERT_DATA|DROP_ATTRIBUTES|DROP_TYPES|NO_CONVERSION|DROP_DATA]
Validation checklist additions:

- All retained types re-declared identically unless intentionally evolved.
- Confirm mode matches risky operations (drops, incompatible conversions).
- Still never add "timestamp" / "symbol" / "type" explicitly.

[[SECTION:DDL_ALTER_STREAM]]
[[TAGS: DDL ALTER STREAM SCHEMA EVOLUTION INCREMENTAL]]
ALTER STREAM applies targeted incremental changes (add / remove / modify specific elements)
without restating the entire schema:
Typical operations:

- ADD CLASS / ENUM
- ADD FIELD to CLASS
- DROP FIELD / CLASS (often needs confirm flag)
- ALTER FIELD type/nullability (may require conversion)
Use ALTER when change scope is small; prefer MODIFY for holistic restructuring to keep history auditable.
General guidance:

1. Minimize ALTER batches (group logically related tweaks).
2. Avoid frequent flip-flopping of nullability (stability aids consumers).
3. Validate downstream tooling compatibility before removing types.

[[SECTION:OPTIONS_COMMENTS]]
[[TAGS: DDL OPTIONS COMMENT METADATA]]
OPTIONS sets low‑level attributes; omit unless user asks.
COMMENT adds description.
Example:
CREATE DURABLE STREAM "s" (CLASS "M" (v FLOAT)) COMMENT 'metrics stream'

[[SECTION:ERROR_PATTERNS]]
[[TAGS: ERRORS DIAGNOSTICS REPAIR]]
Patterns:

1. Stateful func without RUNNING → add RUNNING.
2. OVER TIME after WHERE → reorder.
3. Clause order mismatch → enforce canonical sequence.
4. Unknown function → verify category (stateful vs stateless).
5. Added identity fields in DDL → remove.
   Example (bad):
   SELECT AVG{}("p") FROM "s"
   Fix:
   SELECT RUNNING AVG{}("p") FROM "s"

[[SECTION:COMMON_MISTAKES]]
[[TAGS: MISTAKES PITFALLS SYNTAX]]
Frequent issues:

1. Missing quotes: SELECT price FROM quotes  (wrong)
2. Using AS inside RECORD instead of FIELD.
3. Inventing fields absent in schema.
4. Mixing stateful {} in WITH.
5. Misplacing OVER TIME.

[[SECTION:EXAMPLES_SIMPLE]]
[[TAGS: EXAMPLES BASIC]]
Field projection:
SELECT price FROM "ticks"
Filtered:
SELECT price FROM "ticks" WHERE price > 10
Rolling window:
SELECT price FROM "ticks" OVER TIME (15m)

[[SECTION:EXAMPLES_AGG]]
[[TAGS: EXAMPLES AGG WINDOW STATEFUL]]
Running average:
SELECT RUNNING AVG{}("price") FROM "ticks"
Running avg last hour:
SELECT RUNNING AVG{}("price") FROM "ticks" OVER TIME (1h)
Grouped running max:
SELECT RUNNING MAX{}("price") FROM "ticks" GROUP BY symbol
Grouped bounded:
SELECT RUNNING AVG{}("price") FROM "ticks" OVER TIME (30m) GROUP BY symbol

[[SECTION:EXAMPLES_DDL]]
[[TAGS: EXAMPLES DDL CREATE]]
Simple stream:
CREATE DURABLE STREAM "quotes" (CLASS "Quote" (bidPrice FLOAT, offerPrice FLOAT))
With inheritance (if supported):
CREATE DURABLE STREAM "md" (
    CLASS "Base" (instrument VARCHAR);
    CLASS "Quote" UNDER "Base" (bidPrice FLOAT, offerPrice FLOAT)
)

[[SECTION:PLANNING_GUIDE]]
[[TAGS: PLANNING PLAN EXTRACTION]]
Plan extraction fields:
intent, streams, needed_clauses, stateful_functions, stateless_functions,
time_windows, derived_fields, docs_needed_tags, ambiguities.
Tag rules:

- Always include CLAUSE_ORDER SYNTAX.
- If stateful needed → add STATEFUL_FUNCTIONS (+ OVER_TIME if windowed).
- If numeric comparisons → add PREDICATES FILTERING.
- If grouping → add GROUP_BY HAVING AGG.
  Example intent: "running average last hour per symbol":
  Tags → [CLAUSE_ORDER, STATEFUL_FUNCTIONS, OVER_TIME, GROUP_BY, AGG]

[[SECTION:REFERENCE_END]]
[[TAGS: END INDEX]]
End of structured overview for retrieval.
