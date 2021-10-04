package com.epam.deltix.tbwg.messages;

public class ChangePeriodicity implements Message {

    private final long periodicity;

    public ChangePeriodicity(long periodicity) {
        this.periodicity = periodicity;
    }

    public long getPeriodicity() {
        return periodicity;
    }

}
