package com.epam.deltix.grafana;

public interface TimeSaver {

    boolean put(long timestamp);

    long getStart();

    long getEnd();

    long getStep();

    long getLast();

    long getReadyTimestamp();

    static TimeSaver createPretty(long start, long end, long interval) {
        return PrettyTimeSaver.create(start, end, interval);
    }

}
