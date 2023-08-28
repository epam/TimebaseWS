package com.epam.deltix.tbwg.messages;

import com.epam.deltix.timebase.messages.*;

public class ViewMdMessage extends InstrumentMessage {
    public static final String CLASS_NAME = ViewMdMessage.class.getName();

    private String stream;

    private ViewType type;

    private boolean live;

    private ViewState state;

    private String description;

    private String info;

    private long lastTimestamp;

    public void setId(String id) {
        setSymbol(id);
    }

    public String getId() {
        return getSymbol().toString();
    }

    @SchemaElement(
        title = "Stream"
    )
    @SchemaType(
        isNullable = false
    )
    public String getStream() {
        return stream;
    }

    public void setStream(String stream) {
        this.stream = stream;
    }

    @SchemaElement(
        title = "Type"
    )
    @SchemaType(
        isNullable = false
    )
    public ViewType getType() {
        return type;
    }

    public void setType(ViewType type) {
        this.type = type;
    }

    @SchemaElement(
        title = "Live"
    )
    @SchemaType(
        isNullable = false
    )
    public boolean isLive() {
        return live;
    }

    public void setLive(boolean live) {
        this.live = live;
    }

    @SchemaElement(
        title = "State"
    )
    @SchemaType(
        isNullable = false
    )
    public ViewState getState() {
        return state;
    }

    public void setState(ViewState state) {
        this.state = state;
    }

    @SchemaElement(
        title = "Description"
    )
    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    @SchemaElement(
        title = "Info"
    )
    public String getInfo() {
        return info;
    }

    public void setInfo(String info) {
        this.info = info;
    }

    @SchemaElement(
        title = "Last Timestamp"
    )
    @SchemaType(
        dataType = SchemaDataType.TIMESTAMP
    )
    public long getLastTimestamp() {
        return lastTimestamp;
    }

    public void setLastTimestamp(long lastTimestamp) {
        this.lastTimestamp = lastTimestamp;
    }

    @Override
    protected ViewMdMessage createInstance() {
        return new ViewMdMessage();
    }

    @Override
    public ViewMdMessage clone() {
        ViewMdMessage t = createInstance();
        t.copyFrom(this);
        return t;
    }

    @Override
    public InstrumentMessage copyFrom(RecordInfo source) {
        super.copyFrom(source);
        if (source instanceof ViewMdMessage) {
            final ViewMdMessage obj = (ViewMdMessage) source;
            stream = obj.stream;
            type = obj.type;
            live = obj.live;
            state = obj.state;
            description = obj.description;
            info = obj.info;
            lastTimestamp = obj.lastTimestamp;
        }
        return this;
    }

}
