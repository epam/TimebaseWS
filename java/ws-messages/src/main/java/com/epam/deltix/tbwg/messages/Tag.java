package com.epam.deltix.tbwg.messages;

import com.epam.deltix.dfp.Decimal;

import com.epam.deltix.timebase.messages.*;

@SchemaElement(
    name = "deltix.tbwg.messages.Tag",
    title = "Tag"
)
public class Tag extends InstrumentMessage {

    public static final String CLASS_NAME = Tag.class.getName();

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
    protected Tag createInstance() {
        return new Tag();
    }

    @Override
    public Tag clone() {
        Tag t = createInstance();
        t.copyFrom(this);
        return t;
    }

    @Override
    public InstrumentMessage copyFrom(RecordInfo source) {
        super.copyFrom(source);
        if (source instanceof Tag) {
            final Tag obj = (Tag) source;
            value = obj.value;
        }
        return this;
    }
}
