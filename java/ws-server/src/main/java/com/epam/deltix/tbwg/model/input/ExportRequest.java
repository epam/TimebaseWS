package com.epam.deltix.tbwg.model.input;

import com.epam.deltix.tbwg.utils.DateFormatter;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.webcohesion.enunciate.metadata.DocumentationExample;

import java.time.Instant;
import java.util.stream.Stream;

public class ExportRequest {

    /**
     * The start timestamp in UTC (inclusive), for example 2018-06-28T09:30:00.123Z
     */
    @DocumentationExample("2018-06-28T09:30:00.123Z")
    @JsonProperty
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = DateFormatter.DATETIME_MILLIS_FORMAT_STR, timezone = "UTC")
    public Instant from;

    /**
     * The end timestamp in UTC (inclusive), for example 2018-06-28T00:00:00.123Z
     */
    @DocumentationExample("2018-06-30T09:30:00.123Z")
    @JsonProperty
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = DateFormatter.DATETIME_MILLIS_FORMAT_STR, timezone = "UTC")
    public Instant              to;

    /**
     * Start row offset. (By default = 0)
     */
    @DocumentationExample("0")
    @JsonProperty
    public long                 offset = 0;

    /**
     * Number of returning rows. (By default = -1, means all rows must be selected)
     */
    @DocumentationExample("1000")
    @JsonProperty
    public int                  rows = -1;

    /**
     * Result order of messages
     */
    @DocumentationExample("false")
    @JsonProperty
    public boolean              reverse = false;

    @JsonIgnore
    public long                 getStartTime(long currentTime) {
        return from != null ? from.toEpochMilli() : Long.MIN_VALUE;
    }

    @JsonIgnore
    public long                 getEndTime() {
        return to != null ? to.toEpochMilli() : Long.MAX_VALUE;
    }

    /**
     * Specified message types to be subscribed. If undefined, then all types will be subscribed.
     */
    @JsonProperty
    public TypeSelection[]      types;

    /**
     * Specified export format
     */
    @JsonProperty
    public ExportFormat         format;

    /**
     * Values separator in case of CSV export format. ',' by default
     */
    @JsonProperty
    public String               valueSeparator = ",";

    @JsonProperty
    public ExportMode           mode = ExportMode.SINGLE_FILE;

    /**
     * Specified instruments(symbols) to be subscribed. If undefined, then all instruments will be subscribed.
     */
    @DocumentationExample(value = "BTCEUR", value2 = "ETHEUR")
    @JsonProperty
    public String[]             symbols;

    /**
     * Return timebase type name for selection
     * @return String names
     */
    @JsonIgnore
    public String[]             getTypes() {
        return types != null ? Stream.of(types).map(x -> x.name).toArray(String[]::new) : null;
    }

    @JsonIgnore
    public void                 setTypes(String[] names) {
        if (names == null) {
            types = null;
        } else {
            types = new TypeSelection[names.length];
            for (int i = 0; i < names.length; i++)
                types[i] = new TypeSelection(names[i]);
        }
    }

    @JsonIgnore
    public String               getFileName(String name) {
        if (format == ExportFormat.CSV) {
            return "export-" + name + ".zip";
        } else {
            if (mode == ExportMode.FILE_PER_SYMBOL || mode == ExportMode.FILE_PER_SPACE) {
                return "export-" + name + ".zip";
            } else {
                return "export-" + name + ".qsmgs.gz";
            }
        }
    }

}
