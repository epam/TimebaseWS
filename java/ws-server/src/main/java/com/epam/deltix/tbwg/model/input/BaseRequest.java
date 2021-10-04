package com.epam.deltix.tbwg.model.input;

import com.epam.deltix.tbwg.utils.DateFormatter;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.webcohesion.enunciate.metadata.DocumentationExample;
import com.epam.deltix.qsrv.hf.pub.ChannelQualityOfService;
import com.epam.deltix.qsrv.hf.tickdb.pub.SelectionOptions;

import java.time.Instant;

/**
 * Request for downloading data from server.
 */
public class BaseRequest {

    public static int           DEFAULT_PAGE_SIZE = 1000;

    /**
     * The start timestamp in UTC (inclusive), for example 2018-06-28T09:30:00.123Z
     */
    @DocumentationExample("2018-06-28T09:30:00.123Z")
    @JsonProperty
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = DateFormatter.DATETIME_MILLIS_FORMAT_STR, timezone = "UTC")
    public Instant              from;

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
     * Number of returning rows. (By default = 1000)
     */
    @DocumentationExample("1000")
    @JsonProperty
    public int                  rows = DEFAULT_PAGE_SIZE;

    /**
     * Result order of messages
     */
    @DocumentationExample("false")
    @JsonProperty
    public boolean              reverse = false;

    /**
     * Specified space (partition) name to select data from.
     */
    @DocumentationExample(value = "partition1")
    @JsonProperty
    public String               space;

    @JsonIgnore
    public long                 getStartTime(long currentTime) {
        return from != null ? from.toEpochMilli() : Long.MIN_VALUE;
    }

    @JsonIgnore
    public long                 getEndTime() {
        return to != null ? to.toEpochMilli() : Long.MAX_VALUE;
    }

    @JsonIgnore
    public long getEndTime(long defaultValue) {
        return to != null ? to.toEpochMilli() : Long.MIN_VALUE;
    }

    public SelectionOptions getSelectionOptions() {
        SelectionOptions options = new SelectionOptions();
        options.channelQOS = ChannelQualityOfService.MIN_INIT_TIME;
        options.reversed = reverse;
        options.raw = true;
        return options;
    }
}
