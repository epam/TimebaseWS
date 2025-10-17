---
title: Stateless Functions
tags: [qql, functions, stateless, numeric, string, array, internal, max, min, abs, sqrt, log, exp, floor, ceil, length, uppercase, lowercase, reverse, indexof, substr, empty, notempty, size, mean, sum, enumerate, sort, any, all, streams, symbols, spaces, reference, examples]
---

[[SECTION:OVERVIEW]]
[[TAGS: OVERVIEW STATELESS PURE FUNCTIONS ANYWHERE]]
Stateless functions are pure (no internal running state) and may appear in any expression: projection list, WHERE, HAVING, GROUP BY (as argument), ARRAY JOIN expressions. They NEVER use {} (reserved for stateful). Arguments are evaluated left‑to‑right; null propagation follows implementation defaults (typically any null argument → null result, except predicates like any/all over arrays).

[[SECTION:NUMERIC_FUNCTIONS]]
[[TAGS: NUMERIC MATH FUNCTIONS]]
Numeric scalar functions (binary or unary):
- max(x, y) larger of two numbers
- min(x, y) smaller of two numbers
- abs(x) absolute value
- sqrt(x) square root
- log(x) natural logarithm
- exp(x) e^x
- floor(x) largest integral <= x
- ceil(x) smallest integral >= x
  Example:
  SELECT max(price, bidPrice - offerPrice) FROM quotes
  SELECT abs(price - 100) FROM quotes

[[SECTION:STRING_FUNCTIONS]]
[[TAGS: STRING VARCHAR TEXT FUNCTIONS]]
String (VARCHAR) functions:
- length(s) character length
- uppercase(s) to upper case
- lowercase(s) to lower case
- reverse(s) reverse character order
- indexof(haystack, needle) position (implementation: -1 if not found)
- substr(s, start, end) half‑open or inclusive end (engine defined) substring
  Examples:
  SELECT length(symbol) FROM securities
  SELECT uppercase(exchangeId) FROM refdata
  SELECT reverse(symbol) FROM securities
  SELECT substr(symbol, 0, 3) FROM securities

[[SECTION:ARRAY_FUNCTIONS]]
[[TAGS: ARRAY COLLECTION FUNCTIONS]]
Array utilities (arr generic; numeric arrays support aggregation):
- empty(arr) boolean true if size == 0
- notempty(arr) inverse of empty
- size(arr) element count
- max(arr), min(arr) extrema
- mean(arr) arithmetic mean
- sum(arr) sum
- enumerate(arr) returns index array [0..n-1]
- sort(arr) returns sorted copy
- indexof(arr, el) position of element (or -1)
- any(arrBool) true if any element true
- all(arrBool) true if all elements true
  Examples:
  SELECT size(entries.price) FROM bookStream
  SELECT max(entries.size) FROM bookStream
  SELECT any(entries.price > 200) FROM bookStream
  SELECT sort(entries.price) FROM bookStream

[[SECTION:INTERNAL_INTROSPECTION]]
[[TAGS: INTERNAL METADATA STREAMS SYMBOLS SPACES FUNCTIONS]]
Metadata / introspection functions:
- streams() array of stream descriptors (fields like key,...)
- symbols(streamKey) array of symbols in a stream
- spaces(streamKey) array of spaces (if partitioning concept present)
- stateless_functions() catalog of stateless functions + signatures
- stateful_functions() catalog of stateful functions
  Examples:
  SELECT s.key ARRAY JOIN streams() AS s
  SELECT sym ARRAY JOIN symbols('securities') AS sym
  SELECT f.id, f.arguments.name ARRAY JOIN stateless_functions() AS f

[[SECTION:COMBINING_FUNCTIONS]]
[[TAGS: COMPOSITION NESTING EXPRESSIONS]]
Stateless functions can nest freely:
SELECT sqrt(abs(price - 100)) FROM quotes
SELECT sum(sort(entries.price)) FROM bookStream
SELECT length(uppercase(symbol)) FROM securities

[[SECTION:USAGE_WITH_PREDICATES]]
[[TAGS: WHERE PREDICATES FILTER]]
Typical filtering:
SELECT * FROM quotes WHERE abs(offerPrice - bidPrice) > 0.5
SELECT symbol FROM securities WHERE length(symbol) == 3

[[SECTION:POLYMORPHIC_CONTEXT]]
[[TAGS: POLYMORPHIC FIELDS MISSING NULLS]]
In polymorphic streams missing fields yield null; passing null into numeric/stateless math usually returns null result:
SELECT max(price, bidPrice) FROM mixedStream
If one branch lacks bidPrice → result null for that message unless price chosen by logic (wrap with coalesce style function if available—do not invent if absent).

[[SECTION:PERFORMANCE_NOTES]]
[[TAGS: PERFORMANCE INLINE PURE]]
Stateless functions are:
- Pure (no side effects)
- Evaluated per message
- Cheap to inline; avoid redundant nested calls by factoring WITH (if supported) for readability (never needed for correctness)

[[SECTION:COMMON_MISTAKES]]
[[TAGS: ERRORS PITFALLS]]
1. Using {}: SELECT max{}(price) (wrong; remove {}).
2. Expecting running accumulation from sum(arr) (only sums the array elements of current message, not over time).
3. Calling reverse vs reversed (ensure correct function name; use reverse()).
4. Using indexof with reversed argument order (first is haystack).

[[SECTION:EXAMPLES_NUMERIC]]
[[TAGS: EXAMPLES NUMERIC]]
SELECT max(price, bidPrice) FROM quotes
SELECT floor(price) FROM quotes
SELECT ceil(price) FROM quotes
SELECT log(price) FROM quotes WHERE price > 0

[[SECTION:EXAMPLES_STRING]]
[[TAGS: EXAMPLES STRING]]
SELECT uppercase(symbol) FROM securities
SELECT substr(symbol, 0, 2) FROM securities
SELECT indexof(symbol, 'USD') FROM securities

[[SECTION:EXAMPLES_ARRAY]]
[[TAGS: EXAMPLES ARRAY]]
SELECT size(entries.price) FROM bookStream
SELECT max(entries.price) FROM bookStream
SELECT any(entries.size > 1000) FROM bookStream
SELECT sort(entries.price) FROM bookStream

[[SECTION:EXAMPLES_INTERNAL]]
[[TAGS: EXAMPLES INTERNAL INTROSPECTION]]
SELECT s.key ARRAY JOIN streams() AS s
SELECT f.id ARRAY JOIN stateless_functions() AS f
SELECT st.id ARRAY JOIN stateful_functions() AS st

[[SECTION:BEST_PRACTICES]]
[[TAGS: PRACTICES GUIDELINES]]
1. Keep stateless vs stateful distinction clear (no {} here).
2. Pre‑filter arrays to reduce size before expensive operations like sort.
3. Normalize text with lowercase/uppercase before comparison for consistency.
4. Use size(arr) instead of length(arr) for arrays (length is for strings).

[[SECTION:REFERENCE_END]]
[[TAGS: END STATELESS FUNCTIONS REFERENCE]]
End of stateless functions reference.
