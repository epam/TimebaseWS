package com.epam.deltix.tbwg.messages;

import com.epam.deltix.timebase.messages.SchemaElement;

@SchemaElement(
        name = "deltix.timebase.api.messages.service.ViewQueryType",
        title = "View Query Type"
)
public enum ViewQueryType {
    QQL(0);

    private final int value;

    private ViewQueryType(int value) {
        this.value = value;
    }

    public int getNumber() {
        return this.value;
    }

    public static ViewQueryType valueOf(int number) {
        switch (number) {
            case 0:
                return QQL;
            default:
                return null;
        }
    }

    public static ViewQueryType strictValueOf(int number) {
        ViewQueryType value = valueOf(number);
        if (value == null) {
            throw new IllegalArgumentException("Enumeration 'ViewQueryType' does not have value corresponding to '" + number + "'.");
        } else {
            return value;
        }
    }
}

