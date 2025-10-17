---
title: Binary Data Type
tags: [ddl, binary, type, syntax, size-limit, nullable, encoding, raw, blob, querying, best_practices, examples]
---

[[SECTION:BINARY_TYPE_OVERVIEW]]
[[TAGS: BINARY TYPE OVERVIEW RAW DATA]]
Binary type: BINARY. Stores opaque byte sequences (blobs). Engine treats content as uninterpreted; semantics decided by producer and consumer (e.g. compressed block, serialized protobuf, image fragment).

[[SECTION:BINARY_TYPE_LIMITS]]
[[TAGS: BINARY SIZE LIMIT BYTES]]
Maximum size per BINARY field value: 4,194,304 bytes. Larger values are rejected.

[[SECTION:BINARY_TYPE_SYNTAX_DDL]]
[[TAGS: BINARY DDL SYNTAX TYPE_DEFINITION]]
Definition pattern:
fieldName BINARY
Make non nullable:
fieldName BINARY NOT NULL
Example inside class:
CLASS "BinaryEnvelope" ( rawPayload BINARY NOT NULL, encoding VARCHAR )

[[SECTION:BINARY_TYPE_NULLABILITY]]
[[TAGS: BINARY NULL NULLABLE NOT_NULL]]
BINARY is a single container (no element subtype). Default nullable unless suffixed with NOT NULL. Use NOT NULL only when every message guarantees a payload.

[[SECTION:BINARY_TYPE_ENCODING]]
[[TAGS: BINARY ENCODING FORMAT METADATA]]
If payload has internal format (gzip, json, protobuf), add a companion metadata field (e.g. encoding VARCHAR). Do not overload one BINARY field with multiple implicit encodings.

[[SECTION:BINARY_TYPE_LENGTH_HANDLING]]
[[TAGS: BINARY LENGTH SIZE TRACKING]]
Function `size()` is NOT applicable to BINARY. To filter by length:
1. Add a producer\-filled INTEGER field (e.g. payloadLength INTEGER NOT NULL).
2. Or store pre\-compressed vs compressed variants in separate fields.
3. Consumers may compute length client side after retrieval (less efficient for large datasets).

[[SECTION:BINARY_TYPE_USAGE_PATTERNS]]
[[TAGS: BINARY USAGE PATTERNS USE_CASES]]
Typical uses:
1. Compressed snapshots.
2. External protocol frames.
3. Packed arrays when ARRAY type is unsuitable.
4. Vendor opaque extension blocks.

[[SECTION:BINARY_TYPE_PERFORMANCE]]
[[TAGS: BINARY PERFORMANCE]]
1. Large blobs increase I/O; project only when needed.
2. Maintain a length field to allow server\-side filtering patterns.
3. Split extremely large logical payloads across messages if feasible.

[[SECTION:BINARY_TYPE_BEST_PRACTICES]]
[[TAGS: BINARY BEST_PRACTICES GUIDELINES]]
1. Pair with encoding / schemaVersion fields for evolvable formats.
2. Prefer explicit schema fields over opaque BINARY when structure is stable.
3. Keep typical payload size well below hard limit.
4. Provide a length INTEGER if downstream filtering by size is required.
5. Avoid unnecessary duplication of identical binary content across messages.

[[SECTION:BINARY_TYPE_ANTI_PATTERNS]]
[[TAGS: BINARY ANTI_PATTERNS BAD PRACTICES]]
Avoid:
1. Storing plain text in BINARY instead of VARCHAR.
2. Mixing multiple encodings without an explicit discriminator.
3. Using BINARY to bypass proper schema evolution.
4. Projecting large blobs in broad analytical scans when only metadata needed.
5. Assuming a `size()` function exists for server filtering.

[[SECTION:BINARY_TYPE_EXAMPLES_DDL]]
[[TAGS: BINARY EXAMPLES DDL]]
CREATE DURABLE STREAM "binary_samples" (
    CLASS "BinaryMessage" (
        rawPayload BINARY NOT NULL,
        payloadLength INTEGER NOT NULL,
        compressedBlock BINARY,
        encoding VARCHAR,
        schemaVersion INTEGER NOT NULL
    )
)

[[SECTION:BINARY_TYPE_EXAMPLES_QUERY]]
[[TAGS: BINARY EXAMPLES QUERY]]
Filter using tracked length (not size()):
SELECT rawPayload FROM "binary_samples" WHERE payloadLength > 0
Select encoding + tracked length:
SELECT encoding, payloadLength FROM "binary_samples"

[[SECTION:BINARY_TYPE_REFERENCE_END]]
[[TAGS: BINARY END REFERENCE]]
End of binary data type reference.
