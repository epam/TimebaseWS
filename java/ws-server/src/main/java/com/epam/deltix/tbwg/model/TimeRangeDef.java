package com.epam.deltix.tbwg.model;

import com.epam.deltix.tbwg.utils.DateFormatter;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.webcohesion.enunciate.metadata.DocumentationExample;

import java.time.Instant;

/**
 * Time range definition.
 */
public class TimeRangeDef {

    public TimeRangeDef(long[] range) {
        if (range != null) {
            start = Instant.ofEpochMilli(range[0]);
            end = Instant.ofEpochMilli(range[1]);
        }
    }

    public TimeRangeDef(Instant start, Instant end) {
        this.start = start;
        this.end = end;
    }

    @DocumentationExample("2018-06-28T09:30:00.123Z")
    @JsonProperty
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = DateFormatter.DATETIME_MILLIS_FORMAT_STR, timezone = "UTC")
    public Instant start;

    @DocumentationExample("2018-07-28T23:59:59.999Z")
    @JsonProperty
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = DateFormatter.DATETIME_MILLIS_FORMAT_STR, timezone = "UTC")
    public Instant end;
}
