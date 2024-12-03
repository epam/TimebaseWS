package com.epam.deltix.tbwg.messages;

import com.epam.deltix.dfp.Decimal;
import com.epam.deltix.timebase.messages.InstrumentMessage;
import com.epam.deltix.timebase.messages.*;

@SchemaElement(
    name = "deltix.tbwg.messages.VolumePoint",
    title = "Line Point"
)
public class VolumePoint extends InstrumentMessage {

    public static final String CLASS_NAME = VolumePoint.class.getName();

    @Decimal
    protected long volume = TypeConstants.DECIMAL_NULL;

    @Decimal
    @SchemaElement(
        title = "Volume"
    )
    @SchemaType(
        encoding = "DECIMAL64",
        dataType = SchemaDataType.FLOAT
    )
    public long getVolume() {
        return volume;
    }

    public void setVolume(long volume) {
        this.volume = volume;
    }

    @Override
    protected VolumePoint createInstance() {
        return new VolumePoint();
    }

    @Override
    public VolumePoint clone() {
        VolumePoint t = createInstance();
        t.copyFrom(this);
        return t;
    }

    @Override
    public InstrumentMessage copyFrom(RecordInfo source) {
        super.copyFrom(source);
        if (source instanceof VolumePoint) {
            final VolumePoint obj = (VolumePoint) source;
            volume = obj.volume;
        }
        return this;
    }
}
