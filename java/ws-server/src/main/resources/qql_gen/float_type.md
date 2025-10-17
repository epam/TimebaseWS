---
title: Float Data Type
tags: [ddl, data_types, float, numeric, approximate, binary, precision, encoding, casting, evolution, best_practices, anti_patterns, examples]
---

[[SECTION:OVERVIEW]]
[[TAGS: FLOAT OVERVIEW APPROXIMATE]]
FLOAT represents approximate binary floating‑point numbers (IEEE 754). Use for analytic, statistical, sensor, or transient metrics where small rounding error is acceptable. For exact monetary or contractual quantities prefer DECIMAL type (not FLOAT with a decimal encoding).

[[SECTION:ENCODINGS]]
[[TAGS: FLOAT ENCODING BINARY32 BINARY64 PRECISION RANGE]]
Supported encodings:
1. BINARY(32): 32‑bit single precision (~7 decimal digits, range ≈ ±3.4e38). Lower memory / bandwidth, higher rounding risk.
2. BINARY(64) (default): 64‑bit double precision (~15–16 decimal digits, range ≈ ±1.8e308). Preferred general choice.
   Selection guidelines:
- Use BINARY(32) only when profiling shows material space / throughput gains and precision loss is acceptable.
- Default to BINARY(64) if uncertain.

[[SECTION:WHY_NOT_DECIMAL_ENCODING_ON_FLOAT]]
[[TAGS: FLOAT DECIMAL SEPARATION MIGRATION]]
Older schemas may show FLOAT fields with DECIMAL or DECIMAL(n) encodings. Treat these as legacy:
- New designs: use DECIMAL type instead of FLOAT+DECIMAL.
- Migrating: introduce parallel DECIMAL field, populate both, then deprecate FLOAT.

[[SECTION:PRECISION_CHARACTERISTICS]]
[[TAGS: FLOAT PRECISION ROUNDING ERROR]]
Properties:
- Not closed under decimal fractions (e.g., 0.1 accumulates binary rounding error).
- Arithmetic associativity does not hold strictly (a + (b + c) may differ from (a + b) + c).
- Comparisons near thresholds require tolerance logic (difference < epsilon).

[[SECTION:WHEN_TO_USE_FLOAT]]
[[TAGS: FLOAT USE_CASES ANALYTICS SENSOR]]
Use FLOAT for:
- Derived analytic metrics (z‑scores, normalized values).
- High‑frequency sensor / telemetry where slight rounding is fine.
- Intermediate statistical aggregates (variance, correlation prototypes).
  Avoid for:
- Prices, notional amounts, balances (use DECIMAL).
- Keys / identifiers needing exact equality.

[[SECTION:DECLARATION_SYNTAX]]
[[TAGS: FLOAT SYNTAX DECLARATION]]
Pattern in CLASS:
fieldName FLOAT [NOT NULL] [BINARY(32|64)]
Default encoding omitted → BINARY(64).
Example:
CLASS "Metrics" (
    value FLOAT,                -- FLOAT BINARY(64)
    microValue FLOAT BINARY(32),
    variance FLOAT NOT NULL
)

[[SECTION:CASTING_RULES]]
[[TAGS: FLOAT CASTING INTEROP DECIMAL]]
Inline (expression) casting pattern:
expr AS TypeName
Guidelines:
- Before mixing with DECIMAL fields: cast explicitly (choose DECIMAL for monetary safety).
  (price AS DECIMAL) + adjustmentFactor  -- cast adjustmentFactor to DECIMAL upstream if FLOAT

[[SECTION:EXPRESSION_BEHAVIOR]]
[[TAGS: FLOAT EXPRESSIONS PROMOTION]]
Promotion:
- Mixed integer + FLOAT → FLOAT (binary).
- Mixing FLOAT (BINARY(32)) and FLOAT (BINARY(64)) → widen to BINARY(64).
  Stability tip:
- Keep both sides of subtraction similarly scaled to reduce catastrophic cancellation.

[[SECTION:EVOLUTION]]
[[TAGS: FLOAT EVOLUTION SCHEMA CHANGE]]
Common changes:
1. BINARY(32) → BINARY(64): widening; backward compatible (historical data still readable).
2. BINARY(64) → BINARY(32): narrowing; potential precision loss (breaking for consumers expecting prior precision).
3. FLOAT → DECIMAL: semantic precision shift; downstream arithmetic / casts must be reviewed.
4. Adding NOT NULL: only after validating no historical NULLs.
   Migration pattern (FLOAT to DECIMAL):
- Add new DECIMAL field (e.g., priceExact DECIMAL).
- Dual‑write.
- Update queries to use new field.
- Deprecate old FLOAT field later.

[[SECTION:PERFORMANCE_NOTES]]
[[TAGS: FLOAT PERFORMANCE MEMORY CPU]]
- BINARY(32) halves payload size vs BINARY(64) but may not yield proportional scan speedup (cache + vectorization dependent).
- DECIMAL operations can be slower than FLOAT; justify switch with precision requirement.
- Avoid unnecessary promotion chains (e.g., alternating DECIMAL ↔ FLOAT).

[[SECTION:RISK_MITIGATION]]
[[TAGS: FLOAT RISK ROUNDING GUARDRAILS]]
Strategies:
- For equality checks use tolerance: ABS(a - b) < 1e-9 AS BOOLEAN (illustrative).
- Accumulate large sums in BINARY(64) even if inputs BINARY(32).
- Avoid subtracting nearly equal large values (derive alternative formulation if possible).

[[SECTION:BEST_PRACTICES]]
[[TAGS: FLOAT BEST_PRACTICES GUIDELINES]]
1. Default to BINARY(64); downshift only with measured benefit.
2. Keep monetary / regulatory numbers in DECIMAL, not FLOAT.
3. Cast explicitly when mixing DECIMAL and FLOAT to document intent.
4. Use consistent precision across related fields (e.g., bidVol / askVol both BINARY(32)).
5. Document rationale when choosing BINARY(32) (future maintainers clarity).
6. Normalize intermediate integer math to DECIMAL if result feeds monetary output.

[[SECTION:ANTI_PATTERNS]]
[[TAGS: FLOAT ANTI_PATTERNS AVOID]]
Avoid:
1. FLOAT for currency or share quantities requiring cent precision.
2. Silent mixing of FLOAT and DECIMAL without explicit cast (ambiguity).
3. Excessive cascades of derived FLOAT fields magnifying rounding.
4. Unnecessary BINARY(32) usage for fields later aggregated into monetary DECIMAL outputs.
5. Using FLOAT tolerance comparisons directly in WHERE without bounding false positives.

[[SECTION:QUICK_SELECTION_MATRIX]]
[[TAGS: FLOAT DECISION MATRIX]]
Scenario → Recommendation:
- Monetary price / size → DECIMAL
- Scientific / analytic metric (standard deviation) → FLOAT BINARY(64)
- High‑volume approximate counter where overflow safe → INTEGER or promote to FLOAT only if division needed
- Space‑critical approximate telemetry (large arrays) → FLOAT BINARY(32)

[[SECTION:MIN_EXAMPLES]]
[[TAGS: FLOAT EXAMPLES QUICK]]
CLASS "SampleFloat" (
    fastMetric FLOAT BINARY(32),
    preciseMetric FLOAT,          -- defaults to BINARY(64)
    volEstimate FLOAT NOT NULL
)
Derived ratio:
(tradedVolume AS FLOAT) / (activeSeconds AS FLOAT) AS FLOAT
Tolerance filter:
ABS(spreadEstimate) < 0.0001

[[SECTION:EXTENDED_EXAMPLES]]
[[TAGS: FLOAT EXAMPLES EXTENDED]]
Schema fragment:
CLASS "Analytics" (
    mid FLOAT,
    logReturn FLOAT BINARY(32),
    volatility FLOAT NOT NULL,
    impliedVol FLOAT BINARY(32),
    drift FLOAT
)
Query casting with DECIMAL join logic:
SELECT
("mid" AS FLOAT),
(("mid" AS DECIMAL) - ("referenceMid" AS DECIMAL) AS DECIMAL),
volatility
FROM "analyticsStream"
WHERE ABS("drift") < 0.0005

[[SECTION:MIGRATION_SNIPPET]]
[[TAGS: FLOAT MIGRATION DECIMAL TRANSITION]]
Legacy field mid FLOAT DECIMAL(n) → migrate:
1. Add: midExact DECIMAL NOT NULL
2. Populate both midExact and mid
3. Update queries to use midExact
4. Deprecate mid (retain until consumers updated)

[[SECTION:REFERENCE_END]]
[[TAGS: FLOAT END REFERENCE]]
End of float type reference.
