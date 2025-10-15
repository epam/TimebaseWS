---
title: Array Data Type
tags: [ddl, array, type, syntax, nullable, enum, object, polymorphic, nested, querying, size, best practices, examples]
---

[[SECTION:ARRAY_TYPE_OVERVIEW]]
[[TAGS: ARRAY TYPE OVERVIEW INTRO]]
Array type: `ARRAY(<elementType>)`. Stores ordered, indexable sequences. Element type may be any supported scalar, ENUM, OBJECT (single or polymorphic), another ARRAY (nesting), except `CHAR`.

[[SECTION:ARRAY_TYPE_LIMITS]]
[[TAGS: ARRAY LIMIT SIZE BYTES]]
Size limit: up to 4,194,304 bytes per array field (aggregate storage of elements + overhead).

[[SECTION:ARRAY_TYPE_SYNTAX_DDL]]
[[TAGS: ARRAY DDL SYNTAX TYPE_DEFINITION]]
DDL pattern:
fieldName ARRAY(ElementType)
For non‑nullable element values: ARRAY(ElementType NOT NULL)
For non‑nullable array container itself: append NOT NULL after closing parenthesis.

[[SECTION:ARRAY_TYPE_NULLABILITY]]
[[TAGS: ARRAY NULL NULLABLE NOT_NULL]]
Two layers:
1. Container nullability (array field may be NULL) → default nullable unless followed by NOT NULL.
2. Element nullability (each element may be NULL) → add NOT NULL inside ARRAY(...).
   Example difference:
   values ARRAY(FLOAT)             -- container nullable, elements nullable
   values ARRAY(FLOAT NOT NULL)    -- container nullable, elements never NULL
   values ARRAY(FLOAT NOT NULL) NOT NULL  -- neither container nor elements nullable

[[SECTION:ARRAY_TYPE_ENUM]]
[[TAGS: ARRAY ENUM DDL]]
ENUM arrays use the ENUM name:
statusCodes ARRAY("SampleEnum" NOT NULL)

[[SECTION:ARRAY_TYPE_OBJECT]]
[[TAGS: ARRAY OBJECT POLYMORPHIC]]
Object arrays:
metrics ARRAY(OBJECT("Metric"))
Polymorphic object arrays (multiple classes):
events ARRAY(OBJECT("BaseEvent","DerivedEvent") NOT NULL) NOT NULL

[[SECTION:ARRAY_TYPE_NESTED]]
[[TAGS: ARRAY NESTED MULTI_DIMENSION]]
Nested arrays:
grid ARRAY(ARRAY(INTEGER NOT NULL))
Each level controls its own container / element nullability.

[[SECTION:ARRAY_TYPE_QUERYING_LENGTH]]
[[TAGS: ARRAY QUERY LENGTH SIZE FUNCTION]]
Use `size()` for length. Avoid deprecated/legacy names.
Example:
SELECT size("valuesArray") FROM "sample_stream"

[[SECTION:ARRAY_TYPE_QUERYING_INDEX]]
[[TAGS: ARRAY QUERY INDEX ACCESS]]
Zero‑based indexing (if supported):
SELECT "valuesArray"[0] FROM "sample_stream"
Safe guarded access:
SELECT CASE WHEN size("valuesArray") > 0 THEN "valuesArray"[0] END FROM "sample_stream"

[[SECTION:ARRAY_TYPE_QUERYING_OBJECT_FIELDS]]
[[TAGS: ARRAY OBJECT FIELD ACCESS]]
Access object field of first element after bounds check:
SELECT
CASE
WHEN size("eventArray") > 0 THEN "eventArray"[0].price
END
FROM "sample_stream"

[[SECTION:ARRAY_TYPE_FILTERING]]
[[TAGS: ARRAY FILTER WHERE PREDICATE SIZE]]
Filter by minimum length:
SELECT "eventArray"
FROM "sample_stream"
WHERE size("eventArray") >= 2
Filter by first two elements increasing:
SELECT "valuesArray"
FROM "sample_stream"
WHERE size("valuesArray") >= 2
AND "valuesArray"[0] < "valuesArray"[1]

[[SECTION:ARRAY_TYPE_NESTED_ACCESS]]
[[TAGS: ARRAY NESTED ACCESS SAFE]]
Nested safe access pattern:
SELECT
CASE
WHEN size("outerArray") > 0
AND size("outerArray"[0]) > 0
THEN "outerArray"[0][0]
END
FROM "sample_stream"

[[SECTION:ARRAY_TYPE_PERFORMANCE]]
[[TAGS: ARRAY PERFORMANCE BEST_PRACTICES]]
Performance notes:
1. Avoid projecting very large arrays unless required.
2. Filter early using size() if only certain lengths matter.
3. Prefer element NOT NULL when semantic guarantee exists to reduce downstream null checks.

[[SECTION:ARRAY_TYPE_BEST_PRACTICES]]
[[TAGS: ARRAY BEST_PRACTICES GUIDELINES]]
1. Always guard index access with size() > index.
2. Use element NOT NULL only with real invariants.
3. Keep nested depth minimal; flatten schema where feasible.
4. Use polymorphic OBJECT arrays only when heterogeneous subtypes required.
5. Use size() exclusively; do not mix alternative length functions.

[[SECTION:ARRAY_TYPE_ANTI_PATTERNS]]
[[TAGS: ARRAY ANTI_PATTERNS BAD PRACTICES]]
Avoid:
-- Using deprecated length function
-- SELECT ARRAY_LENGTH("valuesArray") FROM "sample_stream"
-- Blind indexing
-- SELECT "valuesArray"[3] FROM "sample_stream"
-- Deep unnecessary nesting
-- ARRAY(ARRAY(ARRAY(FLOAT)))

[[SECTION:ARRAY_TYPE_EXAMPLES_DDL]]
[[TAGS: ARRAY EXAMPLES DDL]]
Complete illustrative DDL:
CREATE DURABLE STREAM "sample_arrays" (
    ENUM "SampleEnum" (
        A, 
        B, 
        C
    );
    CLASS "CustomAttribute" (
        key VARCHAR NOT NULL, 
        value VARCHAR
    );
    CLASS "DeltaAttribute" UNDER "CustomAttribute" (
        delta FLOAT
    );
    CLASS "SampleArrayMessage" (
        int_array_nullable ARRAY(INTEGER),
        int_array ARRAY(INTEGER NOT NULL),
        enum_array_nullable ARRAY("SampleEnum"),
        enum_array ARRAY("SampleEnum" NOT NULL),
        object_array_nullable ARRAY(OBJECT("CustomAttribute")),
        object_array ARRAY(OBJECT("CustomAttribute") NOT NULL) NOT NULL,
        poly_object_array ARRAY(OBJECT("CustomAttribute","DeltaAttribute") NOT NULL) NOT NULL,
        nested_array ARRAY(ARRAY(OBJECT("CustomAttribute","DeltaAttribute")))
    )
)

[[SECTION:ARRAY_TYPE_EXAMPLES_QUERY]]
[[TAGS: ARRAY EXAMPLES QUERY]]
Query projections:
SELECT size("int_array") AS len_int_array,
CASE WHEN size("int_array") > 0 
THEN "int_array"[0] END AS first_int,
CASE WHEN size("poly_object_array") > 0
THEN "poly_object_array"[0].key
END AS first_key
FROM "sample_arrays"

[[SECTION:ARRAY_TYPE_REFERENCE_END]]
[[TAGS: ARRAY END REFERENCE]]
End of array type reference.
