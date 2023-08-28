package com.epam.deltix.tbwg.messages;

public enum ViewState {
    CREATED,
    RESTARTED,
    PROCESSING,
    IDLING,
    FAILED,
    COMPLETED,
    STOPPED,
    REMOVED;

    public boolean isFinal() {
        return this == FAILED || this == COMPLETED || this == STOPPED || this == REMOVED;
    }

}
