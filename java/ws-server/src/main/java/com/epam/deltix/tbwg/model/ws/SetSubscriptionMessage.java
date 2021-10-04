package com.epam.deltix.tbwg.model.ws;

import com.epam.deltix.tbwg.utils.DateFormatter;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.webcohesion.enunciate.metadata.DocumentationExample;
import com.epam.deltix.util.collections.generated.ObjectArrayList;

import java.time.Instant;
import java.util.List;

public class SetSubscriptionMessage extends WSMessage {

    public SetSubscriptionMessage() {
        super(MessageType.SET_SUBSCRIPTION);
    }

    @DocumentationExample("2018-06-28T09:30:00.123Z")
    @JsonProperty
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = DateFormatter.DATETIME_MILLIS_FORMAT_STR, timezone = "UTC")
    public Instant from = Instant.ofEpochMilli(Long.MIN_VALUE);

    /**
     * If empty or null - subscribe to all
     */
    @JsonProperty
    public List<String> symbols = new ObjectArrayList<>();

    /**
     * If empty or null - subscribe to all
     */
    @JsonProperty
    public List<String> types = new ObjectArrayList<>();

    @Override
    public String toString() {
        return "SetSubscriptionMessage{" +
                "from=" + from +
                ", symbols=" + symbols +
                ", types=" + types +
                '}';
    }
}
