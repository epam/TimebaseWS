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
package com.epam.deltix.tbwg.webapp.utils;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.qsrv.hf.pub.md.*;
import com.epam.deltix.qsrv.hf.stream.MessageWriter2;
import com.epam.deltix.qsrv.hf.tickdb.pub.*;
import com.epam.deltix.tbwg.messages.BarMessage;
import com.epam.deltix.tbwg.webapp.model.charting.ChartType;
import com.epam.deltix.tbwg.webapp.model.charting.ChartTypeDef;
import com.epam.deltix.tbwg.webapp.services.timebase.TimebaseService;

import com.epam.deltix.qsrv.hf.pub.md.RecordClassDescriptor;
import com.epam.deltix.timebase.messages.IdentityKey;
import com.epam.deltix.timebase.messages.universal.PackageHeader;
import com.epam.deltix.util.lang.Util;
import com.epam.deltix.util.time.Interval;

import java.io.IOException;
import java.io.OutputStream;
import java.util.*;
import java.util.concurrent.Future;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import java.util.zip.GZIPOutputStream;

import static com.epam.deltix.tbwg.webapp.utils.TimeBaseUtils.introspectClasses;

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

//    public static InstrumentIdentity[] collect(HashSet<InstrumentIdentity> instruments) {
//        if (instruments != null)
//            return instruments.toArray(new InstrumentIdentity[instruments.size()]);
//
//        return null;
//    }

    public static String[] collect(HashSet<String> instruments, boolean live) {
        if (instruments != null)
            return instruments.toArray(new String[instruments.size()]);

        return live ? new String[0]: null;
    }

    public static IdentityKey[] collect(HashSet<IdentityKey> instruments) {
        if (instruments != null)
            return instruments.toArray(new IdentityKey[instruments.size()]);

        return null;
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

    public static ChartTypeDef[] chartTypes(DXTickStream stream) {
        Set<ChartTypeDef> chartTypes = new LinkedHashSet<>();

        RecordClassDescriptor[] descriptors = stream.getStreamOptions().getMetaData().getContentClasses();

        if (mayContainSubclasses(descriptors, PackageHeader.class) ||
                mayContainSubclasses(descriptors, "com.epam.deltix.timebase.messages.universal.PackageHeader")) {
            chartTypes.add(new ChartTypeDef(ChartType.PRICES_L2));
            chartTypes.add(new ChartTypeDef(ChartType.TRADES_BBO));
            chartTypes.add(new ChartTypeDef(ChartType.BARS, "BARS (mid-price)"));
            chartTypes.add(new ChartTypeDef(ChartType.BARS_ASK, "BARS (ask)"));
            chartTypes.add(new ChartTypeDef(ChartType.BARS_BID, "BARS (bid)"));
        } else if (mayContainSubclasses(descriptors, BarMessage.class) ||
                mayContainSubclasses(descriptors, "com.epam.deltix.timebase.messages.BarMessage")) {
            chartTypes.add(new ChartTypeDef(ChartType.BARS));
        }

        return chartTypes.toArray(new ChartTypeDef[0]);
    }

//    static boolean mayContainSubclasses(RecordClassDescriptor[] descriptors, Class <?> cls) {
//        return mayContainSubclasses(descriptors, cls.getName());
//    }
//
//    static boolean mayContainSubclasses(RecordClassDescriptor[] descriptors, String javaClassName) {
//        for (RecordClassDescriptor rcd : descriptors)
//            if (rcd.isConvertibleTo (javaClassName))
//                return (true);
//
//        return (false);
//    }

    public static DXTickStream getOrCreateStream(DXTickDB db, String key, Class<?>... classes) {
        DXTickStream stream = db.getStream(key);
        if (stream == null) {
            LOG.info().append("Stream ").append(key).append(" not found.").commit();
            LOG.info("Creating new stream.");
            StreamOptions options = new StreamOptions(StreamScope.DURABLE, key, "Snapshots stream", 1);
            options.setPolymorphic(introspectClasses(classes));
            stream = db.createStream(key, options);
            LOG.info().append("Stream ").append(key).append(" created.").commit();
        } else {
            LOG.info("Found stream: " + key);
        }
        return stream;
    }

    public static String getClassName(Class<?> cls) {
        return ClassDescriptor.getClassNameWithAssembly(cls);
    }

    public static boolean mayContainSubclasses(RecordClassDescriptor[] descriptors, Class<?> cls) {
        return mayContainSubclasses(descriptors, getClassName(cls));
    }

    public static boolean mayContainSubclasses(RecordClassDescriptor[] descriptors, String className) {
        return getConvertible(descriptors, className).size() > 0;
    }

    public static List<RecordClassDescriptor> getConvertible(RecordClassDescriptor[] descriptors, String className) {
        List<RecordClassDescriptor> convertible = new ArrayList<>();
        for (int j = 0; j < descriptors.length; ++j) {
            RecordClassDescriptor descriptor = descriptors[j];
            if (descriptor.isConvertibleTo(className)) {
                convertible.add(descriptor);
            }
        }

        return convertible;
    }

    public static RecordClassDescriptor[] getLinearChartDescriptors(RecordClassDescriptor[] descriptors) {
        List<RecordClassDescriptor> result = new ArrayList<>();
        for (int i = 0; i < descriptors.length; ++i) {
            RecordClassDescriptor descriptor = descriptors[i];
            if (getLinearFields(descriptor).size() > 0) {
                result.add(descriptor);
            }
        }

        return result.toArray(new RecordClassDescriptor[0]);
    }

    public static boolean hasLinearChartDescriptors(RecordClassDescriptor[] descriptors) {
        for (int i = 0; i < descriptors.length; ++i) {
            RecordClassDescriptor descriptor = descriptors[i];
            if (getLinearFields(descriptor).size() > 0) {
                return true;
            }
        }

        return false;
    }

    public static String[] getLinearChartColumns(RecordClassDescriptor[] descriptors) {
        Set<String> columns = new LinkedHashSet<>();
        for (int i = 0; i < descriptors.length; ++i) {
            getLinearFields(descriptors[i]).forEach(f -> {
                columns.add(f.getName());
            });
        }

        return columns.toArray(new String[0]);
    }

    public static DXTickStream getStream(TimebaseService tb, String stream) {
        if (tb != null && !TextUtils.isEmpty(stream)) {
            DXTickDB connection = tb.getConnection();
            return connection.getStream(stream);
        }
        return null;
    }

    private static List<DataField> getLinearFields(RecordClassDescriptor descriptor) {
        if (descriptor == null || descriptor.getName() == null) {
            return new ArrayList<>();
        }

        List<DataField> fields = Arrays.stream(descriptor.getFields())
            .filter(TBWGUtils::isNumericField).collect(Collectors.toList());

        if (descriptor.getParent() == null) {
            return fields;
        } else {
            List<DataField> parentFields = getLinearFields(descriptor.getParent());
            parentFields.addAll(fields);
            return parentFields;
        }
    }

    private static boolean isNumericField(DataField field) {
        if (field instanceof StaticDataField)
            return false;

        DataType type = field.getType();

        if (type instanceof FloatDataType)
            return true;

        if (type instanceof IntegerDataType) {
            if (field.getName().toLowerCase().contains("currency"))
                return false;

            return true;
        }

        return false;

    }
}
