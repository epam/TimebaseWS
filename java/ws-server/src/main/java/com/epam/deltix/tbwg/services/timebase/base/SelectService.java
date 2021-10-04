package com.epam.deltix.tbwg.services.timebase.base;

import com.epam.deltix.tbwg.model.input.SelectRequest;
import com.epam.deltix.tbwg.services.timebase.exc.NoStreamsException;
import com.epam.deltix.tbwg.utils.MessageSource2ResponseStream;

public interface SelectService {

    MessageSource2ResponseStream select(long startTime, long endTime, long offset, int rows, boolean reverse,
                                        String[] types, String[] symbols, String[] keys, String space, int maxRecords)
            throws NoStreamsException;

    MessageSource2ResponseStream select(SelectRequest selectRequest, int maxRecords) throws NoStreamsException;

}
