---
title: CHAR / VARCHAR Data Types
tags: [ddl, char, varchar, string, text, encoding, alphanumeric, syntax, length, nullable, migration, best_practices, examples]
---

[[SECTION:CHAR\_TYPE\_OVERVIEW]]
[[TAGS: CHAR VARCHAR STRING OVERVIEW]]
CHAR represents a single Unicode character.
VARCHAR represents a variable length text string (empty string distinct from NULL).
Default encoding for VARCHAR is UTF8.

[[SECTION:CHAR\_TYPE\_DIFFERENCES]]
[[TAGS: CHAR VARCHAR DIFFERENCE]]
Use CHAR when:
1. Exactly one character (flag, grade, side).
   Use VARCHAR when:
1. Variable length text or code.
2. Potentially empty string (distinct from NULL meaning "unknown / missing").

[[SECTION:CHAR\_TYPE\_LIMITS]]
[[TAGS: VARCHAR LIMIT LENGTH MAX]]
VARCHAR max length: 64,534 characters (UTF8).
CHAR fixed size: 1 character.

[[SECTION:CHAR\_TYPE\_ENCODINGS]]
[[TAGS: VARCHAR ENCODING UTF8 ALPHANUMERIC]]
Encodings:
1. UTF8 (default) — full Unicode, omit in declaration.
2. ALPHANUMERIC(n) — length ≤ n; characters restricted to ASCII 0x20–0x5F (space, !"`#$%&'()\*+,-./:;<=>?@[\]^_\ , digits 0–9, A–Z). No lowercase letters.
3. ALPHANUMERIC (no length) = ALPHANUMERIC(10).

[[SECTION:CHAR\_TYPE\_ENCODING\_SELECTION]]
[[TAGS: VARCHAR ENCODING CHOICE]]
Choose ALPHANUMERIC(n) when:
1. Uppercase codes of predictable max length (currency, venue, status code).
2. Storage efficiency matters (~0.75 * n bytes).
   Keep UTF8 when:
1. Mixed case, lowercase, symbols outside allowed range.
2. Free text or international characters.

[[SECTION:CHAR\_TYPE\_SYNTAX]]
[[TAGS: CHAR VARCHAR SYNTAX DECLARATION]]
Patterns:
code CHAR
flag CHAR NOT NULL
description VARCHAR
currency VARCHAR ALPHANUMERIC(3) NOT NULL
shortCode VARCHAR ALPHANUMERIC(5)

[[SECTION:CHAR\_TYPE\_NULLABILITY]]
[[TAGS: CHAR VARCHAR NULLABILITY NOT\_NULL]]
Fields nullable unless suffixed with NOT NULL.
NOT NULL only if producer guarantees a value.
Empty string ('') is valid for VARCHAR and not the same as NULL.

[[SECTION:CHAR\_TYPE\_SEMANTICS]]
[[TAGS: CHAR VARCHAR SEMANTICS MEANING]]
NULL: value absent / unknown.
Empty string: deliberately present but empty.
CHAR: avoid overloading with multi-state codes (use ENUM if finite set > single char optionality).

[[SECTION:CHAR\_TYPE\_USAGE\_PATTERNS]]
[[TAGS: CHAR VARCHAR USE CASES]]
CHAR examples: side flag, grade, condition.
VARCHAR examples: instrumentId, venueCode, freeFormNote, formatHint.
ALPHANUMERIC(n): currency, MIC, market segment, product family code.

[[SECTION:CHAR\_TYPE\_PERFORMANCE]]
[[TAGS: VARCHAR PERFORMANCE STORAGE]]
1. ALPHANUMERIC(n) reduces storage + improves cache locality for dense code fields.
2. Avoid oversized generic VARCHAR for very short codes if ALPHANUMERIC fits.
3. Do not prematurely micro-optimize occasional free text fields.

[[SECTION:CHAR\_TYPE\_BEST\_PRACTICES]]
[[TAGS: CHAR VARCHAR BEST\_PRACTICES]]
1. Pick ALPHANUMERIC(n) only when all runtime values satisfy charset + length.
2. Keep n tightly bounded to real maximum.
3. Use COMMENT to clarify semantics if name ambiguous (e.g., refCode).
4. Prefer ENUM over VARCHAR for closed finite symbolic sets.
5. Distinguish NULL vs empty string in downstream logic.

[[SECTION:CHAR\_TYPE\_ANTI\_PATTERNS]]
[[TAGS: CHAR VARCHAR ANTI\_PATTERNS]]
Avoid:
1. ALPHANUMERIC(n) when lowercase or wider Unicode needed.
2. Inflated n (e.g., ALPHANUMERIC(32) for 3-char codes).
3. Using CHAR to store numeric digits sequence (use VARCHAR or ALPHANUMERIC(n)).
4. Treating empty string as missing (use NULL).
5. Converting stable enumerations into free-form VARCHAR.

[[SECTION:CHAR\_TYPE\_MIGRATION]]
[[TAGS: CHAR VARCHAR MIGRATION EVOLUTION]]
Changes:
1. Increasing ALPHANUMERIC length (n→m, m>n): backward compatible.
2. Decreasing length: may truncate → breaking.
3. Switching ALPHANUMERIC(n) → UTF8: safe (superset).
4. UTF8 → ALPHANUMERIC(n): only if all historical values comply.
5. VARCHAR → ENUM: requires staged migration (introduce ENUM, dual write, then deprecate).

[[SECTION:CHAR\_TYPE\_EXAMPLES\_DDL]]
[[TAGS: CHAR VARCHAR EXAMPLES DDL]]
CREATE DURABLE STREAM "codes" (
    CLASS "AlphaCodes" (
        currency VARCHAR NOT NULL ALPHANUMERIC(3),
        venue VARCHAR ALPHANUMERIC(4),
        segment VARCHAR ALPHANUMERIC(6),
        description VARCHAR
    );
    CLASS "FlagSamples" (
        side CHAR,
        quality CHAR NOT NULL,
        status VARCHAR ALPHANUMERIC(5)
    )
)

[[SECTION:CHAR\_TYPE\_EXAMPLES\_USAGE]]
[[TAGS: CHAR VARCHAR EXAMPLES USAGE]]
Example classification:
CLASS "InstrumentMeta" (
    baseCurrency VARCHAR NOT NULL ALPHANUMERIC(3),
    quoteCurrency VARCHAR NOT NULL ALPHANUMERIC(3),
    mic VARCHAR ALPHANUMERIC(4),
    condition CHAR,
    note VARCHAR
)

[[SECTION:CHAR\_TYPE\_EXAMPLES\_NOTES]]
[[TAGS: CHAR VARCHAR EXAMPLES NOTES]]
Interpretation cases:
- NULL mic → unknown trading venue.
- Empty note '' → intentionally empty annotation.
- condition CHAR = 'A' vs 'B' → consider ENUM if values proliferate.

[[SECTION:CHAR\_TYPE\_REFERENCE\_END]]
[[TAGS: CHAR VARCHAR END REFERENCE]]
End of CHAR / VARCHAR data type reference.
