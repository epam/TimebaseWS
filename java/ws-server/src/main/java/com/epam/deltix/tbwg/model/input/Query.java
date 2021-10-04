package com.epam.deltix.tbwg.model.input;

import com.epam.deltix.tbwg.model.grafana.AggregationType;
import com.epam.deltix.tbwg.model.grafana.GrafanaChartType;
import com.epam.deltix.tbwg.utils.DateFormatter;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.webcohesion.enunciate.metadata.DocumentationExample;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * @author Daniil Yarmalkevich
 * Date: 8/19/2019
 */
public class Query {

    @JsonProperty
    public String panelId;

    @JsonProperty
    public Range range;

    @JsonProperty
    public RangeRaw rangeRaw;

    @DocumentationExample("30s")
    @JsonProperty
    public String interval;

    @DocumentationExample("30000")
    @JsonProperty
    public long intervalMs;

    @JsonProperty
    public List<Target> targets;

    @JsonProperty
    public List<Filter> adhocFilters;

    @JsonProperty
    public String format;

    @JsonProperty
    public int maxDataPoints;

    public static class RangeRaw {
        @DocumentationExample("now-6h")
        @JsonProperty
        public String from;

        @DocumentationExample("now")
        @JsonProperty
        public String to;
    }

    public static class Range {
        @DocumentationExample("2016-10-31T06:33:44.866Z")
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = DateFormatter.DATETIME_MILLIS_FORMAT_STR, timezone = "UTC")
        @JsonProperty
        public Instant from;

        @DocumentationExample("2016-10-31T12:33:44.866Z")
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = DateFormatter.DATETIME_MILLIS_FORMAT_STR, timezone = "UTC")
        @JsonProperty
        public Instant to;

        @JsonProperty
        public RangeRaw rangeRaw;
    }

    public static class Target {
        @JsonProperty
        public String target;

        @JsonProperty
        public List<String> symbols;

        @JsonProperty
        public int levels;

        @JsonProperty
        public String refId;

        @JsonProperty
        public String type;

        @JsonProperty
        public GrafanaChartType chartType;

        @JsonProperty
        public String recordType;

        @JsonProperty
        public Map<String, List<String>> fields;

        @JsonProperty
        public AggregationType aggregationType;
    }

    public enum Type {
        timeserie, table
    }

    public static class Filter {
        @JsonProperty
        public String key;

        @DocumentationExample("=")
        @JsonProperty
        public String operator;

        @JsonProperty
        public String value;
    }

    public long getFrom() {
        return range.from.toEpochMilli();
    }

    public long getTo() {

        return range.to.toEpochMilli();
    }

}
