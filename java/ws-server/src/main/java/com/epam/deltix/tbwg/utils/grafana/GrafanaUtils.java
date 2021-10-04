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
package com.epam.deltix.tbwg.utils.grafana;


import com.epam.deltix.qsrv.hf.pub.md.*;
import com.epam.deltix.qsrv.hf.tickdb.pub.DXTickDB;
import com.epam.deltix.qsrv.hf.tickdb.pub.DXTickStream;
import com.epam.deltix.timebase.messages.IdentityKey;
import com.epam.deltix.tbwg.model.grafana.TimeSeriesEntry;
import com.epam.deltix.grafana.data.MapBasedDataFrame;
import com.epam.deltix.grafana.model.DataFrame;
import com.epam.deltix.grafana.model.fields.Column;
import com.epam.deltix.grafana.model.fields.Field;
import com.epam.deltix.grafana.model.fields.FieldType;
import com.epam.deltix.grafana.model.fields.MutableField;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

public class GrafanaUtils {

    private static final Pattern LIST_STREAMS = Pattern.compile("\\W*list\\W+streams\\W*");
    private static final Pattern LIST_SYMBOLS = Pattern.compile("\\W*list\\W+symbols\\W*from\\W*(?<stream>([\\w-_]+)|(\"[\\w_-]+\"))\\W*");

    private static final MutableField STREAM_FIELD = new MutableField("stream", FieldType.STRING);
    private static final MutableField SYMBOL_FIELD = new MutableField("symbol", FieldType.STRING);

    public static List<TimeSeriesEntry> convert(DataFrame dataFrame) {
        Column timestamp = dataFrame.getFields().stream()
                .filter(column -> column.name().equalsIgnoreCase("timestamp"))
                .findFirst().orElse(null);
        if (timestamp == null) {
            return Collections.emptyList();
        }
        return dataFrame.getFields().stream()
                .filter(column -> !column.name().equalsIgnoreCase("timestamp"))
                .map(column -> {
                    TimeSeriesEntry entry = new TimeSeriesEntry(column.name());
                    for (int i = 0; i < column.values().size(); i++) {
                        entry.datapoints.add(new Object[]{column.values().get(i), timestamp.values().get(i)});
                    }
                    return entry;
                })
                .collect(Collectors.toList());
    }

    public static List<Field> convert(ClassSet<?> classSet) {
        List<Field> result = Arrays.stream(classSet.getContentClasses()).filter(c -> c instanceof RecordClassDescriptor)
                .map(c -> (RecordClassDescriptor) c)
                .flatMap(rcd -> Arrays.stream(rcd.getFields()))
                .map(GrafanaUtils::convert)
                .collect(Collectors.toList());
        result.add(new MutableField("symbol", FieldType.STRING));
        return result;
    }

    public static List<Field> convert(DataField[] fields) {
        List<Field> result = new ArrayList<>(fields.length);
        for (DataField field : fields) {
            result.add(convert(field));
        }
        return result;
    }

    public static Field convert(DataField field) {
        MutableField resultField = new MutableField();
        resultField.setName(field.getName());
        if (field.getType() instanceof IntegerDataType) {
            resultField.setFieldType(FieldType.NUMBER);
            resultField.config().setDecimals(0.);
        } else if (field.getType() instanceof FloatDataType) {
            resultField.setFieldType(FieldType.NUMBER);
            resultField.config().setDecimals(5.);
        } else if (field.getType() instanceof VarcharDataType) {
            resultField.setFieldType(FieldType.STRING);
        } else if (field.getType() instanceof DateTimeDataType) {
            resultField.setFieldType(FieldType.TIME);
        } else if (field.getType() instanceof BooleanDataType) {
            resultField.setFieldType(FieldType.BOOLEAN);
        } else {
            resultField.setFieldType(FieldType.OTHER);
        }
        return resultField;
    }

    public static boolean isListStreams(String query) {
        return LIST_STREAMS.matcher(query).matches();
    }

    public static String isListSymbols(String query) {
        Matcher matcher = LIST_SYMBOLS.matcher(query);
        return matcher.matches() ? matcher.group("stream"): null;
    }

    public static DataFrame listStreams(String refId, DXTickDB db) {
        MapBasedDataFrame dataFrame = new MapBasedDataFrame(refId, Collections.singletonList(STREAM_FIELD), false);
        Map<String, Object> map = new HashMap<>();
        Arrays.stream(db.listStreams()).map(DXTickStream::getKey).sorted().forEach(key -> {
            map.put("stream", key);
            dataFrame.append(map);
        });
        return dataFrame;
    }

    public static DataFrame listSymbols(String refId, DXTickStream stream) {
        MapBasedDataFrame dataFrame = new MapBasedDataFrame(refId, Collections.singletonList(SYMBOL_FIELD), false);
        Map<String, Object> map = new HashMap<>();
        Arrays.stream(stream.listEntities()).map(IdentityKey::getSymbol).sorted().forEach(symbol -> {
            map.put("symbol", symbol);
            dataFrame.append(map);
        });
        return dataFrame;
    }

}
