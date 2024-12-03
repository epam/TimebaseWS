/*
 * Copyright 2024 EPAM Systems, Inc
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
package com.epam.deltix.tbwg.webapp.services.view.md.repository;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.qsrv.hf.pub.RawMessage;
import com.epam.deltix.qsrv.hf.pub.md.Introspector;
import com.epam.deltix.qsrv.hf.pub.md.RecordClassDescriptor;
import com.epam.deltix.qsrv.hf.pub.md.RecordClassSet;
import com.epam.deltix.qsrv.hf.tickdb.pub.*;
import com.epam.deltix.qsrv.hf.tickdb.pub.lock.DBLock;
import com.epam.deltix.qsrv.hf.tickdb.pub.lock.LockType;
import com.epam.deltix.qsrv.hf.tickdb.pub.task.SchemaChangeTask;
import com.epam.deltix.qsrv.hf.tickdb.schema.*;
import com.epam.deltix.tbwg.messages.ViewMetadataMessage;
import com.epam.deltix.tbwg.webapp.services.view.ViewService;

import java.util.Arrays;
import java.util.Map;

public class ViewsStreamUtils {

    private static final Log LOGGER = LogFactory.getLog(ViewsStreamUtils.class);

    public static final String VIEWS_STREAM_NAME = "views#";

    public static final String LEGACY_VIEW_METADATA_MESSAGE = "deltix.tbwg.messages.QueryViewMdMessage";

    public static DXTickStream getViewsStream(DXTickDB db) {
        RecordClassSet targetSchema = getViewsStreamSchema();
        DXTickStream stream = db.getStream(VIEWS_STREAM_NAME);
        if (stream == null) {
            DXTickStream migrationStream = getMigrationStream(db);
            if (migrationStream != null) {
                LOGGER.info().append("Unfinished views# stream migration detected. Finishing migration...").commit();
                return finishMigration(migrationStream);
            }

            return createViewsStream(db, targetSchema);
        }

        return migrateIfNeed(stream, targetSchema);
    }

    private static DXTickStream getMigrationStream(DXTickDB db) {
        return Arrays.stream(db.listStreams())
            .filter(s -> s.getKey().startsWith(VIEWS_STREAM_NAME + "migration"))
            .findFirst().orElse(null);
    }

    private static DXTickStream migrateIfNeed(DXTickStream stream, RecordClassSet targetSchema) {
        DBLock lock = stream.tryLock(LockType.WRITE, 5000);
        try {
            if (isMigrationRequired(stream)) {
                LOGGER.info().append("Stream ").append(stream.getKey()).append(" requires data migration.").commit();
                return migrate(stream, targetSchema);
            } else {
                return updateSchemaIfNeed(stream, targetSchema);
            }
        } finally {
            lock.release();
        }
    }

    private static boolean isMigrationRequired(DXTickStream stream) {
        return stream.getStreamOptions().getMetaData().getClassDescriptor(LEGACY_VIEW_METADATA_MESSAGE) != null
            || stream.getStreamOptions().unique;
    }

    private static DXTickStream migrate(DXTickStream legacyStream, RecordClassSet targetSchema) {
        long ts = System.currentTimeMillis();
        DXTickStream migrationStream = createStream(
            legacyStream.getDB(), VIEWS_STREAM_NAME + "migration" + ts + "#",
            "Views Metadata migration stream", false,
            targetSchema
        );
        copyAndConvertData(legacyStream, migrationStream);

        renameStream(legacyStream,
            VIEWS_STREAM_NAME + "backup" + ts + "#",
            "Views Metadata legacy stream backup"
        );
        return finishMigration(migrationStream);
    }

    private static DXTickStream finishMigration(DXTickStream migrationStream) {
        renameStream(migrationStream, VIEWS_STREAM_NAME, "Views Metadata stream");
        LOGGER.info().append("Stream ").append(migrationStream.getKey()).append(" data migrated successfully.").commit();
        return migrationStream;
    }

    private static void renameStream(DXTickStream stream, String name, String description) {
        String key = stream.getKey();
        stream.rename(name);
        stream.setName(name);
        stream.setDescription(description);

        LOGGER.info().append("Stream ").append(key).append(" renamed to ").append(stream.getKey()).commit();
    }

    private static DXTickStream updateSchemaIfNeed(DXTickStream stream, RecordClassSet targetSchema) {
        RecordClassSet streamSchema = stream.getStreamOptions().getMetaData();
        StreamMetaDataChange change = new SchemaAnalyzer(new SchemaMapping()).getChanges(
            streamSchema,
            MetaDataChange.ContentType.Polymorphic,
            targetSchema,
            MetaDataChange.ContentType.Polymorphic
        );

        if (change.getChangeImpact() != SchemaChange.Impact.None) {
            LOGGER.info().append("Stream ").append(stream.getKey()).append(" requires schema update.").commit();
            stream.execute(new SchemaChangeTask(change));
            BackgroundProcessInfo process;
            while ((process = stream.getBackgroundProcess()) != null && !process.isFinished()) {
                try {
                    Thread.sleep(100);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }
            LOGGER.info().append("Schema changes successfully applied to stream ").append(stream.getKey()).commit();
        }

        return stream;
    }

    private static DXTickStream createViewsStream(DXTickDB db, RecordClassSet schema) {
        return createStream(db, VIEWS_STREAM_NAME, "Views Metadata", false, schema);
    }

    private static DXTickStream createStream(DXTickDB db, String key, String description,
                                             boolean unique, RecordClassSet schema) {
        StreamOptions options = new StreamOptions(
            StreamScope.DURABLE, key, description, 1
        );
        options.unique = unique;
        options.version = "5";
        options.setMetaData(true, schema);
        DXTickStream stream = db.createStream(key, options);
        LOGGER.info().append("Stream ").append(stream.getKey()).append(" created.").commit();
        return stream;
    }

    private static void copyAndConvertData(DXTickStream legacyStream, DXTickStream migrationStream) {
        SelectionOptions selectionOptions = new SelectionOptions(true, false);
        selectionOptions.rebroadcast = true;
        selectionOptions.allowLateOutOfOrder = true;
        try (TickCursor cursor = legacyStream.select(Long.MIN_VALUE, selectionOptions);
             TickLoader loader = migrationStream.createLoader(LoadingOptions.withRewriteMode(true))) {

            loader.addEventListener((e) -> {
                LOGGER.warn().append("Failed to migrate view message: ").append(e.getMessage()).commit();
            });

            RawMessage outMessage = new RawMessage();
            outMessage.type = (RecordClassDescriptor) migrationStream.getStreamOptions().getMetaData()
                .getClassDescriptor(ViewMetadataMessage.CLASS_NAME);

            int count = 0;
            while (cursor.next()) {
                RawMessage legacyMessage = (RawMessage) cursor.getMessage();
                if (legacyMessage.getSymbol() != null && legacyMessage.getSymbol().length() > 0) {
                    loader.send(
                        migrateMessage(legacyMessage, outMessage)
                    );
                    ++count;
                }

            }

            LOGGER.info().append("Migrated ").append(count)
                .append(" messages from ").append(legacyStream.getKey())
                .append(" into ").append(migrationStream.getKey())
                .commit();
        }
    }

    private static RawMessage migrateMessage(RawMessage legacyMessage, RawMessage outMessage) {
        RawMessageHelper rawMessageHelper = new RawMessageHelper();
        Map<String, Object> messageValues = rawMessageHelper.getValues(legacyMessage);

        messageValues.put("output", messageValues.get("stream"));
        messageValues.put("statusMessage", messageValues.get("info"));

        Object state = messageValues.get("state");
        if (state instanceof String && "IDLING".equalsIgnoreCase((String) state)) {
            messageValues.put("state", "IDLE");
        }

        messageValues.putIfAbsent("autoRestart", Boolean.FALSE);
        messageValues.putIfAbsent("live", Boolean.FALSE);
        messageValues.putIfAbsent("query", "");
        messageValues.putIfAbsent("queryType", "QQL");
        messageValues.putIfAbsent("output", ViewService.getStreamName(legacyMessage.getSymbol().toString()));
        messageValues.putIfAbsent("outputType", "STREAM");
        messageValues.putIfAbsent("state", "COMPLETED");

        rawMessageHelper.setValues(outMessage, messageValues);
        outMessage.setNanoTime(legacyMessage.getNanoTime());
        outMessage.setSymbol(legacyMessage.getSymbol());
        //outMessage.setInstrumentType(legacyMessage.getInstrumentType());

        return outMessage;
    }

    private static RecordClassSet getViewsStreamSchema() {
        return new RecordClassSet(introspectClasses(ViewMetadataMessage.class));
    }

    private static RecordClassDescriptor[] introspectClasses(Class<?>... classes) {
        try {
            Introspector ix = Introspector.createEmptyMessageIntrospector();
            RecordClassDescriptor[] rcds = new RecordClassDescriptor[classes.length];
            for (int i = 0; i < classes.length; ++i) {
                rcds[i] = ix.introspectRecordClass(classes[i]);
            }
            return rcds;
        } catch (Throwable t) {
            throw new RuntimeException(t);
        }
    }


}