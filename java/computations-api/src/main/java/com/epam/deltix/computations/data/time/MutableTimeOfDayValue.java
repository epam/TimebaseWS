package com.epam.deltix.computations.data.time;

import com.epam.deltix.util.annotations.TimeOfDay;
import com.epam.deltix.computations.data.base.time.MutableTimeOfDayValueInfo;

public class MutableTimeOfDayValue implements MutableTimeOfDayValueInfo {

    @TimeOfDay
    private int value;

    public MutableTimeOfDayValue() {
        this.value = TIME_OF_DAY_NULL;
    }

    public MutableTimeOfDayValue(@TimeOfDay int value) {
        this.value = value;
    }

    @TimeOfDay
    @Override
    public int timeOfDayValue() {
        return value;
    }

    @Override
    public void reuse() {
        value = TIME_OF_DAY_NULL;
    }

    @Override
    public void setTimeOfDay(@TimeOfDay int value) {
        this.value = value;
    }

    @Override
    public String toString() {
        return getClass().getSimpleName() + ":" + value();
    }
}
