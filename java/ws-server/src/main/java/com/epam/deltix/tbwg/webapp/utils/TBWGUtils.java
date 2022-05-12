/*
 * Copyright 2021 EPAM Systems, Inc
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
package com.epam.deltix.tbwg.webapp.utils;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.tbwg.webapp.model.charting.ChartType;
import com.epam.deltix.tbwg.webapp.services.timebase.TimebaseService;

import com.epam.deltix.qsrv.hf.pub.md.RecordClassDescriptor;
import com.epam.deltix.qsrv.hf.stream.MessageWriter2;
import com.epam.deltix.qsrv.hf.tickdb.pub.*;
import com.epam.deltix.timebase.messages.IdentityKey;
import com.epam.deltix.timebase.messages.universal.PackageHeader;
import com.epam.deltix.util.lang.Util;
import com.epam.deltix.util.time.Interval;

import java.io.IOException;
import java.io.OutputStream;
import java.util.*;
import java.util.concurrent.Future;
import java.util.stream.Stream;
import java.util.zip.GZIPOutputStream;

public class TBWGUtils {

    private static final Log LOG = LogFactory.getLog(TBWGUtils.class);

    public static IdentityKey[] match(DXTickStream stream, String... symbols) {
        if (symbols != null) {
            HashSet<String> set = new HashSet<>(Arrays.asList(symbols));

            // match entities
            IdentityKey[] entities = stream.listEntities();
            return Stream.of(entities).filter(x -> set.contains(x.getSymbol().toString())).toArray(IdentityKey[]::new);
        }

        return null;
    }

    public static String[]          match(DXTickStream stream, List<IdentityKey> ids) {
        if (ids != null) {
            HashSet<IdentityKey> set = new HashSet<>(ids);

            // match entities
            IdentityKey[] entities = stream.listEntities();
            return Stream.of(entities).filter(set::contains).map(IdentityKey::getSymbol).toArray(String[]::new);
        }

        return null;
    }

    public static String[]          match(DXTickStream stream, IdentityKey ... ids) {
        return match(stream, Arrays.asList(ids));
    }

    public static IdentityKey[]     matchSymbols(DXTickStream stream, List<String> symbols) {
        if (symbols != null) {
            HashSet<String> set = new HashSet<>(symbols);

            // match entities
            IdentityKey[] entities = stream.listEntities();
            return Stream.of(entities).filter(x -> set.contains(x.getSymbol().toString())).toArray(IdentityKey[]::new);
        }

        return null;
    }

    public static DXTickStream[]    match(TimebaseService tb, String... streams) {
        if (streams != null) {
            HashSet<String> set = new HashSet<>(Arrays.asList(streams));
            return Stream.of(tb.listStreams()).filter(x -> set.contains(x.getKey())).toArray(DXTickStream[]::new);
        }

        return null;
    }

    public static MessageWriter2 create(OutputStream os, Interval periodicity, RecordClassDescriptor... cds) throws IOException, ClassNotFoundException {
        os = new GZIPOutputStream(os, 1 << 16 / 2);
        try {
            MessageWriter2 wr = new MessageWriter2(os, periodicity, null, cds);
            os = null;
            return wr;
        } finally {
            Util.close(os);
        }
    }

    public static IdentityKey[] collect(HashSet<IdentityKey> instruments) {
        if (instruments != null)
            return instruments.toArray(new IdentityKey[instruments.size()]);

        return null;
    }

    public static String[] collect(HashSet<String> instruments, boolean live) {
        if (instruments != null)
            return instruments.toArray(new String[instruments.size()]);

        return live ? new String[0]: null;
    }

    public static int getIntProperty(String property, int def) {
        String value = System.getProperty(property);
        int result;
        if (value != null) {
            try {
                result = Integer.parseInt(value);
            } catch (NumberFormatException exc) {
                result = def;
            }
        } else {
            result = def;
        }
        return result;
    }

    public static void cancel(Future<?> future, boolean mayInterruptIfRunning) {
        try {
            future.cancel(mayInterruptIfRunning);
        } catch (Exception exc) {
            LOG.error().append("Exception while canceling Future: ").append(exc)
                    .commit();
        }
    }

    public static ChartType[] chartTypes(DXTickStream stream) {
        Set<ChartType> chartTypes = new LinkedHashSet<>();
//        if (mayContainBarMessages(stream))
//            chartTypes.add(ChartType.BARS);

        RecordClassDescriptor[] descriptors = stream.getStreamOptions().getMetaData().getContentClasses();

        if (mayContainSubclasses(descriptors, PackageHeader.class) ||
                mayContainSubclasses(descriptors, "deltix.timebase.api.messages.universal.PackageHeader")) {
            chartTypes.add(ChartType.PRICES_L2);
            chartTypes.add(ChartType.TRADES_BBO);
            chartTypes.add(ChartType.BARS);
        }

        return chartTypes.toArray(new ChartType[0]);
    }

    static boolean mayContainSubclasses(RecordClassDescriptor[] descriptors, Class <?> cls) {
        return mayContainSubclasses(descriptors, cls.getName());
    }

    static boolean mayContainSubclasses(RecordClassDescriptor[] descriptors, String javaClassName) {
        for (RecordClassDescriptor rcd : descriptors)
            if (rcd.isConvertibleTo (javaClassName))
                return (true);

        return (false);
    }

    public static DXTickStream getOrCreateStream(DXTickDB db, String key, Class<?>... classes) {
        DXTickStream stream = db.getStream(key);
        if (stream == null) {
            LOG.info().append("Stream ").append(key).append(" not found.").commit();
            LOG.info("Creating new stream.");
            StreamOptions options = new StreamOptions(StreamScope.DURABLE, key, "Snapshots stream", 1);
            options.setPolymorphic(TimeBaseUtils.introspectClasses(classes));
            stream = db.createStream(key, options);
            LOG.info().append("Stream ").append(key).append(" created.").commit();
        } else {
            LOG.info("Found stream: " + key);
        }
        return stream;
    }
}
