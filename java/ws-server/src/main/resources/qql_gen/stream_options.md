---
title: Stream Options
tags: [qql, ddl, stream_options, options, fixedtype, polymorphic, lossless, lossy, highavailability, periodicity, df, initsize, maxsize, maxtime, unique, storageversion, configuration, metadata, syntax, examples, best_practices]
---

[[SECTION:OVERVIEW]]
[[TAGS: OVERVIEW PURPOSE OPTIONS STREAM]]
Stream OPTIONS define storage, distribution, reliability and structural characteristics applied at creation time (or alteration if supported). Durable streams may omit most options (defaults apply) unless specific behavior is required.

[[SECTION:USAGE_SYNTAX]]
[[TAGS: SYNTAX CREATE STREAM OPTIONS]]
Pattern (OPTIONS clause after class / enum block):
CREATE DURABLE STREAM "name" (
    CLASS "Message" ("price" FLOAT)
)
OPTIONS (FIXEDTYPE = TRUE; DF = 2; HIGHAVAILABILITY = FALSE)
COMMENT 'Example stream with options'
Rules:
- Key = Value pairs separated by semicolons.
- Booleans: TRUE / FALSE (case as accepted).
- Omit OPTIONS entirely when no overrides needed.

[[SECTION:OPTION_SUMMARY]]
[[TAGS: SUMMARY LIST OPTIONS]]
Supported keys:
- FIXEDTYPE (boolean)
- POLYMORPHIC (boolean)
- LOSSLESS (boolean)
- LOSSY (boolean)
- HIGHAVAILABILITY (boolean)
- PERIODICITY (varchar)
- DF (numeric)
- INITSIZE (numeric bytes)
- MAXSIZE (numeric bytes)
- MAXTIME (numeric time delta)
- UNIQUE (boolean)
- STORAGEVERSION (varchar: '5.0' or '4.3')

[[SECTION:FIXEDTYPE]]
[[TAGS: FIXEDTYPE SINGLE_CLASS OPTION]]
FIXEDTYPE: Stream constrained to a single concrete message class.
Notes:
- Mutually exclusive conceptually with POLYMORPHIC.
- Enables minor internal optimizations (indexing / layout) in some engines.

[[SECTION:POLYMORPHIC]]
[[TAGS: POLYMORPHIC MULTI_CLASS OPTION]]
POLYMORPHIC: Stream holds multiple declared classes.
Notes:
- Default behavior if multiple CLASS blocks present.
- Do not set FIXEDTYPE simultaneously.

[[SECTION:LOSSLESS]]
[[TAGS: LOSSLESS DURABLE RELIABILITY OPTION]]
LOSSLESS: Guarantees no intentional data drop.
Notes:
- DURABLE streams are inherently lossless; explicit flag often redundant.

[[SECTION:LOSSY]]
[[TAGS: LOSSY TRADEOFF OPTION]]
LOSSY: Allows configured dropping (e.g., buffer constraints) to preserve throughput.
Notes:
- Do not combine with LOSSLESS.
- Typically avoided for financial correctness unless explicitly requested.

[[SECTION:HIGHAVAILABILITY]]
[[TAGS: HIGHAVAILABILITY STARTUP CACHE OPTION]]
HIGHAVAILABILITY: Marks stream for proactive caching / replication at startup.
Tradeoff: Higher resource consumption vs reduced access latency.

[[SECTION:PERIODICITY]]
[[TAGS: PERIODICITY HINT OPTION]]
PERIODICITY: Descriptive schedule hint (e.g., 'DAILY', '1S', 'IRREGULAR') aiding optimization or monitoring. Purely advisory unless implementation leverages it.

[[SECTION:DF]]
[[TAGS: DF DISTRIBUTION FACTOR OPTION]]
DF (Distribution Factor): Numeric sharding / partition guidance.
Use only when deployment architecture documents its effect; otherwise omit.

[[SECTION:INITSIZE]]
[[TAGS: INITSIZE BUFFER MEMORY OPTION]]
INITSIZE: Initial write buffer size in bytes.
Set higher for sustained high‑throughput ingestion to reduce early reallocations.

[[SECTION:MAXSIZE]]
[[TAGS: MAXSIZE BUFFER LIMIT OPTION]]
MAXSIZE: Upper limit for buffer growth (bytes). Default often 64K.
Lowering can reduce memory footprint but may raise flush frequency.

[[SECTION:MAXTIME]]
[[TAGS: MAXTIME TEMPORAL BUFFER OPTION]]
MAXTIME: Temporal span (first→last message) allowed inside buffer before forced flush (milliseconds or engine’s numeric time unit). Default Long.MAX_VALUE (effectively unbounded).

[[SECTION:UNIQUE]]
[[TAGS: UNIQUE CONSTRAINT OPTION]]
UNIQUE: Enforces uniqueness semantics (context engine‑defined: often symbol/timestamp or composite).
Only enable if deduplication logic is required.

[[SECTION:STORAGEVERSION]]
[[TAGS: STORAGEVERSION FORMAT COMPATIBILITY OPTION]]
STORAGEVERSION: Physical format version: '5.0' (modern TS file) or '4.3' (legacy).
Prefer default (latest) unless backward compatibility mandated.

[[SECTION:MUTUAL_EXCLUSIVITY]]
[[TAGS: RULES CONSTRAINTS EXCLUSIVITY]]
Do not pair:
- FIXEDTYPE with POLYMORPHIC
- LOSSLESS with LOSSY
  Redundant / conflicting entries should be removed to avoid ambiguity.

[[SECTION:OMISSION_RULE]]
[[TAGS: MINIMALISM OMIT OPTIONS DEFAULTS]]
Omit OPTIONS clause entirely when using defaults (best practice for clarity & portability).

[[SECTION:EXAMPLES_MINIMAL]]
[[TAGS: EXAMPLES MINIMAL DEFAULT]]
Minimal durable polymorphic stream (no OPTIONS):
CREATE DURABLE STREAM "quotes" (
    CLASS "BestBidOfferMessage" ("bidPrice" FLOAT, "offerPrice" FLOAT);
    CLASS "TradeMessage" ("price" FLOAT, "size" FLOAT)
)

[[SECTION:EXAMPLES_FIXEDTYPE]]
[[TAGS: EXAMPLES FIXEDTYPE SINGLE_CLASS]]
Single class with performance hint:
CREATE DURABLE STREAM "trades_single" (
    CLASS "TradeMessage" ("price" FLOAT, "size" FLOAT)
)
OPTIONS (FIXEDTYPE = TRUE)

[[SECTION:EXAMPLES_TUNED_BUFFER]]
[[TAGS: EXAMPLES BUFFER SIZING INITSIZE MAXSIZE]]
Custom buffer sizing:
CREATE DURABLE STREAM "depth_events" (
    CLASS "DepthUpdate" ("levels" ARRAY(FLOAT))
)
OPTIONS (POLYMORPHIC = TRUE; INITSIZE = 65536; MAXSIZE = 262144)

[[SECTION:EXAMPLES_HA]]
[[TAGS: EXAMPLES HIGHAVAILABILITY OPTION]]
High availability + periodicity hint:
CREATE DURABLE STREAM "bars_1s" (
    CLASS "Bar1s" ("open" FLOAT, "high" FLOAT, "low" FLOAT, "close" FLOAT, "volume" FLOAT)
)
OPTIONS (HIGHAVAILABILITY = TRUE; PERIODICITY = '1S')

[[SECTION:BEST_PRACTICES]]
[[TAGS: PRACTICES GUIDELINES OPTIONS]]
1. Start without OPTIONS; add only proven necessary keys.
2. Prefer FIXEDTYPE only when schema is guaranteed single class long‑term.
3. Avoid LOSSY unless data fidelity explicitly non‑critical.
4. Tune INITSIZE / MAXSIZE only after profiling.
5. Specify STORAGEVERSION only for backward compatibility mandates.
6. Keep OPTION list concise and stable; frequent toggling can complicate ops.

[[SECTION:ERROR_PATTERNS]]
[[TAGS: ERRORS MISCONFIGURATION]]
Common misconfigurations:
- Both FIXEDTYPE and POLYMORPHIC present → remove one.
- LOSSLESS and LOSSY together → invalid; pick one (usually omit both for default lossless durable).
- Misspelled key (e.g., DISTRIBUTIONFACTOR instead of DF).
- Setting UNIQUE without clarifying engine’s uniqueness basis (may cause unexpected rejects).

[[SECTION:REFERENCE_END]]
[[TAGS: END STREAM OPTIONS REFERENCE]]
End of stream options reference.
