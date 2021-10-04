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
package com.epam.deltix.computations.data;

import com.epam.deltix.computations.data.base.Decoder;
import com.epam.deltix.computations.data.base.GenericValueInfo;
import com.epam.deltix.computations.data.base.complex.MutableBinaryValueInfo;
import com.epam.deltix.computations.data.base.numeric.*;
import com.epam.deltix.computations.data.base.text.MutableAlphanumericValueInfo;
import com.epam.deltix.computations.data.base.text.MutableCharValueInfo;
import com.epam.deltix.computations.data.base.time.MutableTimeOfDayValueInfo;
import com.epam.deltix.computations.data.base.time.MutableTimestampValueInfo;
import com.epam.deltix.computations.data.complex.MutableEnumValue;
import com.epam.deltix.computations.data.complex.MutableGenericObjectImpl;
import com.epam.deltix.computations.data.complex.MutableListValue;
import com.epam.deltix.computations.data.text.MutableCharSequenceValue;
import com.epam.deltix.qsrv.hf.pub.RawMessage;
import com.epam.deltix.qsrv.hf.pub.NullValueException;
import com.epam.deltix.qsrv.hf.pub.ReadableValue;
import com.epam.deltix.qsrv.hf.pub.codec.CodecMetaFactory;
import com.epam.deltix.qsrv.hf.pub.codec.CompiledCodecMetaFactory;
import com.epam.deltix.qsrv.hf.pub.codec.NonStaticFieldInfo;
import com.epam.deltix.qsrv.hf.pub.codec.UnboundDecoder;
import com.epam.deltix.qsrv.hf.pub.md.*;
import com.epam.deltix.util.collections.generated.ObjectToObjectHashMap;
import com.epam.deltix.util.memory.MemoryDataInput;
import com.epam.deltix.computations.data.base.MutableGenericRecord;
import com.epam.deltix.computations.data.base.MutableGenericValueInfo;

public class RawMessageDecoder implements Decoder<RawMessage> {

    private static final CodecMetaFactory CODEC_FACTORY = CompiledCodecMetaFactory.INSTANCE;

    private final MemoryDataInput input = new MemoryDataInput();
    private final ObjectToObjectHashMap<String, UnboundDecoder> decoders = new ObjectToObjectHashMap<>();
    private final MutableGenericValueFactory valueFactory = new MutableGenericValueFactory();

    private UnboundDecoder getDecoder(final RawMessage raw) {
        String guid = raw.type.getGuid();
        UnboundDecoder decoder = decoders.get(guid, null);

        if (decoder == null) {
            decoder = CODEC_FACTORY.createFixedUnboundDecoderFactory(raw.type).create();
            decoders.put(guid, decoder);
        }
        return decoder;
    }

    @Override
    public void decode(RawMessage raw, MutableGenericRecord record) {
        record.reuse();
        valueFactory.reuse();

        if (raw.data == null) {
            return;
        }

        record.setTimestamp(raw.getTimeStampMs());

        MutableCharSequenceValue symbolValue = valueFactory.charSequenceValue();
        symbolValue.set(raw.getSymbol());
        record.set("symbol", symbolValue);

        MutableCharSequenceValue typeValue = valueFactory.charSequenceValue();
        typeValue.set(raw.type.getName());
        record.set("$type", typeValue);

        final UnboundDecoder decoder = getDecoder(raw);
        input.setBytes(raw.data, raw.offset, raw.length);
        decoder.beginRead(input);


        while (decoder.nextField()) {
            try {
                NonStaticFieldInfo fieldInfo = decoder.getField();
                DataType dataType = fieldInfo.getType();
                record.set(fieldInfo.getName(), decode(decoder, dataType));
            } catch (NullValueException ignored) {
            }
        }
    }

    private GenericValueInfo decode(ReadableValue decoder, DataType dataType) {
        if (dataType instanceof IntegerDataType) {
            return decode(decoder, (IntegerDataType) dataType);
        } else if (dataType instanceof FloatDataType) {
            return decode(decoder, (FloatDataType) dataType);
        } else if (dataType instanceof BooleanDataType) {
            return decode(decoder, (BooleanDataType) dataType);
        } else if (dataType instanceof EnumDataType) {
            return decode(decoder, (EnumDataType) dataType);
        } else if (dataType instanceof DateTimeDataType) {
            return decode(decoder, (DateTimeDataType) dataType);
        } else if (dataType instanceof TimeOfDayDataType) {
            return decode(decoder, (TimeOfDayDataType) dataType);
        } else if (dataType instanceof CharDataType) {
            return decode(decoder, (CharDataType) dataType);
        } else if (dataType instanceof VarcharDataType) {
            return decode(decoder, (VarcharDataType) dataType);
        } else if (dataType instanceof ClassDataType) {
            return decode(decoder, (ClassDataType) dataType);
        } else if (dataType instanceof ArrayDataType) {
            return decode(decoder, (ArrayDataType) dataType);
        } else if (dataType instanceof BinaryDataType) {
            return decode(decoder, (BinaryDataType) dataType);
        } else {
            throw new UnsupportedOperationException();
        }
    }

    private GenericValueInfo decode(ReadableValue decoder, IntegerDataType dataType) {
        int size = dataType.getNativeTypeSize();
        GenericValueInfo result = null;
        try {
            if (size >= 6) {
                MutableLongValueInfo longValue = valueFactory.longValue();
                result = longValue;
                longValue.set(decoder.getLong());
            } else if (size == 1) {
                MutableByteValueInfo byteValue = valueFactory.byteValue();
                result = byteValue;
                byteValue.set((byte) decoder.getInt());
            } else if (size == 2) {
                MutableShortValueInfo shortValue = valueFactory.shortValue();
                result = shortValue;
                shortValue.set((short) decoder.getInt());
            } else {
                MutableIntValueInfo intValue = valueFactory.intValue();
                result = intValue;
                intValue.set(decoder.getInt());
            }
        } catch (NullValueException ignored) {
        }
        return result;
    }

    private GenericValueInfo decode(ReadableValue decoder, FloatDataType dataType) {
        GenericValueInfo result = null;
        try {
            if (dataType.isFloat()) {
                MutableFloatValueInfo floatValue = valueFactory.floatValue();
                result = floatValue;
                floatValue.set(decoder.getFloat());
            } else if (dataType.isDecimal64()) {
                MutableDecimalValueInfo decimalValue = valueFactory.decimalValue();
                result = decimalValue;
                decimalValue.setDecimal(decoder.getLong());
            } else {
                MutableDoubleValueInfo doubleValue = valueFactory.doubleValue();
                result = doubleValue;
                doubleValue.set(decoder.getDouble());
            }
        } catch (NullValueException ignored) {
        }
        return result;
    }

    private MutableBooleanValueInfo decode(ReadableValue decoder, BooleanDataType dataType) {
        MutableBooleanValueInfo booleanValueInfo = valueFactory.booleanValue();
        try {
            booleanValueInfo.set((byte) (decoder.getBoolean() ? 1: 0));
        } catch (NullValueException exc) {
        }
        return booleanValueInfo;
    }

    private MutableCharValueInfo decode(ReadableValue decoder, CharDataType dataType) {
        MutableCharValueInfo charValue = valueFactory.charValue();
        try {
            charValue.set(decoder.getChar());
        } catch (NullValueException ignored) {
        }
        return charValue;
    }

    private MutableGenericValueInfo decode(ReadableValue decoder, VarcharDataType dataType) {
        if (dataType.getEncoding() != null && dataType.getEncoding().startsWith(VarcharDataType.ENCODING_ALPHANUMERIC)) {
            MutableAlphanumericValueInfo alphanumericValue = valueFactory.alphanumericValue();
            try {
                alphanumericValue.setAlphanumeric(decoder.getLong());
            } catch (NullValueException ignored) {
            }
            return alphanumericValue;
        } else {
            MutableCharSequenceValue charSequenceValue = valueFactory.charSequenceValue();
            try {
                charSequenceValue.set(decoder.getString()); // ToDo: garbage-free implementation
            } catch (NullValueException ignored) {
            }
            return charSequenceValue;
        }
    }

    private GenericValueInfo decode(ReadableValue decoder, ClassDataType dataType) {
        UnboundDecoder fieldDecoder = decoder.getFieldDecoder();
        MutableGenericObjectImpl genericObject = valueFactory.objectValue();
        MutableCharSequenceValue typeValue = valueFactory.charSequenceValue();
        typeValue.set(fieldDecoder.getClassInfo().getDescriptor().getName());
        genericObject.set("$type", typeValue);
        try {
            while (fieldDecoder.nextField()) {
                NonStaticFieldInfo currentField = fieldDecoder.getField();
                DataType fieldDataType = currentField.getType();
                genericObject.set(currentField.getName(), decode(fieldDecoder, fieldDataType));
            }
        } catch (NullValueException ignored) {
        }
        return genericObject;
    }

    private GenericValueInfo decode(ReadableValue decoder, ArrayDataType dataType) {
        int length = decoder.getArrayLength();
        DataType underlineType = dataType.getElementDataType();
        MutableListValue listValue = new MutableListValue();

        for (int i = 0; i < length; i++) {
            try {
                ReadableValue rv = decoder.nextReadableElement();
                listValue.add(decode(rv, underlineType));
            } catch (NullValueException ignored) {
            }
        }

        return listValue;
    }

    private MutableTimeOfDayValueInfo decode(ReadableValue decoder, TimeOfDayDataType dataType) {
        MutableTimeOfDayValueInfo value = valueFactory.timeOfDayValue();
        try {
            value.setTimeOfDay(decoder.getInt());
        } catch (NullValueException ignored) {
        }
        return value;
    }

    private GenericValueInfo decode(ReadableValue decoder, DateTimeDataType dataType) {
        MutableTimestampValueInfo value = valueFactory.timestampValue();
        try {
            value.setTimestamp(decoder.getLong());
        } catch (NullValueException ignored) {
        }
        return value;
    }

    private GenericValueInfo decode(ReadableValue decoder, EnumDataType dataType) {
        MutableEnumValue value = valueFactory.enumValue();
        try {
            long ordinal = decoder.getLong();
            value.setEnum(dataType.descriptor.longToString(ordinal), ordinal);
        } catch (NullValueException ignored) {
        }
        return value;
    }

    private GenericValueInfo decode(ReadableValue decoder, BinaryDataType dataType) {
        MutableBinaryValueInfo value = valueFactory.binaryValue();
        try {
            int len = decoder.getBinaryLength();
            byte[] bytes = new byte[len];
            decoder.getBinary(0, len, bytes, 0);
            value.setBinary(bytes);
        } catch (NullValueException ignored) {
        }
        return value;
    }
}
