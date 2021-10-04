package com.epam.deltix.computations.data.base.time;

import com.epam.deltix.util.annotations.TimeOfDay;
import com.epam.deltix.computations.data.base.MutableGenericValueInfo;

public interface MutableTimeOfDayValueInfo extends TimeOfDayValueInfo, MutableGenericValueInfo {

    @Override
    void setTimeOfDay(@TimeOfDay int value);

    @Override
    default void setNull() {
        setTimeOfDay(TIME_OF_DAY_NULL);
    }
}
