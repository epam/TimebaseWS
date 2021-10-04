package com.epam.deltix.tbwg.services.timebase;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.qsrv.hf.pub.RawMessage;
import com.epam.deltix.qsrv.hf.tickdb.pub.SelectionOptions;
import com.epam.deltix.qsrv.hf.tickdb.pub.TickCursor;
import com.epam.deltix.qsrv.hf.tickdb.pub.query.InstrumentMessageSource;

import java.io.Closeable;
import java.util.Arrays;
import java.util.List;
import java.util.function.Consumer;

public class StreamConsumer extends Thread implements Closeable {

    private static final Log LOGGER = LogFactory.getLog(StreamConsumer.class);

    private final long startTime;
    private final String stream;
    private final String[] symbols;
    private final String[] types;
    private final Consumer<RawMessage> messageConsumer;
    private final TimebaseServiceImpl timebase;

    private volatile InstrumentMessageSource cursor;
    private volatile boolean active = false;

    public StreamConsumer(TimebaseServiceImpl timebase, long startTime, String stream, List<String> symbols,
                          List<String> types, Consumer<RawMessage> messageConsumer) {
        this.timebase = timebase;
        this.startTime = startTime;
        this.stream = stream;
        this.symbols = symbols != null ? symbols.toArray(new String[0]) : null;
        this.types = types == null ? null: types.toArray(new String[types.size()]);
        this.messageConsumer = messageConsumer;
    }


    @Override
    public void run() {
        active = true;
        try (final InstrumentMessageSource cursor = openCursor()) {
            this.cursor = cursor;
            while (cursor.next()) {
                if (!active) {
                    break;
                }

                messageConsumer.accept((RawMessage) cursor.getMessage());
            }
        } catch (final Throwable e) {
            if (active) {
                LOGGER.error().append("Unexpected error while reading cursor.").append(e).commit();
            }
        } finally {
            close();
        }
    }

    private InstrumentMessageSource openCursor() {
        SelectionOptions options = new SelectionOptions(true, true);
        options.allowLateOutOfOrder = true; // otherwise we lose messages
//        options.channelQOS = ChannelQualityOfService.MAX_THROUGHPUT;

        TickCursor cursor = timebase.getConnection().select(startTime, options, types, symbols, timebase.getStream(stream));

        LOGGER.info().append("Subscribed stream ").append(stream)
                .append(", start time: ").appendTimestamp(startTime)
                .append(", entities: ").append(Arrays.toString(symbols))
                .append(", types: ").append(Arrays.toString(types))
                .commit();

        return cursor;
    }

    public boolean isActive() {
        return active;
    }

    public void reset(long timestamp) {
        if (cursor == null) {
            LOGGER.warn().append("Cursor is not created. Can't reset cursor for stream ").append(stream)
                    .commit();
            return;
        }

        cursor.reset(timestamp);
        LOGGER.info().append("Reset cursor timestamp for streams").append(stream)
            .append(". Reset time: ").appendTimestamp(timestamp).commit();
    }

    @Override
    public void close() {
        if (!active) {
            return;
        }

        active = false;
        LOGGER.info().append("Closing stream consumer for stream ")
                .append(stream).commit();

        if (cursor != null && !cursor.isClosed()) {
            try {
                cursor.close();
            } finally {
                cursor = null;
            }
        }
    }

}
