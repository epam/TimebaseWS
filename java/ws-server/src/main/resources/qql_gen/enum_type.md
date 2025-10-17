---
title: Enumeration Definition
tags: [ddl, enum, data_types, flags, syntax, naming, value_assignment, usage, evolution, best_practices, anti_patterns, examples]
---

[[SECTION:ENUM_OVERVIEW]]
[[TAGS: ENUM OVERVIEW PURPOSE SYMBOLIC DOMAIN]]
ENUM defines a fixed symbolic domain (stable set of labeled values) referenced by fields for compact storage and semantic clarity.

[[SECTION:SYNTAX]]
[[TAGS: ENUM SYNTAX DECLARATION]]
Pattern:
ENUM "QualifiedEnumName" 'Optional Title' (
    "IDENT_A" [= number],
    "IDENT_B",
    "IDENT_C" [= number]
)
Rules:
1. Quoted fully qualified name recommended to avoid collisions.
2. Optional human title (single quoted) may follow name.
3. Each identifier optionally assigns an explicit integer index.
4. Trailing commas avoided.
5. Order of appearance sets default logical ordering (independent of numeric codes).

[[SECTION:FLAGS_ENUM]]
[[TAGS: ENUM FLAGS BITMASK]]
Use FLAGS (if supported) to declare bitmask semantics:
ENUM FLAGS "QualifiedFlagsEnum" (
    "FLAG_A" = 1,
    "FLAG_B" = 2,
    "FLAG_C" = 4
)
Guidelines:
- Assign power-of-two values (1,2,4,8,...) for independent combination.
- Only use FLAGS when true bitwise combination semantics required; otherwise plain ENUM.

[[SECTION:VALUE_ASSIGNMENT]]
[[TAGS: ENUM VALUES INDEX ASSIGNMENT NUMERIC]]
Value indices:
1. Explicit indices permit sparse or backward-compatible insertion.
2. Omitted index → auto-assigned next available integer greater than any prior explicit/implicit value.
3. Indices must be unique; keep them stable (changing an existing index is breaking).
4. Non-contiguous indices allowed (e.g. 1,3,4).

[[SECTION:NAMING_CONVENTIONS]]
[[TAGS: ENUM NAMING STYLE FQN]]
Recommendations:
1. Use PascalCase for enum type name; UPPER_SNAKE for members.
2. Prefix package path (e.g. com.company.md.SideEnum) in multi-project environments.
3. Avoid generic names like Status or Type without context.

[[SECTION:USAGE_IN_CLASSES]]
[[TAGS: ENUM FIELD USAGE CLASS REFERENCE]]
Reference an ENUM in CLASS fields by its qualified name:
ENUM "Side" (BUY, SELL, UNKNOWN);
CLASS "Trade" (
    side "Side" NOT NULL,
    price DECIMAL
)
Query filtering example:
SELECT price FROM "trades" WHERE side == 'BUY'

[[SECTION:EVOLUTION]]
[[TAGS: ENUM EVOLUTION COMPATIBILITY]]
Compatible changes:
1. Append new value with a new unique index (or auto-assigned) at end.
2. Add UNKNOWN / OTHER sentinel early to future-proof filters.
   Potentially breaking:
1. Removing or renaming an existing value.
2. Reassigning a numeric index to a different label.
3. Reordering if downstream relies on ordinal position.
   Mitigation:
- Deprecate in docs; keep legacy values for backward compatibility.

[[SECTION:BEST_PRACTICES]]
[[TAGS: ENUM BEST_PRACTICES GUIDELINES]]
1. Add UNKNOWN (index 0 or first) for forward compatibility.
2. Use explicit indices when external systems persist numeric codes.
3. Reserve numeric gaps for foreseeable future additions in tightly versioned domains.
4. Prefer ENUM over short VARCHAR codes for stable, small domains (compression + validation).
5. Use FLAGS only when combining multiple simultaneous states.

[[SECTION:ANTI_PATTERNS]]
[[TAGS: ENUM ANTI_PATTERNS AVOID]]
Avoid:
1. Constantly adding transient values (use VARCHAR if churn high).
2. Overloading a single ENUM with unrelated conceptual groups.
3. Reusing same numeric index for a different semantic after deprecation.
4. Encoding dynamic data (user-entered free text) as ENUM.
5. Using FLAGS enumeration where mutual exclusivity applies (use plain ENUM).

[[SECTION:SIZE_LIMITS]]
[[TAGS: ENUM SIZE LIMITS STORAGE]]
ENUM storage uses compact integer indexes.
Typical limit: up to 264 distinct values (confirm engine build if extending).
FLAGS count effectively limited by chosen bit-width (practically ≤ 64 distinct flags).

[[SECTION:EXAMPLES_EXTENDED]]
[[TAGS: ENUM EXAMPLES EXTENDED]]
Sparse explicit indices:
ENUM "OrderStatus" (
    "NEW" = 1,
    "PARTIALLY_FILLED" = 5,
    "FILLED" = 8,
    "CANCELLED" = 13,
    "REJECTED" = 21
)
Flags example:
ENUM FLAGS "VenueFeatures" (
    "DARK_POOL" = 1,
    "ODD_LOT" = 2,
    "AUCTION" = 4,
    "BLOCK" = 8
)

[[SECTION:EXAMPLES_MIN]]
[[TAGS: ENUM EXAMPLES QUICK]]
Basic:
ENUM "Side" (BUY, SELL, UNKNOWN)
Class usage:
CLASS "Exec" ( side "Side" NOT NULL, qty INTEGER, price DECIMAL )
Query:
SELECT price FROM "execStream" WHERE side == 'SELL'

[[SECTION:REFERENCE_END]]
[[TAGS: ENUM END REFERENCE]]
End of enum reference.
