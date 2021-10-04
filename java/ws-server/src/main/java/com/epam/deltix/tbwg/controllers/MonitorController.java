package com.epam.deltix.tbwg.controllers;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.tbwg.config.WebSocketConfig;
import com.epam.deltix.tbwg.services.timebase.MonitorService;
import com.epam.deltix.tbwg.services.timebase.TimebaseServiceImpl;
import com.epam.deltix.tbwg.services.WebSocketSubscriptionService;
import com.epam.deltix.tbwg.utils.HeaderAccessorHelper;
import com.epam.deltix.tbwg.utils.WebSocketUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.MessageHeaders;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.annotation.SubscribeMapping;
import org.springframework.stereotype.Controller;

import java.util.List;

@Controller
public class MonitorController {

    private static final Log LOG = LogFactory.getLog(MonitorController.class);

    private final SimpMessagingTemplate messagingTemplate;
    private final MonitorService monitorService;
    private final WebSocketSubscriptionService subscriptionService;
    private final TimebaseServiceImpl timebaseService;

    private final HeaderAccessorHelper headerAccessorHelper = new HeaderAccessorHelper();

    @Autowired
    public MonitorController(SimpMessagingTemplate messagingTemplate, MonitorService monitorService, WebSocketSubscriptionService subscriptionService, TimebaseServiceImpl timebaseService) {
        this.messagingTemplate = messagingTemplate;
        this.monitorService = monitorService;
        this.subscriptionService = subscriptionService;
        this.timebaseService = timebaseService;
    }

    @SubscribeMapping(WebSocketConfig.MONITOR_TOPIC + "/{streamKey}")
    public void subscribeStream(SimpMessageHeaderAccessor headerAccessor, @DestinationVariable String streamKey) {
        LOG.info().append("Subscribe to stream ").append(streamKey).commit();
        subscribe(headerAccessor, streamKey, WebSocketConfig.getMonitorTopic(streamKey));
    }

    @SubscribeMapping

    private void subscribe(SimpMessageHeaderAccessor headerAccessor, String stream, String destination) {
        String sessionId = headerAccessor.getSessionId();
        String subscriptionId = headerAccessor.getSubscriptionId();

        MessageHeaders headers = WebSocketUtils.generateHeaders(headerAccessor);

        long fromTimestamp = headerAccessorHelper.getTimestamp(headerAccessor);
        List<String> symbols = headerAccessorHelper.getSymbols(headerAccessor);
        List<String> types = headerAccessorHelper.getTypes(headerAccessor);

        monitorService.subscribe(sessionId, subscriptionId, stream, fromTimestamp, types, symbols, messages -> {
            messagingTemplate.convertAndSendToUser(sessionId, destination, messages, headers);
        });

        subscriptionService.add(sessionId, subscriptionId, () -> monitorService.unsubscribe(sessionId, subscriptionId));
    }
}
