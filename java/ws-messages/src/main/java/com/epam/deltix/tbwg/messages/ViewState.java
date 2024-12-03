package com.epam.deltix.tbwg.messages;

import com.epam.deltix.timebase.messages.SchemaElement;

@SchemaElement(
        name = "deltix.timebase.api.messages.service.ViewState",
        title = "View State"
)
public enum ViewState {
    CREATED(0),
    RESTARTED(1),
    PROCESSING(2),
    IDLE(3),
    FAILED(4),
    COMPLETED(5),
    STOPPED(6),
    REMOVED(7);

    private final int value;

    private ViewState(int value) {
        this.value = value;
    }

    public int getNumber() {
        return this.value;
    }

    public static ViewState valueOf(int number) {
        switch (number) {
            case 0:
                return CREATED;
            case 1:
                return RESTARTED;
            case 2:
                return PROCESSING;
            case 3:
                return IDLE;
            case 4:
                return FAILED;
            case 5:
                return COMPLETED;
            case 6:
                return STOPPED;
            case 7:
                return REMOVED;
            default:
                return null;
        }
    }

    public static ViewState strictValueOf(int number) {
        ViewState value = valueOf(number);
        if (value == null) {
            throw new IllegalArgumentException("Enumeration 'ViewState' does not have value corresponding to '" + number + "'.");
        } else {
            return value;
        }
    }
}