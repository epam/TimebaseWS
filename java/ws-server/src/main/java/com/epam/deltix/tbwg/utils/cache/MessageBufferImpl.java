package com.epam.deltix.tbwg.utils.cache;

import com.epam.deltix.qsrv.hf.pub.RawMessage;
import com.epam.deltix.qsrv.util.json.JSONRawMessagePrinter;

public class MessageBufferImpl implements MessageBuffer<RawMessage> {
    private final JSONRawMessagePrinter printer;
    private final StringBuilder buffer = new StringBuilder("[");
    private final boolean live;

    public MessageBufferImpl(JSONRawMessagePrinter printer, boolean live) {
        this.printer = printer;
        this.live = live;
    }

    @Override
    public void append(RawMessage message) {
        if (buffer.length() > 1)
            buffer.append(",");

        printer.append(message, buffer);
    }

    @Override
    public boolean canFlush() {
        return buffer.length() >= LIMIT_BUFFER_SIZE || live;
    }

    @Override
    public void clear() {
    }

    @Override
    public String flush() {
        if (buffer.length() > 1) {
            buffer.append("]");
        }
        String result = buffer.toString();
        buffer.setLength(0);
        buffer.append("[");

        return result;
    }
}
