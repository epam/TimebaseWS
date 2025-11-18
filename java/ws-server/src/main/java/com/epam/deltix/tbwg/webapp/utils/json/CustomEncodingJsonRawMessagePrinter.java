package com.epam.deltix.tbwg.webapp.utils.json;

import com.epam.deltix.qsrv.hf.pub.NullValueException;
import com.epam.deltix.qsrv.hf.pub.ReadableValue;
import com.epam.deltix.qsrv.hf.pub.codec.NonStaticFieldInfo;
import com.epam.deltix.qsrv.hf.pub.md.ArrayDataType;
import com.epam.deltix.qsrv.hf.pub.md.DataType;
import com.epam.deltix.qsrv.hf.pub.md.IntegerDataType;
import com.epam.deltix.qsrv.util.json.DataEncoding;
import com.epam.deltix.qsrv.util.json.JSONRawMessagePrinter;
import com.epam.deltix.qsrv.util.json.PrintType;


import java.util.Locale;

public class CustomEncodingJsonRawMessagePrinter extends JSONRawMessagePrinter {


    /**
     * This printer only supports STANDARD DataEncoding.
     * There are optimizations present in this implementation that may produce incorrect results
     * if used with other DataEncoding values.
     */
    public CustomEncodingJsonRawMessagePrinter(Locale locale) {
        super(false, true, DataEncoding.STANDARD, true, true, PrintType.FULL, false, "$type", locale);
    }

    protected boolean appendFieldValue(ReadableValue decoder, NonStaticFieldInfo field, StringBuilder sb) {
        DataType dataType = field.getType();
        if (dataType instanceof IntegerDataType && ((IntegerDataType) dataType).getSize() == 8) {
            try {
                long v = decoder.getLong();
                appendString(String.valueOf(v), sb);
                return ((IntegerDataType) dataType).getNullValue() != v;
            } catch (NullValueException e) {
                return false;
            }
        } else {
            return super.appendFieldValue(decoder, field, sb);
        }
    }

    protected boolean appendArrayField(ArrayDataType type, ReadableValue udec, StringBuilder sb) throws NullValueException {
        final DataType underlineType = type.getElementDataType();
        if (underlineType instanceof IntegerDataType && ((IntegerDataType) underlineType).getSize() == 8) {
            final int len = udec.getArrayLength();
            appendBlock('[', sb);
            boolean needSepa = false;
            for (int i = 0; i < len; i++) {
                try {
                    final ReadableValue rv = udec.nextReadableElement();
                    if (needSepa)
                        appendSeparator(sb);
                    else
                        needSepa = true;
                    sb.append(rv.getString());
                } catch (NullValueException e) {
                    sb.append("null");
                }
            }
            appendBlock(']', sb);
            return true;
        } else {
            return super.appendArrayField(type, udec, sb);
        }
    }

    protected void appendStaticValue(DataType dataType, String value, StringBuilder sb) {
        if (dataType instanceof IntegerDataType && ((IntegerDataType) dataType).getSize() == 8) {
            sb.append('"').append(value).append('"');
        } else {
            super.appendStaticValue(dataType, value, sb);
        }
    }

}
