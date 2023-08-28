/*
 * Copyright 2023 EPAM Systems, Inc
 *
 * See the NOTICE file distributed with this work for additional information
 * regarding copyright ownership. Licensed under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

package com.epam.deltix.tbwg.webapp.services.view.processor;

import com.epam.deltix.data.stream.IAMessageSourceMultiplexer;
import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.qsrv.hf.pub.*;
import com.epam.deltix.qsrv.hf.pub.codec.InterpretingCodecMetaFactory;
import com.epam.deltix.qsrv.hf.pub.codec.UnboundDecoder;
import com.epam.deltix.qsrv.hf.pub.md.RecordClassDescriptor;
import com.epam.deltix.qsrv.hf.pub.md.RecordClassSet;
import com.epam.deltix.qsrv.hf.tickdb.pub.*;
import com.epam.deltix.qsrv.hf.tickdb.pub.query.InstrumentMessageSource;
import com.epam.deltix.qsrv.hf.tickdb.schema.MetaDataChange;
import com.epam.deltix.qsrv.hf.tickdb.schema.SchemaAnalyzer;
import com.epam.deltix.qsrv.hf.tickdb.schema.SchemaConverter;
import com.epam.deltix.tbwg.webapp.services.timebase.TimebaseService;
import com.epam.deltix.tbwg.webapp.services.view.md.QueryViewMd;
import com.epam.deltix.tbwg.webapp.services.view.utils.Utils;
import com.epam.deltix.timebase.messages.InstrumentKey;
import com.epam.deltix.timebase.messages.InstrumentMessage;
import com.epam.deltix.timebase.messages.service.MetaDataChangeMessage;
import com.epam.deltix.timebase.messages.service.StreamTruncatedMessage;
import com.epam.deltix.util.concurrent.NextResult;
import com.epam.deltix.util.memory.MemoryDataInput;

import java.util.*;
import java.util.function.Function;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class QueryViewProcessingWorker extends ViewProcessingWorker {
    private static final Log LOGGER = LogFactory.getLog(QueryViewProcessingWorker.class);

    private final QueryViewMd viewMd;
    private final TimebaseService timebaseService;

    private volatile TimebaseChannel channel;
    private volatile StreamVersions versions;

    public QueryViewProcessingWorker(QueryViewMd viewMd, ViewProcessingListener stateListener, TimebaseService timebaseService) {
        super(viewMd, stateListener);
        this.viewMd = viewMd;
        this.timebaseService = timebaseService;
    }

    @Override
    public int doWork() {
        try {
            if (channel == null) {
                started();
                versions = new StreamVersions(timebaseService, viewMd);
                channel = new TimebaseChannel(timebaseService, viewMd, versions);
            }

            if (!active()) {
                return 0;
            }

            NextResult nextResult = channel.nextIfAvailable();
            if (nextResult == NextResult.OK) {
                RawMessage message = channel.getMessage();
                if (message != null) {
                    if (isSystemMessage(message)) {
                        String stream = channel.cursor.getCurrentStreamKey();
                        Long streamVersion = versions.version(stream);
                        Long messageVersion = versions.version(message);
                        if (streamVersion == null) {
                            LOGGER.info().append("Original stream ").append(stream).append(" version not found.").commit();
                        } else if (messageVersion == null) {
                            LOGGER.info().append("System message ").append(message).append(" version not found.").commit();
                        } else if (messageVersion > streamVersion) {
                            LOGGER.info().append("Original stream ").append(stream).append(" version updated. Restarting view.").commit();
                            restarted();
                            this.close();
                            return 0;
                        }
                    } else {
                        channel.send(message);
                        working(1, message.getTimeStampMs());
                    }
                }

                return 1;
            } else if (nextResult == NextResult.END_OF_CURSOR) {
                finished();
                this.close();
            } else if (nextResult == NextResult.UNAVAILABLE) {
                idling();
            }
        } catch (Throwable t) {
            if (closed) {
                LOGGER.info().append("Process task for view ").append(viewMd.getId()).append(" interrupted").commit();
            } else {
                finished(t);
            }

            this.close();
        }

        return 0;
    }

    private boolean isSystemMessage(RawMessage msg) {
        return isStreamTruncatedMessage(msg) || isMetaDataChangeMessage(msg);
    }

    private boolean isStreamTruncatedMessage(RawMessage msg) {
        return msg.type.getName().equals(StreamTruncatedMessage.class.getName());
    }

    private boolean isMetaDataChangeMessage(RawMessage msg) {
        return msg.type.getName().equals(MetaDataChangeMessage.class.getName());
    }

    @Override
    public void close() {
        super.close();
        if (channel != null) {
            channel.close();
        }
    }

    @Override
    public String toString() {
        return "QueryViewProcessingWorker{" +
            "id='" + viewMd.getId() + '\'' +
            "stream='" + streamKey + '\'' +
            ", query=" + viewMd.getQuery() +
            '}';
    }

    private static class TimebaseChannel {

        private final TimebaseService timebaseService;
        private final QueryViewMd viewMd;
        private final InstrumentMessageSource cursor;
        private final InstrumentMessageSource versionsCursor;
        private final IAMessageSourceMultiplexer<InstrumentMessage> mux;
        private final TickLoader loader;
        private final RecordClassDescriptor[] outTypes;
        private final SchemaAnalyzer analyzer;

        private final HashMap<RecordClassDescriptor, Function<RawMessage, RawMessage>> converters = new HashMap<>();

        private TimebaseChannel(TimebaseService timebaseService, QueryViewMd viewMd, StreamVersions streamVersions) {
            this.timebaseService = timebaseService;
            this.viewMd = viewMd;

            RecordClassDescriptor[] inTypes = Utils.getQuerySchema(timebaseService.getConnection(), viewMd.getQuery());
            DXTickStream stream = getStream(viewMd.getStream(), inTypes, viewMd.getLastTimestamp());
            outTypes = stream.getTypes();
            analyzer = Utils.createSchemaAnalyzer(inTypes, outTypes);
            cursor = executeQuery(viewMd);
            versionsCursor = subscribeSystemMessages(
                streamVersions.streams().stream()
                    .map(s -> timebaseService.getConnection().getStream(s)).filter(Objects::nonNull)
                    .toArray(DXTickStream[]::new)
            );

            loader = stream.createLoader(new LoadingOptions(true));

            mux = new IAMessageSourceMultiplexer<>();
            mux.setLive(viewMd.isLive());
            mux.setAvailabilityListener(() -> {});
            mux.add(cursor);
            if (versionsCursor != null) {
                mux.add(versionsCursor);
            }
        }

        public NextResult nextIfAvailable() {
            return mux.nextIfAvailable();
        }

        public RawMessage getMessage() {
            InstrumentMessage message = mux.getMessage();
            if (message instanceof RawMessage) {
                RawMessage rawMessage = (RawMessage) message;
                if (rawMessage.type.getName().equals(StreamTruncatedMessage.class.getName())) {
                    return rawMessage;
                } else if (rawMessage.type.getName().equals(MetaDataChangeMessage.class.getName())) {
                    return rawMessage;
                }

                Function<RawMessage, RawMessage> converter = getOrCreateConverter(rawMessage);
                if (converter != null) {
                    return converter.apply(rawMessage);
                }
            }

            return null;
        }

        public void send(RawMessage message) {
            loader.send(message);
        }

        public void close() {
            closeCursor();
            closeLoader();
        }

        private void closeCursor() {
            try {
                if (cursor != null) {
                    cursor.close();
                }
            } catch (Throwable t) {
                LOGGER.warn().append("Failed to close cursor of task ").append(this).commit();
            }

            try {
                if (versionsCursor != null) {
                    versionsCursor.close();
                }
            } catch (Throwable t) {
                LOGGER.warn().append("Failed to close versions cursor of task ").append(this).commit();
            }

            try {
                if (mux != null) {
                    mux.close();
                }
            } catch (Throwable t) {
                LOGGER.warn().append("Failed to close mux of task ").append(this).commit();
            }
        }

        private void closeLoader() {
            try {
                if (loader != null) {
                    loader.close();
                }
            } catch (Throwable t) {
                LOGGER.warn().append("Failed to close loader of task ").append(this).commit();
            }
        }

        private DXTickStream getStream(String streamKey, RecordClassDescriptor[] requiredTypes, long fromTime) {
            DXTickStream stream = timebaseService.getStream(streamKey);
            if (stream != null) {
                long[] streamRange = stream.getTimeRange();
                if (streamRange == null || fromTime <= streamRange[0]) {
                    stream.delete();
                } else {
                    if (!Utils.isStreamSchemaMatchesQuery(stream, requiredTypes)) {
                        throw new RuntimeException("Stream " + streamKey + " schema not compatible with query result: " + viewMd.getQuery());
                    } else {
                        return stream;
                    }
                }
            }

            return timebaseService.getOrCreateStream(streamKey, requiredTypes);
        }

        private InstrumentMessageSource executeQuery(QueryViewMd viewMd) {
            long startTime = viewMd.getLastTimestamp();
            SelectionOptions options = new SelectionOptions(true, viewMd.isLive());
            InstrumentMessageSource cursor;
            if (startTime != Long.MIN_VALUE) {
                cursor = timebaseService.getConnection().executeQuery(
                    viewMd.getQuery(), options, null, null, startTime
                );
            } else {
                cursor = timebaseService.getConnection().executeQuery(viewMd.getQuery(), options);
            }

            cursor.setAvailabilityListener(() -> {});
            return cursor;
        }

        private InstrumentMessageSource subscribeSystemMessages(DXTickStream[] streams) {
            if (streams.length > 0) {
                SelectionOptions options = new SelectionOptions(true, viewMd.isLive());
                options.versionTracking = true;
                options.allowLateOutOfOrder = true;
                InstrumentMessageSource cursor = timebaseService.getConnection().select(
                    viewMd.getLastTimestamp(), options, null, new String[] {"@SYSTEM"},
                    streams
                );
                cursor.setAvailabilityListener(() -> {});
                return cursor;
            }

            return null;
        }

        private Function<RawMessage, RawMessage> getOrCreateConverter(RawMessage message) {
            Function<RawMessage, RawMessage> converter = converters.get(message.type);
            if (converter == null) {
                RecordClassDescriptor descriptor = Utils.findType(outTypes, message.type);
                if (descriptor == null) {
                    return null;
                }

                MetaDataChange change = analyzer.getChanges(
                    new RecordClassSet(new RecordClassDescriptor[] { message.type }),
                    MetaDataChange.ContentType.Fixed,
                    new RecordClassSet(new RecordClassDescriptor[] { descriptor }),
                    MetaDataChange.ContentType.Fixed
                );

                SchemaConverter finalConverter = new SchemaConverter(change);
                converters.put(message.type, converter = finalConverter::convert);
            }

            return converter;
        }
    }

    private static class StreamVersions {
        private final Map<String, Long> streamToVersion = new HashMap<>();

        // (?i)from\s+(?:(?:reverse|live)\s*\()?\s*((\w+)|(\"[^\"]+\"))
        private final Pattern pattern = Pattern.compile("(?i)from\\s+(?:(?:reverse|live)\\s*\\()?\\s*((\\w+)|(\"[^\"]+\"))",
            Pattern.CASE_INSENSITIVE | Pattern.MULTILINE);

        private final UnboundDecoder truncateMsgDecoder =
            InterpretingCodecMetaFactory.INSTANCE.createFixedUnboundDecoderFactory(Messages.STREAM_TRUNCATED_MESSAGE_DESCRIPTOR).create();
        private final UnboundDecoder schemaMsgDecoder =
            InterpretingCodecMetaFactory.INSTANCE.createFixedUnboundDecoderFactory(Messages.META_DATA_CHANGE_MESSAGE_DESCRIPTOR).create();
        private final MemoryDataInput buffer = new MemoryDataInput();

        public StreamVersions(TimebaseService timebaseService, QueryViewMd viewMd) {
            List<String> streams = matchStreams(viewMd.getQuery());
            for (String streamKey : streams) {
                DXTickStream stream = timebaseService.getStream(streamKey);
                if (stream != null) {
                    stream.enableVersioning();
                    streamToVersion.put(streamKey, stream.getDataVersion());
                }
            }
        }

        public Long version(String stream) {
            return streamToVersion.get(stream);
        }

        public Long version(RawMessage msg) {
            try {
                buffer.setBytes(msg.data, msg.offset, msg.length);
                truncateMsgDecoder.beginRead(buffer);
                truncateMsgDecoder.nextField();
                return truncateMsgDecoder.getLong();
            } catch (Throwable t) {
                return null;
            }
        }

        public List<String> streams() {
            return new ArrayList<>(streamToVersion.keySet());
        }

        private List<String> matchStreams(String query) {
            List<String> streams = new ArrayList<>();
            Matcher matcher = pattern.matcher(query);
            while (matcher.find()) {
                String stream = matcher.group(1);
                if (stream != null) {
                    streams.add(
                        stream.replaceAll("^\"|\"$", "") // remove quotes if has
                    );
                }
            }

            return streams;
        }
    }

}
