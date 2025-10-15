---
title: Boolean Data Type
tags: [ddl, boolean, type, syntax, nullable, logical, predicates, filtering, best_practices, examples]
---

[[SECTION:BOOLEAN\_TYPE\_OVERVIEW]]
[[TAGS: BOOLEAN TYPE OVERVIEW LOGICAL]]
BOOLEAN stores a logical value: true or false. Null allowed unless constrained with NOT NULL.

[[SECTION:BOOLEAN\_TYPE\_STORAGE]]
[[TAGS: BOOLEAN STORAGE SIZE ENCODING]]
Compact internal representation (single byte or bit-packed internally; implementation detail). No user encoding parameters.

[[SECTION:BOOLEAN\_TYPE\_SYNTAX\_DDL]]
[[TAGS: BOOLEAN SYNTAX DDL FIELD]]
Field declaration pattern:
fieldName BOOLEAN
Non nullable:
fieldName BOOLEAN NOT NULL
Inside class:
CLASS "Flags" ( isActive BOOLEAN NOT NULL, isDeleted BOOLEAN )

[[SECTION:BOOLEAN\_TYPE\_NULLABILITY]]
[[TAGS: BOOLEAN NULLABILITY NOT\_NULL]]
Default nullable. Use NOT NULL only if producer always emits a value. Avoid speculative NOT NULL to prevent future incompatibilities.

[[SECTION:BOOLEAN\_TYPE\_SEMANTICS]]
[[TAGS: BOOLEAN SEMANTICS MEANING]]
Reserve BOOLEAN for binary logical state, not tri-state domain categories (use ENUM for multi-value). Null can mean unknown / not supplied.

[[SECTION:BOOLEAN\_TYPE\_USAGE\_PATTERNS]]
[[TAGS: BOOLEAN USAGE PATTERNS]]
Typical roles:
1. Feature / toggle flags.
2. Status indicators (e.g., isClosed).
3. Compression / encoding hints paired with payload fields.
4. Optional qualifiers (e.g., isIndicative vs firm prices).

[[SECTION:BOOLEAN\_TYPE\_FILTERING]]
[[TAGS: BOOLEAN FILTERING WHERE PREDICATES]]
Example predicates:
SELECT isActive FROM "flagsStream" WHERE isActive == true
Negation:
SELECT * FROM "flagsStream" WHERE NOT isActive
Check null explicitly if grammar supports:
SELECT * FROM "flagsStream" WHERE isActive IS NULL

[[SECTION:BOOLEAN\_TYPE\_BEST\_PRACTICES]]
[[TAGS: BOOLEAN BEST\_PRACTICES GUIDELINES]]
1. Prefer positive naming (isActive) over negated (notInactive).
2. Use NOT NULL only when truly invariant.
3. Document semantics via COMMENT if ambiguous (e.g., isSynthetic).
4. Avoid encoding multi-state meaning into combinations of multiple booleans (use ENUM).

[[SECTION:BOOLEAN\_TYPE\_ANTI\_PATTERNS]]
[[TAGS: BOOLEAN ANTI\_PATTERNS BAD\_PRACTICES]]
Avoid:
1. Overlapping flags that can contradict (isEnabled + isDisabled).
2. Using BOOLEAN for lifecycle phases with >2 states.
3. Adding redundant inverse fields (isActive + isInactive).
4. Marking NOT NULL when upstream occasionally omits value.

[[SECTION:BOOLEAN\_TYPE\_EXAMPLES\_DDL]]
[[TAGS: BOOLEAN EXAMPLES DDL]]
CREATE DURABLE STREAM "featureFlags" (
    CLASS "FlagState" (
        featureCode VARCHAR NOT NULL,
        isEnabled BOOLEAN NOT NULL,
        isDeprecated BOOLEAN,
        isExperimental BOOLEAN,
        notes VARCHAR
    )
)

[[SECTION:BOOLEAN\_TYPE\_EXAMPLES\_QUERY]]
[[TAGS: BOOLEAN EXAMPLES QUERY FILTER]]
Select enabled features:
SELECT featureCode FROM "featureFlags" WHERE isEnabled == true
Filter deprecated but still enabled:
SELECT featureCode FROM "featureFlags" WHERE isEnabled == true AND isDeprecated == true
Find unspecified deprecation state (if null checks supported):
SELECT featureCode FROM "featureFlags" WHERE isDeprecated IS NULL

[[SECTION:BOOLEAN\_TYPE\_MIGRATION]]
[[TAGS: BOOLEAN MIGRATION EVOLUTION]]
Changes:
1. Adding nullable BOOLEAN field → backward compatible.
2. Tightening to NOT NULL → requires guarantee; may break consumers.
3. Replacing pair of booleans with ENUM → plan deprecation period (keep old fields until clients migrate).

[[SECTION:BOOLEAN\_TYPE\_REFERENCE\_END]]
[[TAGS: BOOLEAN END REFERENCE]]
End of boolean data type reference.
