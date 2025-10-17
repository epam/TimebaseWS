---
title: Integer Data Type
tags: [ddl, type, integer, syntax, example, encoding, int8, int16, int32, int64, puint30, puint61, signed, unsigned, interval, evolution, best_practices, anti_patterns]
---

[[SECTION:OVERVIEW]]
[[TAGS: INTEGER OVERVIEW 64BIT DEFAULT]]
INTEGER represents a signed 64‑bit numeric by default. You may constrain allowed domain with explicit min/max (if schema tools support constraints) and optionally choose a storage encoding for space efficiency.

[[SECTION:ENCODING_FAMILIES]]
[[TAGS: INTEGER ENCODING SIGNED UNSIGNED PACKED INTERVAL]]
Encodings:
1. SIGNED(n): Fixed‑width signed integral (8,16,32,48,64 bits). SIGNED(64) is default (omit to use).
2. UNSIGNED(30|61): Variable‑length packed positive integers (space shrinks for small values).
3. INTERVAL: Optimized for positive millisecond interval values (1..2^31).

[[SECTION:ENCODING_TABLE]]
[[TAGS: INTEGER ENCODING TABLE REFERENCE]]
Columns: Encoding | Size | Range (approx, do not exceed) | Notes
SIGNED(8)   | 1 byte    | -127 .. 127          | Small fixed signed.
SIGNED(16)  | 2 bytes   | -32,767 .. 32,767    | Medium fixed signed.
SIGNED(32)  | 4 bytes   | -2^31 .. 2^31-1      | Standard 32‑bit.
SIGNED(48)  | 6 bytes   | -2^47 .. 2^47-1      | Midpoint tradeoff.
SIGNED(64)  | 8 bytes   | -2^63 .. 2^63-1      | Default full range.
UNSIGNED(30)| 1..4 bytes| 0 .. 2^30-2          | Packed; smaller values compress.
UNSIGNED(61)| 1..8 bytes| 0 .. 2^61-2          | Wider packed positive.
INTERVAL    | 1..5 bytes| 1 .. 2^31            | Positive non‑zero ms intervals.

[[SECTION:PACKED_UNSIGNED]]
[[TAGS: INTEGER PACKED UNSIGNED VARIABLE_LENGTH]]
UNSIGNED(30|61) encodings use variable length: small magnitudes consume fewer bytes. Beneficial for counters, IDs, or sparse positive measurements skewed to low values.

[[SECTION:INTERVAL_ENCODING]]
[[TAGS: INTEGER INTERVAL TIME_MS]]
INTERVAL targets positive millisecond durations with compact variable storage. Do not use for arbitrary arithmetic outside timing semantics.

[[SECTION:DECLARATION_SYNTAX]]
[[TAGS: INTEGER DECLARATION SYNTAX FIELD]]
Pattern:
fieldName INTEGER [NOT NULL] [SIGNED(n) | UNSIGNED(n) | INTERVAL]
Omit encoding for default SIGNED(64).

[[SECTION:DOMAIN_CONSTRAINTS]]
[[TAGS: INTEGER CONSTRAINTS MIN MAX VALIDATION]]
If tooling / DDL extension supports min/max constraints you may attach them (not shown in basic examples) to signal validation and future optimization.

[[SECTION:SELECTION_GUIDELINES]]
[[TAGS: INTEGER ENCODING CHOICE GUIDELINES]]
1. Use default SIGNED(64) unless profile shows space pressure.
2. Choose SIGNED(32) only if upper/lower bounds proven safe.
3. Prefer UNSIGNED(30) / UNSIGNED(61) for non‑negative sparse values trending small.
4. Use INTERVAL strictly for positive millisecond durations.
5. Always use size specifier with SIGNED/UNSIGNED (e.g. SIGNED(32)).

[[SECTION:EVOLUTION]]
[[TAGS: INTEGER EVOLUTION COMPATIBILITY]]
Safer (compatible) changes:
- Widen fixed size (SIGNED(32) → SIGNED(64)).
- Switch to larger packed (UNSIGNED(30) → UNSIGNED(61)).
  Breaking / risky:
- Narrowing width (SIGNED(64) → SIGNED(32)).
- Changing signed ↔ unsigned when negatives exist.
  Migration pattern for narrowing: add new field, dual‑populate, validate, then deprecate old.

[[SECTION:BEST_PRACTICES]]
[[TAGS: INTEGER BEST_PRACTICES]]
1. Default to SIGNED(64) for simplicity; micro‑opt only after measurement.
2. Use UNSIGNED packed encodings for monotonically increasing non‑negative counters.
3. Keep monetary or precise fractional values in DECIMAL (not INTEGER scaled externally unless well‑documented).
4. Document rationale when choosing non‑default encoding for maintainability.
5. Avoid premature narrowing—future overflow costs outweigh minor space savings.

[[SECTION:ANTI_PATTERNS]]
[[TAGS: INTEGER ANTI_PATTERNS AVOID]]
Avoid:
1. Encoding monetary cents by implicit scaling without clear naming.
2. Using INTERVAL for generic counters (semantics mismatch).
3. Flipping signed/unsigned to repurpose existing field values.
4. Narrow fixed widths on live high‑growth counters.
5. Overusing packed unsigned where values cluster near max (removes benefit).
6. Using SIGNED without stating the size. (Must always be "SIGNED(n)")

[[SECTION:EXAMPLES_MIN]]
[[TAGS: INTEGER EXAMPLES BASIC]]
CLASS "SampleIntegers" (
    small INTEGER SIGNED(8),        -- nullable small
    seq INTEGER NOT NULL UNSIGNED(30),
    latencyMs INTEGER INTERVAL,
    amount INTEGER                  -- default SIGNED(64)
)

[[SECTION:EXTENDED_EXAMPLE]]
[[TAGS: INTEGER EXAMPLES EXTENDED ENCODINGS]]
CLASS "epam.rtc.timebase.samples.IntegerMessage" 'Sample Integer Message' (
    "int_c_8"  'Non-nullable INTEGER:INT8'  INTEGER NOT NULL SIGNED(8),
    "int_n_8"  'Nullable INTEGER:INT8'      INTEGER SIGNED(8),
    "int_c_16" 'Non-nullable INTEGER:INT16' INTEGER NOT NULL SIGNED(16),
    "int_n_16" 'Nullable INTEGER:INT16'     INTEGER SIGNED(16),
    "int_c_32" 'Non-nullable INTEGER:INT32' INTEGER NOT NULL SIGNED(32),
    "int_n_32" 'Nullable INTEGER:INT32'     INTEGER SIGNED(32),
    "int_c_64" 'Non-nullable INTEGER:INT64' INTEGER NOT NULL SIGNED(64),
    "int_n_64" 'Nullable INTEGER:INT64'     INTEGER SIGNED(64),
    "puint_c_30" 'Non-nullable INTEGER:PUINT30' INTEGER NOT NULL UNSIGNED(30),
    "puint_n_30" 'Nullable INTEGER:PUINT30'     INTEGER UNSIGNED(30),
    "puint_c_61" 'Non-nullable INTEGER:PUINT61' INTEGER NOT NULL UNSIGNED(61),
    "puint_n_61" 'Nullable INTEGER:PUINT61'     INTEGER UNSIGNED(61)
)

[[SECTION:REFERENCE_END]]
[[TAGS: INTEGER END REFERENCE]]
End of integer type reference.
