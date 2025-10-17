---
title: Timestamp Data Type
tags: [ddl, data types, timestamp, encoding, millisecond, nanosecond]
---

[[SECTION:OVERVIEW]]
[[TAGS: OVERVIEW TYPE TIMESTAMP]]
`TIMESTAMP` represents an absolute, time zone independent instant counted as milliseconds (or nanoseconds when explicitly encoded) since 1970‑01‑01 00:00:00 UTC.

[[SECTION:RANGE_PRECISION]]
[[TAGS: RANGE PRECISION RESOLUTION]]
Core traits:
- Millisecond or nanosecond resolution (chosen via encoding).
- Stored as 64‑bit integer.
- Time zone neutral (interpretation context external).

[[SECTION:ENCODINGS]]
[[TAGS: ENCODING MILLISECOND NANOSECOND]]
Supported encodings:

| Encoding | Bytes | Range | Description |
| --- | --- | --- | --- |
| MILLISECOND | 8 | Maximum date/time encoded is about 292,277,026,596 years | Milliseconds resolution |
| NANOSECOND | 8 | Supported range of values: \[1677-09-21 00:12:42, 2262-04-11 23:47:16] | Nanoseconds resolution |

[[SECTION:DDL_USAGE]]
[[TAGS: DDL DECLARATION FIELDS]]
Use plain `TIMESTAMP` for millisecond resolution. Append `NANOSECOND` after type name for nanosecond resolution where supported.

[[SECTION:EXAMPLE]]
[[TAGS: EXAMPLE DECLARATION]]
Example:
CLASS "epam.rtc.timebase.samples.TimeMessage" 'Sample Time Message' (
    "date_c"  'Non-nullable DATE with millisecond resolution' TIMESTAMP NOT NULL,
    "date_n"  'Nullable DATE with millisecond resolution'     TIMESTAMP,
    "nanos_n" 'Non-nullable DATE with nanosecond resolution'  TIMESTAMP NANOSECOND NOT NULL,
    "nanos"   'Nullable DATE with nanosecond resolution'      TIMESTAMP NANOSECOND
)

[[SECTION:USAGE_NOTES]]
[[TAGS: NOTES GUIDELINES]]
Notes:
1. Choose NANOSECOND only when source data precision requires it.
2. Millisecond encoding is default when no encoding qualifier specified.
3. Do not redefine implicit message identity timestamp field; this type applies to user‑defined fields.

[[SECTION:BEST_PRACTICES]]
[[TAGS: BEST_PRACTICES]]
1. Prefer millisecond unless upstream data truly needs nanosecond fidelity.
2. Keep naming consistent (e.g., suffix \_nanos only when using nanosecond encoding).
3. Avoid redundant nullable high‑precision fields when millisecond field already sufficient.

[[SECTION:COMMON_MISTAKES]]
[[TAGS: PITFALLS ERRORS]]
1. Adding an explicit identity field for message time (already implicit).
2. Using nanosecond encoding without data of that precision.
3. Omitting NOT NULL where field logically required for downstream logic.

[[SECTION:REFERENCE_END]]
[[TAGS: END TIMESTAMP TYPE]]
End of timestamp data type reference.
