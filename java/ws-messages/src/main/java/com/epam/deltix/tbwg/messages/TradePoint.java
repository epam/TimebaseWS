package com.epam.deltix.tbwg.messages;

import com.epam.deltix.dfp.Decimal;
import com.epam.deltix.timebase.messages.InstrumentMessage;
import com.epam.deltix.timebase.messages.*;

@SchemaElement(
    name = "deltix.tbwg.messages.TradePoint"
)
public class TradePoint extends InstrumentMessage {

    public static final String CLASS_NAME = TradePoint.class.getName();

    @Decimal
    protected long size = TypeConstants.DECIMAL_NULL;
    @Decimal
    protected long price = TypeConstants.DECIMAL_NULL;

    @Decimal
    @SchemaElement(
        title = "Size"
    )
    @SchemaType(
        encoding = "DECIMAL64",
        dataType = SchemaDataType.FLOAT
    )
    public long getSize() {
        return size;
    }

    public void setSize(long size) {
        this.size = size;
    }

    @Decimal
    @SchemaElement(
            title = "Price"
    )
    @SchemaType(
            encoding = "DECIMAL64",
            dataType = SchemaDataType.FLOAT
    )
    public long getPrice() {
        return price;
    }

    public void setPrice(long price) {
        this.price = price;
    }


    @Override
    protected TradePoint createInstance() {
        return new TradePoint();
    }

    @Override
    public TradePoint clone() {
        TradePoint t = createInstance();
        t.copyFrom(this);
        return t;
    }

    @Override
    public InstrumentMessage copyFrom(RecordInfo source) {
        super.copyFrom(source);
        if (source instanceof TradePoint) {
            final TradePoint obj = (TradePoint) source;
            size = obj.size;
            price = obj.price;
        }
        return this;
    }
}
