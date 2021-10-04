package com.epam.deltix.tbwg.utils.cache;

import com.epam.deltix.timebase.messages.InstrumentMessage;

public interface MessageBuffer<T extends InstrumentMessage> {

    int MAX_BUFFER_SIZE = 16 * 1024;
    int LIMIT_BUFFER_SIZE = MAX_BUFFER_SIZE - (MAX_BUFFER_SIZE % 10);

    void append(T message);

    boolean canFlush();

    void clear();

    String flush();
}
