package com.epam.deltix.tbwg.webapp.controllers;

import com.epam.deltix.tbwg.webapp.config.WebSocketConfig;
import com.epam.deltix.tbwg.webapp.services.timebase.MonitorService;
import com.epam.deltix.tbwg.webapp.utils.HeaderAccessorHelper;
import com.epam.deltix.tbwg.webapp.websockets.subscription.Subscription;
import com.epam.deltix.tbwg.webapp.websockets.subscription.SubscriptionChannel;
import com.epam.deltix.tbwg.webapp.websockets.subscription.SubscriptionController;
import com.epam.deltix.tbwg.webapp.websockets.subscription.SubscriptionControllerRegistry;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

import java.util.List;

@Controller
public class MonitorQqlController implements SubscriptionController {

    private static final String QQL = "qql";

    private final MonitorService monitorService;

    private final HeaderAccessorHelper headerAccessorHelper = new HeaderAccessorHelper();

    @Autowired
    public MonitorQqlController(SubscriptionControllerRegistry registry, MonitorService monitorService) {
        registry.register(WebSocketConfig.MONITOR_QQL_TOPIC, this);
        this.monitorService = monitorService;
    }

    @Override
    public Subscription onSubscribe(SimpMessageHeaderAccessor headerAccessor, SubscriptionChannel channel) {
        String sessionId = headerAccessor.getSessionId();
        String subscriptionId = headerAccessor.getSubscriptionId();
        String qql = headerAccessor.getFirstNativeHeader(QQL);

        long fromTimestamp = headerAccessorHelper.getTimestamp(headerAccessor);
        List<String> symbols = headerAccessorHelper.getSymbols(headerAccessor);
        List<String> types = headerAccessorHelper.getTypes(headerAccessor);

        monitorService.subscribe(sessionId, subscriptionId, null, qql, fromTimestamp, types, symbols, channel::sendMessage);
        return () -> monitorService.unsubscribe(sessionId, subscriptionId);
    }

}
