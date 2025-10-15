---
title: QQL Operators
tags: [qql, operators, arithmetic, comparison, in, like, logical, dot_question, arrays, filtering, polymorphism, examples]
---

[[SECTION:OVERVIEW]]
[[TAGS: OPERATORS OVERVIEW CATEGORIES]]
Covers core operator groups in QQL:
- Safe polymorphic array field access (.?)
- Arithmetic
- Comparison (== != === !== > < >= <=)
- Membership / pattern (IN, LIKE)
- Logical (and, or, not)
  Array contexts apply element‑wise when arrays appear in expressions.

[[SECTION:DOT_QUESTION_OPERATOR]]
[[TAGS: DOT_QUESTION SAFE_ACCESS POLYMORPHIC ARRAYS FILTERING]]
Operator: .?
Purpose: Safe per‑element field extraction in polymorphic object arrays where some elements lack the field.
Behavior: Produces NULL for elements without the referenced field enabling correct boolean mask alignment for subsequent indexed selection.
Example polymorphic array:
entries: [
Limit{price:10, size:1},
Market{size:2},
Limit{price:20, size:3}
]
Goal: Select only objects with price > 15 (Limit{price:20, size:3}).
Correct simple filter:
SELECT entries[price > 15]
Incorrect (misaligned boolean mask):
SELECT entries[entries.price > 15]
Reason: entries.price → [10, 20]; entries.price > 15 → [false, true]; mask of length 2 indexes original array producing Market{size:2}.
Safe access sequence:
SELECT entries.?price            -- yields [10, null, 20]
SELECT entries.?price > 15       -- yields [false, false, true]
Final correct selection:
SELECT entries[entries.?price > 15]
Mask alignment preserved because NULL was emitted for Market element.

[[SECTION:ARITHMETIC]]
[[TAGS: ARITHMETIC NUMERIC OPERATORS]]
Supported (element‑wise for arrays):
- x + y (addition)
- x - y (subtraction)
- -x (negation)
- x * y (multiplication)
- x / y (division)
- x % y (modulus; integer types only)
  Integer ÷ integer uses integer division. If any operand is float/decimal → regular division.
  Example:
  SELECT (entries.price * entries.size) AS Mult FROM packages

[[SECTION:COMPARISON]]
[[TAGS: COMPARISON EQUALITY ORDERING ARRAYS]]
Operators (element‑wise for arrays unless strict form):
- x == y (value equality; arrays → boolean array)
- x != y
- x === y (strict equality; arrays → single boolean)
- x !== y
- x > y
- x < y
- x >= y
- x <= y
  Examples:
  list1:[1,2,3] === list2[1,2,3] -> true
  list1:[1,2,3] == list2:[1,2,3] -> [true, true, true]
  list1:[1,2,3] === int1:3 -> false
  list1:[1,2,3] == int1:3 -> [false, false, true]
  Array comparison producing boolean array:
  SELECT entries.price > 2000 FROM packages

[[SECTION:IN_LIKE]]
[[TAGS: IN LIKE MEMBERSHIP PATTERN MATCHING]]
IN tests membership in explicit value list.
LIKE tests string against pattern:
- % matches any sequence
- _ matches single character
  Examples:
  SELECT * FROM binance
  WHERE symbol IN ('LTCUSD', 'BTCUSD')
  SELECT * FROM binance
  ARRAY JOIN entries AS entry
  WHERE entry.exchangeId IN ('KRAKEN', 'GDAX')
  SELECT * FROM binance
  WHERE symbol LIKE 'BTC%'
  SELECT * FROM binance
  WHERE symbol LIKE 'BTC___'    -- does not match BTCUSDT

[[SECTION:LOGICAL]]
[[TAGS: LOGICAL BOOLEAN ARRAYS]]
Logical operators (element‑wise for boolean arrays):
- x and y
- x or y
- not x
  Outputs boolean or boolean array depending on inputs.

[[SECTION:REFERENCE_END]]
[[TAGS: OPERATORS END REFERENCE]]
End of operators reference.
