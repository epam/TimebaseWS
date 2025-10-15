---
title: Conditional Expressions
tags: [qql, expressions, conditional, if_else, case, searched_case, simple_case, polymorphic, array, with, best_practices, anti_patterns, examples]
---

[[SECTION:CONDITIONAL_EXPR_OVERVIEW]]
[[TAGS: CONDITIONAL OVERVIEW IF ELSE CASE]]
Conditional expressions choose a value based on boolean tests.
Forms:
1. Inline IF ... ELSE (ternary style).
2. CASE value WHEN ... THEN ... [ELSE ...] END (simple case).
3. CASE WHEN condition THEN ... [WHEN ...] [ELSE ...] END (searched case).
   Available since QQL 5.6.

[[SECTION:IF_ELSE_INLINE_SYNTAX]]
[[TAGS: IF ELSE INLINE SYNTAX]]
Inline pattern:
<true_expr> IF <boolean_condition> ELSE <false_expr>
Example:
SELECT 'few' IF n < 3 ELSE 'many', n
ARRAY JOIN [0,1,2,3,4] AS n

[[SECTION:IF_ELSE_NUMERIC_EXAMPLE]]
[[TAGS: IF ELSE NUMERIC EXAMPLE]]
Label numbers as even/odd:
SELECT 'even' IF (n % 2) == 0 ELSE 'odd', n
ARRAY JOIN [0,1,2,3,4,5] AS n

[[SECTION:CASE_SIMPLE_SYNTAX]]
[[TAGS: CASE SIMPLE VALUE WHEN THEN]]
Simple CASE (value compared to constants):
CASE <expr>
WHEN <value1> THEN <result1>
[WHEN <value2> THEN <result2> ...]
[ELSE <default>]
END
Example:
SELECT
CASE n
WHEN 0 THEN 'zero'
WHEN 1 THEN 'one'
WHEN 2 THEN 'two'
ELSE 'many'
END,
n
ARRAY JOIN [0,1,2,3,4] AS n

[[SECTION:CASE_SEARCHED_SYNTAX]]
[[TAGS: CASE SEARCHED CONDITIONS WHEN THEN]]
Searched CASE (WHEN clauses contain boolean expressions):
CASE
WHEN <cond1> THEN <result1>
[WHEN <cond2> THEN <result2> ...]
[ELSE <default>]
END
Example:
SELECT
CASE
WHEN n == 0 THEN 'zero'
WHEN n == 1 THEN 'one'
WHEN n == 2 THEN 'two'
ELSE 'many'
END,
n
ARRAY JOIN [0,1,2,3,4] AS n

[[SECTION:CASE_INLINE_SINGLE]]
[[TAGS: CASE INLINE SINGLE LINE]]
Compact searched CASE:
SELECT CASE WHEN n < 3 THEN 'few' ELSE 'many' END, n
ARRAY JOIN [0,1,2,3,4] AS n

[[SECTION:WITH_CASE_DERIVED]]
[[TAGS: WITH CASE DERIVED GROUP]]
Derived classification used in aggregation:
WITH levelClass ==
(CASE
WHEN price < 10 THEN 'low'
WHEN price < 100 THEN 'mid'
ELSE 'high'
END)
SELECT levelClass, COUNT{}()
FROM "ticks"
GROUP BY levelClass

[[SECTION:POLYMORPHIC_CASE_EXAMPLE]]
[[TAGS: POLYMORPHIC CASE ENTRIES ARRAY]]
Polymorphic array introspection (package style stream):
SELECT
CASE
WHEN SIZE(entries[THIS IS L1Entry]) > 0 THEN 'L1'
WHEN SIZE(entries[THIS IS L2EntryNew OR THIS IS L2EntryUpdate]) > 0 THEN 'L2'
WHEN SIZE(entries[THIS IS TradeEntry]) > 0 THEN 'Trade'
ELSE 'Other'
END AS category,
entries
FROM "coinbase"

[[SECTION:NESTED_CONDITIONAL_COMPOSITION]]
[[TAGS: CONDITIONAL NESTED COMPOSITION]]
Nested combination (prefer CASE for readability):
SELECT
CASE
WHEN n < 0 THEN 'neg'
WHEN n == 0 THEN 'zero'
ELSE
('small' IF n < 10 ELSE 'big')
END,
n
ARRAY JOIN [-1,0,1,5,11] AS n

[[SECTION:TYPE_RULES]]
[[TAGS: CONDITIONAL TYPES COMPATIBILITY]]
Rules:
1. All result branches (THEN / ELSE or IF / ELSE) must share the same resulting type.
2. NULL branches allowed if overall type resolves (other branches define type).
3. Prefer explicit ELSE; omitted ELSE may yield NULL when no WHEN matches.
4. Mixing scalar and array types in branches not allowed.

[[SECTION:BEST_PRACTICES]]
[[TAGS: CONDITIONAL BEST_PRACTICES]]
1. Use searched CASE for multi-condition clarity instead of deeply nested IF.
2. Order WHEN clauses from most specific to most general; first match wins.
3. Always include ELSE for forward compatibility (captures unexpected values).
4. Keep expressions in branches side-effect free and lightweight.
5. Factor repeated sub-expressions into WITH to avoid duplication.

[[SECTION:ANTI_PATTERNS]]
[[TAGS: CONDITIONAL ANTI_PATTERNS AVOID]]
Avoid:
1. Large cascades of IF ... ELSE chaining where CASE is clearer.
2. Overlapping WHEN conditions (later ones unreachable).
3. Divergent return types across branches (causes type resolution errors).
4. Using conditional solely to map static constants (prefer ENUM or lookup).
5. Deeply nested CASE structures hiding simple threshold logic.

[[SECTION:EXAMPLES_MIN]]
[[TAGS: CONDITIONAL EXAMPLES QUICK]]
Few vs many:
SELECT 'few' IF countVal < 3 ELSE 'many' FROM "metrics"
Threshold label:
SELECT CASE WHEN latencyMs > 500 THEN 'slow' ELSE 'ok' END FROM "perf"
Polymorphic category:
SELECT CASE WHEN THIS IS "TradeEntry" THEN 'trade' ELSE 'other' END FROM "coinbase"

[[SECTION:CONDITIONAL_REFERENCE_END]]
[[TAGS: CONDITIONAL END REFERENCE]]
End of conditional expressions reference.
