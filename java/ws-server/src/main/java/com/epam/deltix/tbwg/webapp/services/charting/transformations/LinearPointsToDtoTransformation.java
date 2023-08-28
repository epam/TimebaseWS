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
package com.epam.deltix.tbwg.webapp.services.charting.transformations;

import com.epam.deltix.dfp.Decimal64Utils;
import com.epam.deltix.qsrv.hf.pub.RawMessage;
import com.epam.deltix.qsrv.hf.pub.ReadableValue;
import com.epam.deltix.qsrv.hf.pub.codec.CodecMetaFactory;
import com.epam.deltix.qsrv.hf.pub.codec.InterpretingCodecMetaFactory;
import com.epam.deltix.qsrv.hf.pub.codec.NonStaticFieldInfo;
import com.epam.deltix.qsrv.hf.pub.codec.UnboundDecoder;
import com.epam.deltix.qsrv.hf.pub.md.DataType;
import com.epam.deltix.qsrv.hf.pub.md.FloatDataType;
import com.epam.deltix.qsrv.hf.pub.md.IntegerDataType;
import com.epam.deltix.qsrv.hf.pub.md.RecordClassDescriptor;
import com.epam.deltix.tbwg.messages.Message;
import com.epam.deltix.tbwg.webapp.model.charting.line.LinePointDef;
import com.epam.deltix.tbwg.webapp.services.charting.ChartingService;
import com.epam.deltix.util.collections.generated.ObjectToObjectHashMap;
import com.epam.deltix.util.memory.MemoryDataInput;

import java.util.*;

public class LinearPointsToDtoTransformation extends AbstractChartTransformation<LinePointDef, RawMessage> {

    private final long startTime;
    private final long endTime;
    private final LinePointDef linePoint = new LinePointDef();
    private long lastTimestamp = Long.MIN_VALUE;

    private final RawColumnsReader reader = new RawColumnsReader();
    private final Map<String, Integer> columnToId = new HashMap<>();
    private final long[] lastValues;
    private final LineValue[] currentValues;
    private final PeriodicityFilter[] filters;

    private interface LineValue {
        void add(long value);
        long getAndClear();
    }

    private static class LastLineValue implements LineValue {
        private long value;

        @Override
        public void add(long value) {
            this.value = value;
        }

        @Override
        public long getAndClear() {
            long value = this.value;
            this.value = Decimal64Utils.NULL;
            return value;
        }
    }

    public LinearPointsToDtoTransformation(String[] columns, long startTime, long endTime, long periodicity) {
        super(Collections.singletonList(RawMessage.class), Collections.singletonList(LinePointDef.class));

        this.startTime = startTime;
        this.endTime = endTime;

        this.lastValues = new long[columns.length];
        this.currentValues = new LineValue[columns.length];
        this.filters = new PeriodicityFilter[columns.length];
        for (int i = 0; i < columns.length; ++i) {
            columnToId.put(columns[i], i);
            lastValues[i] = Decimal64Utils.NaN;
            currentValues[i] = new LastLineValue();
            filters[i] = new PeriodicityFilter(periodicity, true);
        }
    }

    @Override
    protected void onMessage(Message message) {
        sendMessage(message);
    }

    @Override
    protected void onNextPoint(RawMessage message) {
        long timestamp = message.getTimeStampMs();
        if (timestamp > endTime) {
            return;
        }

        if (reader.nextMessage(message)) {
            while (reader.nextColumn()) {
                Integer id = columnToId.get(reader.getColumnInfo().getName());
                if (id != null) {
                    LineValue lineValue = currentValues[id];
                    lineValue.add(reader.getDecimalValue());
                    if (filters[id].test(message)) {
                        long currentValue = lineValue.getAndClear();
                        if (currentValue != lastValues[id]) {
                            sendPoint(id, timestamp, currentValue);
                            lastValues[id] = currentValue;
                        }
                    }
                }
            }
        }
    }

    @Override
    protected void onComplete() {
        if (lastTimestamp != Long.MIN_VALUE && endTime < ChartingService.MAX_TIMESTAMP) {
            for (int i = 0; i < lastValues.length; ++i) {
                sendPoint(i, endTime, lastValues[i]);
            }
        }
    }

    private void sendPoint(int id, long timestamp, long value) {
        linePoint.lineId(id);
        linePoint.setTime(timestamp);
        linePoint.setValue(Decimal64Utils.toString(value));
        sendMessage(linePoint);

        lastTimestamp = timestamp;
    }

    private static class RawColumnsReader {
        private final CodecMetaFactory factory = InterpretingCodecMetaFactory.INSTANCE;
        private final MemoryDataInput input = new MemoryDataInput();
        private final ObjectToObjectHashMap<String, UnboundDecoder> decoders = new ObjectToObjectHashMap<>();

        private UnboundDecoder decoder;

        public boolean nextMessage(RawMessage message) {
            if (message.data == null) {
                return false;
            }

            decoder = getDecoder(message.type);
            input.setBytes(message.data, message.offset, message.length);
            decoder.beginRead(input);
            return true;
        }

        public boolean nextColumn() {
            return decoder.nextField();
        }

        public NonStaticFieldInfo getColumnInfo() {
            return decoder.getField();
        }

        public long getDecimalValue() {
            return readDecimal64(decoder.getField().getType(), decoder);
        }

        private UnboundDecoder getDecoder(final RecordClassDescriptor type) {
            String guid = type.getGuid();
            UnboundDecoder decoder = decoders.get(guid, null);

            if (decoder == null) {
                decoder = factory.createFixedUnboundDecoderFactory(type).create();
                decoders.put(guid, decoder);
            }
            return decoder;
        }

        private long readDecimal64(DataType type, ReadableValue rv) {
            if (rv.isNull()) {
                return Decimal64Utils.NaN;
            }

            if (type instanceof IntegerDataType) {
                return readInteger((IntegerDataType) type, rv);
            } else if (type instanceof FloatDataType) {
                return readFloat((FloatDataType) type, rv);
            }

            return Decimal64Utils.NaN;
        }

        private long readInteger(IntegerDataType type, ReadableValue rv) {
            int size = type.getNativeTypeSize();

            if (size >= 6) {
                return Decimal64Utils.fromLong(rv.getLong());
            } else if (size == 1) {
                return Decimal64Utils.fromInt((byte) rv.getInt());
            } else if (size == 2) {
                return Decimal64Utils.fromInt((short) rv.getInt());
            } else {
                return Decimal64Utils.fromInt(rv.getInt());
            }
        }

        private long readFloat(FloatDataType type, ReadableValue rv) {
            if (type.isDecimal64()) {
                return rv.getLong();
            }

            if (type.isFloat()) {
                return Decimal64Utils.fromDouble(rv.getFloat());
            } else {
                return Decimal64Utils.fromDouble(rv.getDouble());
            }
        }
    }
}
