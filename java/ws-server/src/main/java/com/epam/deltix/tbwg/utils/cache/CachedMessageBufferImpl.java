package com.epam.deltix.tbwg.utils.cache;

import com.epam.deltix.qsrv.hf.pub.RawMessage;
import com.epam.deltix.qsrv.util.json.JSONRawMessagePrinter;

public class CachedMessageBufferImpl implements MessageBuffer<RawMessage> {
    private final JSONRawMessagePrinter printer;
    private final SymbolToMessageCache cache = new SymbolToMessageCache();

    public CachedMessageBufferImpl(JSONRawMessagePrinter printer) {
        this.printer = printer;
    }

    @Override
    public void append(RawMessage message) {
        cache.add(message);
    }

    @Override
    public boolean canFlush() {
        return false;
    }

    @Override
    public void clear() {
        cache.clear();
    }

    @Override
    public String flush() {
        return cache.print(printer);
    }
}
