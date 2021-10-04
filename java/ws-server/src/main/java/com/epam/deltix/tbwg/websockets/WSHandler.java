package com.epam.deltix.tbwg.websockets;

import com.epam.deltix.tbwg.model.ws.*;
import com.epam.deltix.timebase.messages.IdentityKey;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonParseException;
import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.gflog.api.LogLevel;
import com.epam.deltix.qsrv.hf.pub.RawMessage;
import com.epam.deltix.qsrv.hf.tickdb.pub.CursorException;
import com.epam.deltix.qsrv.hf.tickdb.pub.DXTickStream;
import com.epam.deltix.qsrv.hf.tickdb.pub.SelectionOptions;
import com.epam.deltix.qsrv.hf.tickdb.pub.TickCursor;
import com.epam.deltix.qsrv.hf.tickdb.pub.topic.DirectChannel;
import com.epam.deltix.qsrv.util.json.DataEncoding;
import com.epam.deltix.qsrv.util.json.JSONRawMessagePrinter;
import com.epam.deltix.qsrv.util.json.PrintType;
import com.epam.deltix.tbwg.services.timebase.TimebaseServiceImpl;
import com.epam.deltix.tbwg.utils.cache.CachedMessageBufferImpl;
import com.epam.deltix.tbwg.utils.cache.MessageBuffer;
import com.epam.deltix.tbwg.utils.cache.MessageBufferImpl;
import com.epam.deltix.util.collections.generated.ObjectToObjectHashMap;
import com.epam.deltix.util.concurrent.*;
import com.epam.deltix.util.lang.Util;
import com.epam.deltix.util.time.Interval;
import com.epam.deltix.util.vsocket.ChannelClosedException;
import io.netty.handler.codec.http.QueryStringDecoder;
import org.springframework.util.MultiValueMap;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import static com.epam.deltix.tbwg.utils.TBWGUtils.*;

/**
 * Web Sockets Controller.
 */

public class WSHandler extends TextWebSocketHandler {

    static final Log LOGGER = LogFactory.getLog(WSHandler.class);

    private static final int MAX_BUFFER_SIZE = 16 * 1024;
    private static final int LIMIT_BUFFER_SIZE = MAX_BUFFER_SIZE - (MAX_BUFFER_SIZE % 10);

    // object for cursor sync
    private final Object object = new Object();

    private final class PumpTask extends QuickExecutor.QuickTask {
        final Runnable avlnr = PumpTask.this::submit;

        private final JSONRawMessagePrinter printer
                = new JSONRawMessagePrinter(false, true, DataEncoding.STANDARD, true, false, PrintType.FULL, "$type");

        //final JSONRawMessagePrinter     printer = new JSONRawMessagePrinter(false, true);

        private final TickCursor        cursor;
        private final DXTickStream[]    selection;
        private final IntermittentlyAvailableCursor c;
        private final long              toTimestamp;
        private final WebSocketSession  session;
        private CloseStatus             status;
        private int                     messages = 0;

        private final MessageBuffer<RawMessage> buffer;

        public PumpTask (DXTickStream[] selection, TickCursor cursor, long toTimestamp, boolean live, WebSocketSession session, QuickExecutor exe) {
            super (exe);
            this.selection = selection;
            this.cursor = cursor;
            this.c = (IntermittentlyAvailableCursor)cursor;
            this.toTimestamp = toTimestamp;
            this.session = session;
            this.buffer = useCache() ? new CachedMessageBufferImpl(printer) : new MessageBufferImpl(printer, live);
        }

        @Override
        public String       toString () {
            return ("Pump Task for " + WSHandler.this);
        }

        @Override
        public void         run () {
            try {
                for (;;) {

                    NextResult next;

                    Throwable exception = null;
                    synchronized (object) {
                        try {
                            next = c.nextIfAvailable();
                        } catch (UnavailableResourceException x) {
                            continue;
                        } catch (CursorIsClosedException x) {
                            if (session.isOpen()) {
                                session.sendMessage(new TextMessage(x.getMessage(), true));
                            }
                            stop(CloseStatus.NORMAL);
                            break;
                        } catch (CursorException x) {
                            next = NextResult.OK;
                            exception = x;
                        } catch (Throwable x) {
                            if (session.isOpen()) {
                                session.sendMessage(new TextMessage(x.getMessage(), false));
                            }
                            stop(CloseStatus.SERVER_ERROR);
                            return;
                        }

                        if (exception != null) {
                            if (session.isOpen()) {
                                session.sendMessage(new TextMessage(exception.getMessage(), false));
                            }
                            continue;
                        }

                        if (next == NextResult.OK) {
                            if (cursor.getMessage().getTimeStampMs() <= toTimestamp) {

                                buffer.append((RawMessage) cursor.getMessage());
                                if (buffer.canFlush())
                                    sendBuffer();

                                messages++;
                            } else {
                                stop(CloseStatus.NORMAL);
                                break;
                            }
                        } else if (next == NextResult.END_OF_CURSOR) {
                            stop(CloseStatus.NORMAL);
                            break;
                        }
                    }
                }
                // else continue with NextResult.UNAVAILABLE
            } catch (ChannelClosedException x) {
                stop(CloseStatus.NORMAL);
            } catch (IOException iox) {
                stop(CloseStatus.SERVER_ERROR);
            }
        }

        void        sendBuffer() throws IOException {
            if (session.isOpen()) {
                String output = buffer.flush();
                if (output.length() > 0) {
                    session.sendMessage(new TextMessage(output));
                }
            }
        }

        private void stop(CloseStatus s) {

            LOGGER.log(LogLevel.INFO, "CURSOR [" + cursor.hashCode() +  "]: send messages " + messages);
            unschedule();
            cursor.setAvailabilityListener (null);
            Util.close(cursor);
            try {
                sendBuffer();
                if (status != s && session.isOpen())
                    session.close(s);
                status = s;
            } catch (IOException e) {
                LOGGER.error("Error closing session: %s") .with(e);
            }

        }
    }

    private class PeriodicFlushTask implements Runnable {
        private List<PumpTask> flushTasks = new ArrayList<>();

        public void run()  {
            allTasks().forEach(task -> {
                try {
                    task.sendBuffer();
                } catch (IOException e) {
                    LOGGER.error().append("Error sending ws message").append(e).commit();
                }
            });
        }

        private List<PumpTask> allTasks() {
            flushTasks.clear();
            synchronized (map) {
                map.copyTo(flushTasks);
            }

            return flushTasks;
        }
    }

    private final ObjectToObjectHashMap<String, PumpTask> map = new ObjectToObjectHashMap<>();

    private final DirectChannel         channel;
    private final TimebaseServiceImpl timebase;

    private final QuickExecutor         executor;

    private final Gson                  gson;

    private final long                  flushPeriodMs;
    private final ScheduledExecutorService scheduler; //todo: call shutdown

    // Global selector for multiply streams

    public WSHandler(TimebaseServiceImpl timebase, QuickExecutor executor) {
        this(timebase, executor, 0);
    }

    public WSHandler(TimebaseServiceImpl timebase, QuickExecutor executor, long flushPeriodMs) {
        this.timebase = timebase;
        this.executor = executor;
        this.channel = null;
        this.gson = createGson();
        this.flushPeriodMs = flushPeriodMs;
        this.scheduler = initTaskScheduler();
    }

    public WSHandler(TimebaseServiceImpl timebase, DirectChannel channel, QuickExecutor executor) {
        this.executor = executor;
        this.channel = channel;
        this.timebase = timebase;
        this.gson = createGson();
        this.flushPeriodMs = 0;
        this.scheduler = initTaskScheduler();
    }

    private static Gson createGson() {
        return new GsonBuilder().registerTypeAdapter(WSMessage.class, new WSMessageTypeAdapter())
                .registerTypeAdapter(Instant.class, new InstantTypeAdapter())
                .create();
    }

    private ScheduledExecutorService initTaskScheduler() {
        ScheduledExecutorService scheduler = null;
        if (useCache()) {
            scheduler = Executors.newScheduledThreadPool(1);
            scheduler.scheduleAtFixedRate(new PeriodicFlushTask(), flushPeriodMs, flushPeriodMs, TimeUnit.MILLISECONDS);
        }

        return scheduler;
    }

    private boolean useCache() {
        return flushPeriodMs > 0;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws IOException {

        session.setTextMessageSizeLimit(MAX_BUFFER_SIZE);

        String streamId = (String) session.getAttributes().get("streamId");

        QueryStringDecoder decoder = new QueryStringDecoder(session.getUri().toString());
        Map<String, List<String>> parameters = decoder.parameters();

        MultiValueMap<String, String> params =
                UriComponentsBuilder.fromUriString(session.getUri().toString()).build().getQueryParams();

        List<String> list;

        DXTickStream[] selection = null;

        if (streamId == null && channel == null) {
            list = params.get("streams");
            if (list != null)
                selection = match(timebase, list.toArray(new String[list.size()]));
        } else if (streamId != null) {
            DXTickStream stream = timebase.getStream(streamId);
            if (stream != null) {
                selection = new DXTickStream[]{ stream };
            }
        }

        if (selection == null) {
            session.sendMessage(new TextMessage("Streams is not defined", true));
            return;
        }

        Instant from = null;
        list = params.get("from");
        if (list != null)
            from = Instant.parse(list.get(0));

        Instant to = null;
        list = params.get("to");
        if (list != null)
            to = Instant.parse(list.get(0));

        HashSet<IdentityKey> instruments = null;
        list = params.get("symbols");
        if (list != null) {
            instruments = new HashSet<>();

            ArrayList<String> symbols = new ArrayList<String>();
            for (String next : list) {
                if (next.contains(","))
                    symbols.addAll(Arrays.asList(next.split(",")));
                else
                    symbols.add(next);
            }

            //String[] symbols = list.toArray(new String[list.size()]);

            for (DXTickStream stream : selection)
                Collections.addAll(instruments, match(stream, symbols));
        }

        ArrayList<String> types = null;
        list = params.get("types");

        if (list != null) {
             types = new ArrayList<String>();
             for (String next : list) {
                if (next.contains(","))
                    types.addAll(Arrays.asList(next.split(",")));
                else
                    types.add(next);
            }
        }

        boolean live = params.get("live") != null;

        Interval depth = null;
        list = params.get("depth");

        if (list != null && list.size() > 0)
            depth = Interval.valueOf(list.get(0));

        long fromTimestamp = Long.MIN_VALUE;

        if (from == null) {
            if (depth != null)
                fromTimestamp = (to == null ? TimebaseServiceImpl.getEndTime(selection) : to.toEpochMilli()) - depth.toMilliseconds();
        } else {
            fromTimestamp = from != null ? from.toEpochMilli() : Long.MIN_VALUE;
        }

        String[] selectedTypes = types != null ? types.toArray(new String[types.size()]) : null;

        TickCursor cursor = timebase.getConnection().select(
                fromTimestamp,
                new SelectionOptions(true, live),
                selectedTypes,
                collect(instruments, live),
                selection);

        long toTimestamp = to != null ? to.toEpochMilli() : Long.MAX_VALUE;

        LOGGER.log(LogLevel.INFO, " WS CURSOR [" + cursor.hashCode() + "]: SELECT " + (live ? "live " : "") + " * FROM " + Arrays.toString(selection) + " WHERE " +
                "TYPES = [" + Arrays.toString(selectedTypes) + "] AND ENTITIES = [" + Arrays.toString(collect(instruments, live)) + "] AND timestamp <= " + toTimestamp );

        PumpTask pumpTask = new PumpTask (selection, cursor, toTimestamp, live, session, executor);
        onCreate(session, pumpTask);
        cursor.setAvailabilityListener(pumpTask.avlnr);
        pumpTask.submit();
    }

    private void        onCreate(WebSocketSession session, PumpTask pumpTask) {
        synchronized (map) {
            map.put(session.getId(), pumpTask);
        }
    }

    private void        onClose(WebSocketSession session) {
        TickCursor cursor = null;
        synchronized (map) {
            PumpTask task = map.get(session.getId(), null);
            if (task != null) {
                cursor = task.cursor;
            }
            map.remove(session.getId());
        }
        Util.close(cursor);
    }

    @Override
    public void handleMessage(WebSocketSession session, WebSocketMessage<?> message) throws Exception {
        super.handleMessage(session, message);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        if (message != null && message.getPayloadLength() != 0) {
            try {
                WSMessage wsMessage = gson.fromJson(message.getPayload(), WSMessage.class);
                if (wsMessage.messageType == MessageType.SUBSCRIBE) {
                    SubscribeMessage subscribeMessage = (SubscribeMessage) wsMessage;
                    PumpTask task = map.get(session.getId(), null);
                    if (task == null) {
                        LOGGER.error("Task for session %s is null.").with(session.getId());
                        return;
                    }
                    final TickCursor cursor = task.cursor;
                    if (cursor == null) {
                        LOGGER.error("Cursor for session %s is null.").with(session.getId());
                        return;
                    }
                    changeSubscription(subscribeMessage, cursor, task);
                } else if (wsMessage.messageType == MessageType.SET_SUBSCRIPTION) {
                    SetSubscriptionMessage setSubscriptionMessage = (SetSubscriptionMessage) wsMessage;
                    PumpTask task = map.get(session.getId(), null);
                    if (task == null) {
                        LOGGER.error("Task for session %s is null.").with(session.getId());
                        return;
                    }
                    final TickCursor cursor = task.cursor;
                    if (cursor == null) {
                        LOGGER.error("Cursor for session %s is null.").with(session.getId());
                        return;
                    }
                    changeSubscription(setSubscriptionMessage, cursor, task);
                }
            } catch (JsonParseException | IllegalStateException exc) {
                LOGGER.error().append("unknown message format: ")
                        .append(message.getPayload())
                        .append('\n')
                        .append(exc)
                        .commit();
            }
            return;
        }
        super.handleTextMessage(session, message);
    }

    private void changeSubscription(SubscribeMessage subscribeMessage, TickCursor cursor, PumpTask task) {
        synchronized (object) {
            task.buffer.clear();

            // working with symbols
            if (subscribeMessage.symbols != null) {
                if (subscribeMessage.symbols.subscribeToAll) {
                    cursor.subscribeToAllEntities();
                } else if (!subscribeMessage.symbols.isEmpty()) {
                    if (subscribeMessage.symbols.add != null && !subscribeMessage.symbols.add.isEmpty()) {
                        HashSet<IdentityKey> instruments = new HashSet<>();
                        for (DXTickStream stream : task.selection)
                            Collections.addAll(instruments, match(stream, subscribeMessage.symbols.add));
                        cursor.addEntities(toArray(instruments), 0, instruments.size());
                    }
                    if (subscribeMessage.symbols.remove != null && !subscribeMessage.symbols.remove.isEmpty()) {
                        HashSet<IdentityKey> instruments = new HashSet<>();
                        for (DXTickStream stream : task.selection)
                            Collections.addAll(instruments, match(stream, subscribeMessage.symbols.remove));
                        cursor.removeEntities(toArray(instruments), 0, instruments.size());
                    }
                }
            }

            // working with types
            if (subscribeMessage.types != null) {
                if (subscribeMessage.types.subscribeToAll) {
                    cursor.subscribeToAllTypes();
                } else if (!subscribeMessage.types.isEmpty()) {
                    if (subscribeMessage.types.add != null && !subscribeMessage.types.add.isEmpty()) {
                        cursor.addTypes(subscribeMessage.types.add.toArray(new String[]{}));
                    }
                    if (subscribeMessage.types.remove != null && !subscribeMessage.types.remove.isEmpty()) {
                        cursor.removeTypes(subscribeMessage.types.remove.toArray(new String[]{}));
                    }
                }
            }

            // working with from timestamp
            Instant instant = subscribeMessage.from;
            if (instant != null) {
                long timestamp = subscribeMessage.from.toEpochMilli();
                if (timestamp != Long.MIN_VALUE) {
                    cursor.reset(timestamp);
                }
            }
        }
        LOGGER.info().append("Changed subscription: ").append(subscribeMessage.toString()).commit();
    }

    private void changeSubscription(SetSubscriptionMessage setSubscriptionMessage, TickCursor cursor, PumpTask task) {
        synchronized (object) {
            task.buffer.clear();

            if (setSubscriptionMessage.types != null && !setSubscriptionMessage.types.isEmpty()) {
                cursor.setTypes(setSubscriptionMessage.types.toArray(new String[]{}));
            } else {
                cursor.subscribeToAllTypes();
            }

            if (setSubscriptionMessage.symbols != null && !setSubscriptionMessage.symbols.isEmpty()) {
                HashSet<IdentityKey> instruments = new HashSet<>();
                for (DXTickStream stream : task.selection)
                    Collections.addAll(instruments, match(stream, setSubscriptionMessage.symbols));
                cursor.clearAllEntities();
                cursor.addEntities(toArray(instruments), 0, instruments.size());
            } else {
                cursor.subscribeToAllEntities();
            }

            Instant instant = setSubscriptionMessage.from;
            if (instant != null) {
                long timestamp = instant.toEpochMilli();
                if (timestamp != Long.MIN_VALUE) {
                    cursor.reset(timestamp);
                }
            }
        }
        LOGGER.info().append("Changed subscription: ").append(setSubscriptionMessage.toString()).commit();
    }

    @Override
    protected void handlePongMessage(WebSocketSession session, PongMessage message) throws Exception {
        super.handlePongMessage(session, message);
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        super.handleTransportError(session, exception);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        onClose(session);
        super.afterConnectionClosed(session, status);
    }

    @Override
    public boolean supportsPartialMessages() {
        return true;
    }
}
