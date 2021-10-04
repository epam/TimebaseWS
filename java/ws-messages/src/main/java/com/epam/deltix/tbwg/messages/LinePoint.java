package com.epam.deltix.tbwg.messages;

import com.epam.deltix.dfp.Decimal;
import com.epam.deltix.timebase.messages.*;

@SchemaElement(
    name = "deltix.tbwg.messages.LinePoint",
    title = "Line Point"
)
public class LinePoint extends InstrumentMessage {

    public static final String CLASS_NAME = LinePoint.class.getName();

    @Decimal
    protected long value = TypeConstants.DECIMAL_NULL;

    @Decimal
    @SchemaElement(
        title = "Value"
    )
    @SchemaType(
        encoding = "DECIMAL64",
        dataType = SchemaDataType.FLOAT
    )
    public long getValue() {
        return value;
    }

    public void setValue(long value) {
        this.value = value;
    }

    @Override
    protected LinePoint createInstance() {
        return new LinePoint();
    }

    @Override
    public LinePoint clone() {
        LinePoint t = createInstance();
        t.copyFrom(this);
        return t;
    }

    @Override
    public InstrumentMessage copyFrom(RecordInfo source) {
        super.copyFrom(source);
        if (source instanceof LinePoint) {
            final LinePoint obj = (LinePoint) source;
            value = obj.value;
        }
        return this;
    }
}
