package com.epam.deltix.tbwg.services;

public interface WebSocketSubscriptionService {

    void add(final String sessionId, final String subscriptionId, final Runnable unsubscribeCommand);

    void unsubscribe(final String sessionId, final String subscriptionId);

    void unsubscribe(final String sessionId);

}
