---
title: Stream Drop
tags: [ddl, drop, stream, remove, delete, lifecycle, safety, if_exists, syntax, examples, best_practices, anti_patterns]
---

[[SECTION:STREAM_DROP_OVERVIEW]]
[[TAGS: DROP STREAM DDL OVERVIEW PURPOSE]]
DROP removes a stream definition and its stored data (irreversible). Use cautiously in production.

[[SECTION:STREAM_DROP_SYNTAX]]
[[TAGS: DROP STREAM SYNTAX GRAMMAR IF_EXISTS CASE_INSENSITIVE]]
Syntax:
DROP STREAM "name"
DROP STREAM IF EXISTS "name"
Notes:
1. IF EXISTS prevents an error if the stream does not exist.
2. Identifier matching is case‑insensitive (ambiguous names still resolved by engine rules).
3. Quoting the stream name is recommended for consistency.

[[SECTION:STREAM_DROP_BEHAVIOR]]
[[TAGS: DROP STREAM EFFECT DATA LOSS IRREVERSIBLE METADATA]]
Behavior:
1. Deletes stream metadata and associated data.
2. Dependent ingestion or query jobs fail after drop.
3. Cannot be undone—recreation yields an empty stream with a new logical lifecycle.

[[SECTION:STREAM_DROP_EXAMPLES]]
[[TAGS: DROP STREAM EXAMPLES BASIC IF_EXISTS]]
Basic:
DROP STREAM "test_stream"
With safety:
DROP STREAM IF EXISTS "test_stream"
Pattern in maintenance script (idempotent):
DROP STREAM IF EXISTS "staging_quotes"

[[SECTION:STREAM_DROP_BEST_PRACTICES]]
[[TAGS: DROP STREAM BEST_PRACTICES SAFETY CHECKLIST]]
1. Prefer IF EXISTS in automation.
2. Snapshot / export critical data before destructive operations.
3. Use explicit quoted names to avoid accidental matches.
4. Stage destructive changes (dry‑run list streams → confirm → drop).
5. Log the initiating user / ticket id for audit trail.

[[SECTION:STREAM_DROP_ANTI_PATTERNS]]
[[TAGS: DROP STREAM ANTI_PATTERNS AVOID]]
Avoid:
1. Unquoted names in mixed‑case environments.
2. Blind DROP in migration scripts without IF EXISTS.
3. Dropping active ingestion targets (causes silent data loss upstream).
4. Using DROP instead of schema evolution when history must persist.

[[SECTION:STREAM_DROP_REFERENCE_END]]
[[TAGS: DROP STREAM END REFERENCE]]
End of drop stream reference.
