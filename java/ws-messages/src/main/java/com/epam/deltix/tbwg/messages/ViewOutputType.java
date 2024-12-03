package com.epam.deltix.tbwg.messages;

import com.epam.deltix.timebase.messages.SchemaElement;

@SchemaElement(
        name = "deltix.timebase.api.messages.service.ViewOutputType",
        title = "View Output Type"
)
public enum ViewOutputType {
    STREAM(0),
    TOPIC(1);

    private final int value;

    private ViewOutputType(int value) {
        this.value = value;
    }

    public int getNumber() {
        return this.value;
    }

    public static ViewOutputType valueOf(int number) {
        switch (number) {
            case 0:
                return STREAM;
            case 1:
                return TOPIC;
            default:
                return null;
        }
    }

    public static ViewOutputType strictValueOf(int number) {
        ViewOutputType value = valueOf(number);
        if (value == null) {
            throw new IllegalArgumentException("Enumeration 'ViewOutputType' does not have value corresponding to '" + number + "'.");
        } else {
            return value;
        }
    }
}

