package com.epam.deltix.tbwg.model.ws;

import com.epam.deltix.tbwg.utils.DateFormatter;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.webcohesion.enunciate.metadata.DocumentationExample;
import com.epam.deltix.util.collections.generated.ObjectArrayList;

import java.time.Instant;
import java.util.List;

/**
 * @author Daniil Yarmalkevich
 * Date: 8/21/2019
 */
public class SubscribeMessage extends WSMessage {

    public SubscribeMessage() {
        super(MessageType.SUBSCRIBE);
    }

    /**
     * The start timestamp in UTC (inclusive), for example 2018-06-28T09:30:00.123Z
     */
    @DocumentationExample("2018-06-28T09:30:00.123Z")
    @JsonProperty
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = DateFormatter.DATETIME_MILLIS_FORMAT_STR, timezone = "UTC")
    public Instant from = Instant.ofEpochMilli(Long.MIN_VALUE);

    /**
     * Specified symbols need to be subscribed or removed from subscription.
     * If undefined, then nothing about symbols subscription will change.
     */
    @JsonProperty
    public Symbols symbols = new Symbols();

    /**
     * Specified message types to be subscribed or removed from subscription.
     * If undefined, then nothing about types subscription will change.
     */
    @JsonProperty
    public Types types = new Types();

    public static class Symbols {

        /**
         * Set <code>true</code> if need to subscribe all symbols.
         */
        @JsonProperty
        public boolean subscribeToAll = false;

        /**
         * Symbols need to be added to the subscription
         * If {@link Symbols#subscribeToAll} is <code>true</code> this field is ignored.
         */
        @DocumentationExample("[\"BTC/USD\", \"ETH/USD\"]")
        @JsonProperty
        public List<String> add = new ObjectArrayList<>();

        /**
         * Symbols need to be removed from the subscription.
         * If {@link Symbols#subscribeToAll} is <code>true</code> this field is ignored.
         */
        @DocumentationExample("[\"USD/EUR\", \"ETH/USDT\"]")
        @JsonProperty
        public List<String> remove = new ObjectArrayList<>();

        public boolean isEmpty() {
            return (add == null || add.isEmpty()) && (remove == null || remove.isEmpty());
        }

        @Override
        public String toString() {
            return "Symbols{" +
                    "subscribeToAll=" + subscribeToAll +
                    ", add=" + add +
                    ", remove=" + remove +
                    '}';
        }
    }

    public static class Types {
        /**
         * Set <code>true</code> if need to subscribe all types.
         */
        @JsonProperty
        public boolean subscribeToAll = false;

        /**
         * Types need to be added to the subscription.
         * If {@link Types#subscribeToAll} is <code>true</code> this field is ignored.
         */
        @JsonProperty
        public List<String> add = new ObjectArrayList<>();

        /**
         * Types need to be removed from the subscription.
         * If {@link Types#subscribeToAll} is <code>true</code> this field is ignored.
         */
        @JsonProperty
        public List<String> remove = new ObjectArrayList<>();

        public boolean isEmpty() {
            return (add == null || add.isEmpty()) && (remove == null || remove.isEmpty());
        }

        @Override
        public String toString() {

            return "Types{" +
                    "subscribeToAll=" + subscribeToAll +
                    ", add=" + add +
                    ", remove=" + remove +
                    '}';
        }
    }

    @Override
    public String toString() {
        return "SubscribeMessage{" +
                "from=" + from +
                ", symbols=" + symbols +
                ", types=" + types +
                '}';
    }
}
