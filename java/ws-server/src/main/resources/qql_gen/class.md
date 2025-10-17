---
title: Class Definition
tags: [ddl, class, syntax, inheritance, auxiliary, instantiable, abstract, static, field_order, attributes, comment, migration, best_practices, anti_patterns, examples]
---

[[SECTION:CLASS_DEFINITION_OVERVIEW]]
[[TAGS: CLASS OVERVIEW PURPOSE]]
CLASS defines a message (record) schema used within a stream. Multiple CLASS blocks inside a CREATE STREAM enable polymorphic message sets.

[[SECTION:CLASS_SYNTAX]]
[[TAGS: CLASS SYNTAX GRAMMAR]]
Pattern (conceptual):
CLASS "Name" [UNDER "BaseName"] ( fieldDecl[, ...] )
Optional modifiers after closing ) (if supported):
AUXILIARY | NOT AUXILIARY
INSTANTIABLE | NOT INSTANTIABLE
COMMENT 'text'
Multiple CLASS / ENUM blocks inside one stream: terminate each non‑final CLASS/ENUM with a semicolon after ).

[[SECTION:CLASS_COMPONENTS]]
[[TAGS: CLASS COMPONENTS PARTS]]
Elements:
1. Identifier: quoted class name.
2. Optional UNDER: single parent for inheritance.
3. Field list: zero or more attributes.
4. Modifiers: AUXILIARY, INSTANTIABLE (or their negations), COMMENT.

[[SECTION:CLASS_INHERITANCE]]
[[TAGS: CLASS INHERITANCE UNDER BASE]]
UNDER establishes a parent class:
- Inherited fields appear in derived class instances.
- No redefinition of inherited field names.
- Use inheritance when multiple classes share ≥2 fields with identical semantics and types.

[[SECTION:CLASS_AUXILIARY_INSTANTIABLE]]
[[TAGS: CLASS AUXILIARY INSTANTIABLE ABSTRACT]]
AUXILIARY: class not directly emitted as top-level stream message (only nested/embedded if language supports).
NOT AUXILIARY: class may appear as emitted message.
NOT INSTANTIABLE: abstract (cannot occur as concrete runtime type).
INSTANTIABLE: concrete; default when unspecified.

[[SECTION:CLASS_ATTRIBUTES]]
[[TAGS: CLASS FIELDS ATTRIBUTES DECLARATION ORDER]]
Field declaration order (rule):
fieldName TYPE [NOT NULL] [encoding...]
Rules:
1. Use NOT NULL only if producer guarantees every instance carries a value.
2. Encoding / constraints follow NOT NULL.
3. Arrays: fieldName ARRAY(TYPE).
4. Do not declare built-in identity fields (timestamp, symbol, type).

[[SECTION:CLASS_STATIC_ATTRIBUTES]]
[[TAGS: CLASS STATIC ATTRIBUTES CONSTANTS]]
Static attributes (if supported) define constants bound to the class (e.g., staticField = 'X'). Use sparingly to avoid hardcoding values that may later vary.

[[SECTION:CLASS_NULLABILITY_FIELDS]]
[[TAGS: CLASS NULLABILITY NOT_NULL OPTIONAL]]
NULL indicates unknown / absent.
For numeric metrics required operationally → mark NOT NULL.
Avoid speculative NOT NULL (future missing data causes evolution friction).

[[SECTION:CLASS_COMMENTS_METADATA]]
[[TAGS: CLASS COMMENT METADATA DOCUMENTATION]]
COMMENT clarifies semantics where naming is ambiguous (e.g., COMMENT 'L2 incremental quote update'). Prefer concise, domain-focused descriptions.

[[SECTION:CLASS_USAGE_PATTERNS]]
[[TAGS: CLASS USAGE PATTERNS POLYMORPHISM]]
Typical patterns:
1. Base + specialized derived classes (e.g., BaseEvent UNDER which TradeEvent, QuoteEvent).
2. Leaf-only instantiation: declare NOT INSTANTIABLE base + concrete children.
3. Shared common identifiers or correlation fields centralized in base.
4. Auxiliary holder for nested structured components (if supported).

[[SECTION:CLASS_BEST_PRACTICES]]
[[TAGS: CLASS BEST_PRACTICES GUIDELINES]]
1. Introduce inheritance only with meaningful shared field clusters (≥2).
2. Keep class names stable; prefer adding new derived types over redefining existing.
3. Group related fields logically (identifiers, prices, sizes, metadata).
4. Use COMMENT on non-obvious domain abbreviations.
5. Ensure field order consistency across related classes for readability.
6. Validate NOT NULL against historical data before tightening.
7. Separate durable schema concerns from transient calculation outputs (avoid mixing ephemeral computation fields in core classes).

[[SECTION:CLASS_ANTI_PATTERNS]]
[[TAGS: CLASS ANTI_PATTERNS AVOID]]
Avoid:
1. Single shared field forcing inheritance (overkill).
2. Duplicating identical fields across many classes instead of factoring a base.
3. Marking numerous fields NOT NULL to "enforce discipline" without data guarantees.
4. Using inheritance for unrelated semantic categories.
5. Redefining inherited field types or meanings.
6. Adding identity fields explicitly (they are implicit).

[[SECTION:CLASS_EXAMPLES_DDL]]
[[TAGS: CLASS EXAMPLES DDL]]
Single class stream:
CREATE DURABLE STREAM "quotes" (
    CLASS "Quote" (
        bidPrice DOUBLE,
        offerPrice DOUBLE,
        instrument VARCHAR NOT NULL
    )
)

Inheritance with multiple classes:
CREATE DURABLE STREAM "market" (
    CLASS "BaseEvent" (
        instrument VARCHAR NOT NULL,
        exchange VARCHAR
    );
    CLASS "Trade" UNDER "BaseEvent" (
        price DOUBLE NOT NULL,
        size INTEGER NOT NULL
    );
    CLASS "Quote" UNDER "BaseEvent" (
        bidPrice DOUBLE,
        offerPrice DOUBLE
    )
)

Abstract (NOT INSTANTIABLE) base:
CREATE DURABLE STREAM "md" (
    CLASS "BookBase" (
        instrument VARCHAR NOT NULL
    ) NOT INSTANTIABLE;
    CLASS "L2Update" UNDER "BookBase" (
        level INTEGER NOT NULL,
        bidPrice DOUBLE,
        askPrice DOUBLE
    );
    CLASS "Snapshot" UNDER "BookBase" (
        depth INTEGER NOT NULL
    )
)

[[SECTION:CLASS_MIGRATION_EVOLUTION]]
[[TAGS: CLASS MIGRATION EVOLUTION CHANGES]]
Common changes:
1. Add nullable field → backward compatible.
2. Add NOT NULL field → incompatible unless supplied for all historical + future data.
3. Widen numeric type (INT32→INT64) → generally safe if consumers adjust.
4. Narrow type or tighten nullability → breaking.
5. Introduce new derived class under existing base → additive (ensure consumers handle new TYPE).
6. Split monolithic class into base + derived set → requires staged client update.

[[SECTION:CLASS_REFERENCE_END]]
[[TAGS: CLASS END REFERENCE]]
End of class definition reference.
