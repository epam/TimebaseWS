package com.epam.deltix.tbwg.services.timebase;

import java.util.List;
import java.util.function.Consumer;

public interface MonitorService {

    void subscribe(String sessionId, String subscriptionId, String key, long fromTimestamp, List<String> types,
                   List<String> symbols, Consumer<String> consumer);

    void unsubscribe(String sessionId, String subscriptionId);

}
