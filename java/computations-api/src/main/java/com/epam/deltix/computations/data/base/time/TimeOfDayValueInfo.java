package com.epam.deltix.computations.data.base.time;

import com.epam.deltix.computations.data.base.GenericValueInfo;
import com.epam.deltix.util.annotations.TimeOfDay;

public interface TimeOfDayValueInfo extends GenericValueInfo {

    @TimeOfDay
    int timeOfDayValue();

    @Override
    default Object value() {
        return timeOfDayValue();
    }

    @Override
    default boolean isNull() {
        return timeOfDayValue() == TIME_OF_DAY_NULL;
    }

}
