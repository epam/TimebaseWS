package com.epam.deltix.tbwg.services;

import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class WebSocketSubscriptionServiceImpl implements WebSocketSubscriptionService {

    private final Map<String, Map<String, Runnable>> unsubscribeCommands = new HashMap<>();

    public void add(final String sessionId, final String subscriptionId, final Runnable unsubscribeCommand) {
        synchronized (unsubscribeCommands) {
            final Map<String, Runnable> commands = unsubscribeCommands.computeIfAbsent(sessionId, key -> new HashMap<>());
            commands.put(subscriptionId, unsubscribeCommand);
        }
    }

    public void unsubscribe(final String sessionId, final String subscriptionId) {
        final Runnable runnable;
        synchronized (unsubscribeCommands) {
            Map<String, Runnable> commands = unsubscribeCommands.get(sessionId);
            if (commands == null)
                return;
            runnable = commands.remove(subscriptionId);
            if (runnable == null)
                return;
            commands.remove(subscriptionId);
            if (commands.isEmpty()) {
                unsubscribeCommands.remove(sessionId);
            }
        }
        runnable.run();
    }

    public void unsubscribe(final String sessionId) {
        final Map<String, Runnable> commands;
        synchronized (unsubscribeCommands) {
            commands = unsubscribeCommands.get(sessionId);
            if (commands == null)
                return;
            unsubscribeCommands.remove(sessionId);
        }
        commands.values().forEach(Runnable::run);
    }

}
