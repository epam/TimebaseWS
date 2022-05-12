package com.epam.deltix.tbwg.messages;

import com.epam.deltix.timebase.messages.SchemaElement;

/**
 * Created by Alex Karpovich on 12/05/2022.
 */
public enum FeedStatus {
    /**
     * Feed for this security is available again.
     */
    @SchemaElement(
            name = "AVAILABLE"
    )
    AVAILABLE(0),

    /**
     * Feed for this security and exchange code is no longer available.
     */
    @SchemaElement(
            name = "NOT_AVAILABLE"
    )
    NOT_AVAILABLE(1);

    private final int value;

    FeedStatus(int value) {
        this.value = value;
    }

    public int getNumber() {
        return this.value;
    }

    public static FeedStatus valueOf(int number) {
        switch (number) {
            case 0: return AVAILABLE;
            case 1: return NOT_AVAILABLE;
            default: return null;
        }
    }

    public static FeedStatus strictValueOf(int number) {
        final FeedStatus value = valueOf(number);
        if (value == null) {
            throw new IllegalArgumentException("Enumeration 'FeedStatus' does not have value corresponding to '" + number + "'.");
        }
        return value;
    }
}
