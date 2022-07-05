/*
 * Copyright 2021 EPAM Systems, Inc
 *
 * See the NOTICE file distributed with this work for additional information
 * regarding copyright ownership. Licensed under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
package com.epam.deltix.tbwg.webapp.websockets.subscription;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.tbwg.webapp.config.WebSocketConfig;
import com.epam.deltix.tbwg.webapp.model.ErrorDef;
import com.epam.deltix.tbwg.webapp.utils.HeaderAccessorHelper;
import com.epam.deltix.tbwg.webapp.websockets.WebSocketUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageHandler;
import org.springframework.messaging.MessageHeaders;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessageType;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.broker.AbstractBrokerMessageHandler;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.ExecutorChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;

@Lazy
@Service
public class SubscriptionService implements SubscriptionControllerRegistry {

    private static final Log LOG = LogFactory.getLog(SubscriptionService.class);

    public static final String DESTINATION_PREFIX = "/user";

    private final InboundChannelInterceptor inboundChannelInterceptor = new InboundChannelInterceptor();

    private final Map<String, SubscriptionController> controllers = new HashMap<>();
    private final Map<String, Map<String, Subscription>> subscriptions = new ConcurrentHashMap<>();

    // for those subscriptions 'unsubscribe' event came before 'subscribe'
    private final Map<String, Map<String, Long>> disconnectedSubscriptions = new ConcurrentHashMap<>();

    @Autowired
    @Lazy
    private SimpMessagingTemplate messagingTemplate;

    @Override
    public void register(final String destinationSuffix, final SubscriptionController controller) {
        Objects.requireNonNull(destinationSuffix);
        Objects.requireNonNull(controller);

        String destination = DESTINATION_PREFIX + destinationSuffix;

        LOG.debug("SubscriptionService registers: destination=%s, controller=%s")
            .with(destinationSuffix)
            .with(controller);

        final SubscriptionController result = controllers.putIfAbsent(destination, controller);
        if (result != null) {
            throw new IllegalStateException("Subscription controller already exists at destination: " + destination);
        }
    }

    public ChannelInterceptor inboundChannelInterceptor() {
        return inboundChannelInterceptor;
    }

    private final class InboundChannelInterceptor implements ChannelInterceptor, ExecutorChannelInterceptor {

        @Override
        public Message<?> preSend(final Message<?> message, final MessageChannel channel) {
            String destination = SimpMessageHeaderAccessor.getDestination(message.getHeaders());
            if (destination == null || !destination.startsWith(DESTINATION_PREFIX)) {
                return message;
            }

            if (findController(destination) == null) {
                return message;
            }

            SimpMessageHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, SimpMessageHeaderAccessor.class);
            String sessionId = accessor.getSessionId();
            String subscriptionId = accessor.getSubscriptionId();

            Objects.requireNonNull(sessionId);
            Objects.requireNonNull(subscriptionId);

            translateDestination(accessor, destination, sessionId, subscriptionId);
            return message;
        }

        @Override
        public void afterMessageHandled(final Message<?> message, final MessageChannel channel, final MessageHandler handler, final Exception ex) {
            if (handler instanceof AbstractBrokerMessageHandler) {
                SimpMessageType messageType = SimpMessageHeaderAccessor.getMessageType(message.getHeaders());

                if (messageType == SimpMessageType.SUBSCRIBE || messageType == SimpMessageType.UNSUBSCRIBE || messageType == SimpMessageType.DISCONNECT) {
                    SimpMessageHeaderAccessor header = SimpMessageHeaderAccessor.wrap(message);

                    if (messageType == SimpMessageType.SUBSCRIBE) {
                        onSubscribe(header);
                    } else if (messageType == SimpMessageType.UNSUBSCRIBE) {
                        onUnsubscribe(header);
                    } else { //if (messageType == SimpMessageType.DISCONNECT)
                        onDisconnect(header);
                    }
                }
            }
        }

        private synchronized void onSubscribe(final SimpMessageHeaderAccessor headers) {
            final String destination = headers.getDestination();
            final String originalDestination = HeaderAccessorHelper.getOriginalDestination(headers);
            final String sessionId = headers.getSessionId();
            final String subscriptionId = headers.getSubscriptionId();

            if (destination == null) {
                return;
            }

            if (originalDestination == null || !originalDestination.startsWith(DESTINATION_PREFIX)) {
                return;
            }

            Objects.requireNonNull(sessionId);
            Objects.requireNonNull(subscriptionId);

            if (getDisconnectedSubscription(sessionId, subscriptionId) != null) {
                LOG.warn("SubscriptionService unsubscribe came before subscribe: session=%s, subscription=%s, destination=%s")
                    .with(sessionId)
                    .with(subscriptionId)
                    .with(destination);
                return;
            }

            LOG.debug("SubscriptionService subscribes: session=%s, subscription=%s, destination=%s")
                .with(sessionId)
                .with(subscriptionId)
                .with(destination);

            final SubscriptionController controller = findController(originalDestination);
            if (controller != null) {
                final SubscriptionChannelImpl channel = new SubscriptionChannelImpl(messagingTemplate, destination, sessionId, headers);
                Subscription subscription = null;

                try {
                    subscription = controller.onSubscribe(headers, channel);
                } catch (final Throwable e) {
                    LOG.warn("SubscriptionService controller thew an exception on subscribe: : session=%s, subscription=%s, destination=%s, exception=%s")
                        .with(sessionId)
                        .with(subscriptionId)
                        .with(destination)
                        .with(e);

                    channel.sendError(e);
                }

                if (subscription != null) {
                    addSubscription(sessionId, subscriptionId, subscription);
                }
            }
        }

        private synchronized void onUnsubscribe(final SimpMessageHeaderAccessor header) {
            final String destination = header.getDestination();
            final String sessionId = header.getSessionId();
            final String subscriptionId = header.getSubscriptionId();

            Objects.requireNonNull(sessionId);
            Objects.requireNonNull(subscriptionId);

            LOG.debug("SubscriptionService unsubscribes: session=%s, subscription=%s, destination=%s")
                .with(sessionId)
                .with(subscriptionId)
                .with(destination);

            removeSubscription(sessionId, subscriptionId);
        }

        private synchronized void onDisconnect(final SimpMessageHeaderAccessor header) {
            final String destination = header.getDestination();
            final String sessionId = header.getSessionId();
            final String subscriptionId = header.getSubscriptionId();

            LOG.debug("SubscriptionService disconnects: session=%s, subscription=%s, destination=%s")
                .with(sessionId)
                .with(subscriptionId)
                .with(destination);

            Objects.requireNonNull(sessionId);
            removeSubscriptions(sessionId);
        }

        private SubscriptionController findController(String destination) {
            final String foundKey = controllers.keySet().stream()
                .filter(k -> destination.toLowerCase().startsWith(k.toLowerCase()))
                .findFirst().orElse(null);

            return foundKey != null ? controllers.get(foundKey) : null;
        }

        private void addSubscription(String sessionId, String subscriptionId, Subscription subscription) {
            Subscription result = subscriptions
                .computeIfAbsent(sessionId, s -> new ConcurrentHashMap<>())
                .putIfAbsent(subscriptionId, subscription);

            if (result != null) {
                throw new IllegalStateException("Subscription already exists at session: " + sessionId + " and subscription: " + subscriptionId);
            }
        }

        private void removeSubscription(String sessionId, String subscriptionId) {
            Map<String, Subscription> subscriptionBySession = subscriptions.get(sessionId);

            boolean exists = false;
            if (subscriptionBySession != null) {
                Subscription subscription = subscriptionBySession.remove(subscriptionId);
                if (subscription != null) {
                    try {
                        exists = true;
                        subscription.onUnsubscribe();
                    } catch (Throwable e) {
                        LOG.error("SubscriptionService subscription threw an exception on unsubscribe: %s")
                            .with(e);
                    }
                }
            }

            if (!exists) {
                disconnectedSubscriptions
                    .computeIfAbsent(sessionId, s -> new ConcurrentHashMap<>())
                    .putIfAbsent(subscriptionId, System.currentTimeMillis());
            }
        }

        private void removeSubscriptions(String sessionId) {
            Map<String, Subscription> subscriptionBySession = subscriptions.remove(sessionId);
            if (subscriptionBySession != null) {
                for (Subscription subscription : subscriptionBySession.values()) {
                    try {
                        subscription.onUnsubscribe();
                    } catch (final Throwable e) {
                        LOG.error("SubscriptionService subscription threw an exception on unsubscribe: %s")
                            .with(e);
                    }
                }
            }

            disconnectedSubscriptions.remove(sessionId);
        }

        private Long getDisconnectedSubscription(String sessionId, String subscriptionId) {
            Map<String, Long> subscriptionBySession = disconnectedSubscriptions.get(sessionId);
            if (subscriptionBySession != null) {
                return subscriptionBySession.remove(subscriptionId);
            }

            return null;
        }

        private void translateDestination(SimpMessageHeaderAccessor accessor, String destination,
                                          String sessionId, String subscriptionId) {

            String fullDestination = makeFullDestination(destination, sessionId, subscriptionId);
            if (fullDestination.startsWith(DESTINATION_PREFIX + "/")) {
                accessor.setDestination(
                    fullDestination.replaceFirst(DESTINATION_PREFIX, "") + "-user" + sessionId
                );
                HeaderAccessorHelper.setOriginalDestination(accessor, destination);
            }
        }

        private String makeFullDestination(String destination, String sessionId, String subscriptionId) {
            return destination + "?session=" + sessionId + "&subscription=" + subscriptionId;
        }

    }

    private static final class SubscriptionChannelImpl implements SubscriptionChannel {

        private final SimpMessagingTemplate template;
        private final String destination;
        private final String session;
        private final MessageHeaders headers;

        public SubscriptionChannelImpl(SimpMessagingTemplate template, String destination, String session,
                                       SimpMessageHeaderAccessor headerAccessor)
        {
            this.template = template;
            this.destination = destination;
            this.session = session;
            this.headers = WebSocketUtils.generateHeaders(headerAccessor);
        }

        @Override
        public void sendMessage(final Object payload) {
            template.convertAndSend(destination, payload);
        }

        @Override
        public void sendError(final Object payload) {
            template.convertAndSendToUser(
                session, WebSocketConfig.RPC_FEED,
                new ErrorDef(payload.toString(), "stomp_error"),
                headers
            );
        }
    }

}
