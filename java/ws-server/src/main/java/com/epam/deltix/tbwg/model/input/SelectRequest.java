package com.epam.deltix.tbwg.model.input;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.webcohesion.enunciate.metadata.DocumentationExample;
import com.epam.deltix.util.time.Interval;

/**
 * Request for selecting data from streams.
 */
public class SelectRequest extends BaseRequest {

    /**
     * Specified streams to be subscribed. At least one stream name should be defineds.
     */

    @DocumentationExample(value = "ticks")
    @JsonProperty
    public String[]             streams;

    /**
     * Specified message types to be subscribed. If undefined, then all types will be subscribed.
     */
    @DocumentationExample(value = "deltix.timebase.api.messages.L2Message", value2 = "deltix.timebase.api.messages.universal.PackageHeader")
    @JsonProperty
    public String[]             types;

    /**
     * Specified instruments(symbols) to be subscribed. If undefined, then all instruments will be subscribed.
     */
    @DocumentationExample(value = "AAPL", value2 = "GOOG")
    @JsonProperty
    public String[]             symbols;

    /**
     * Specified time history depth to be subscribed. For direct selection
     */
    @DocumentationExample(value = "1H", value2 = "5H")
    @JsonProperty
    public String               depth;

    @Override
    public long         getStartTime(long currentTime) {
        long ts = Long.MIN_VALUE;

        Interval iDepth = Interval.valueOf(depth);

        if (from != null) {
            ts = from.toEpochMilli();
        } else {
            if (depth != null)
                ts = (to == null ? currentTime : to.toEpochMilli()) - iDepth.toMilliseconds();
        }

        return ts;
    }
}
