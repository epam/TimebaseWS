package deltix.tbwg.webapp.controllers;

import deltix.tbwg.webapp.config.WebSocketConfig;
import deltix.tbwg.webapp.services.genai.GenAiService;
import deltix.tbwg.webapp.settings.AiApiSettings;
import deltix.tbwg.webapp.websockets.subscription.Subscription;
import deltix.tbwg.webapp.websockets.subscription.SubscriptionChannel;
import deltix.tbwg.webapp.websockets.subscription.SubscriptionController;
import deltix.tbwg.webapp.websockets.subscription.SubscriptionControllerRegistry;
import org.jetbrains.annotations.Nullable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.security.Principal;

@Controller
@CrossOrigin
public class GenAiController implements SubscriptionController {

    private final @Nullable GenAiService genAiService;

    public GenAiController(SubscriptionControllerRegistry registry,
                           @Autowired(required = false) @Nullable GenAiService genAiService) {
        registry.register(WebSocketConfig.GENAI_QQL_TOPIC, this);
        this.genAiService = genAiService;
    }

    @Override
    public Subscription onSubscribe(SimpMessageHeaderAccessor headerAccessor, SubscriptionChannel channel) {
        if (genAiService == null) {
            channel.sendError("Gen AI service is disabled");
            return () -> {};
        }
        String userInput = headerAccessor.getFirstNativeHeader("userInput");
        String rawStreamKeys = headerAccessor.getFirstNativeHeader("streamKeys");
        if (userInput == null || userInput.isEmpty()) {
            channel.sendError(new IllegalArgumentException("userInput header is required"));
            return () -> {};
        }
        Principal user = headerAccessor.getUser();
        if (user == null) {
            channel.sendError(new IllegalArgumentException("User header is required"));
            return () -> {};
        }
        String username = user.getName();
        if (username == null || username.isEmpty()) {
            channel.sendError(new IllegalArgumentException("Username is required"));
            return () -> {};
        }

        genAiService.subscribe(username, userInput, rawStreamKeys, channel);
        return () -> genAiService.unsubscribe(channel);
    }
}
