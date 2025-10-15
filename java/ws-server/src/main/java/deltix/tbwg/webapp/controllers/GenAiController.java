package deltix.tbwg.webapp.controllers;

import deltix.tbwg.webapp.config.WebSocketConfig;
import deltix.tbwg.webapp.services.genai.GenAiService;
import deltix.tbwg.webapp.settings.AiApiSettings;
import deltix.tbwg.webapp.websockets.subscription.Subscription;
import deltix.tbwg.webapp.websockets.subscription.SubscriptionChannel;
import deltix.tbwg.webapp.websockets.subscription.SubscriptionController;
import deltix.tbwg.webapp.websockets.subscription.SubscriptionControllerRegistry;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;

@Controller
@CrossOrigin
@ConditionalOnBean(AiApiSettings.class)
public class GenAiController implements SubscriptionController {

    private final GenAiService genAiService;

    @Autowired
    public GenAiController(SubscriptionControllerRegistry registry,
                           GenAiService genAiService) {
        registry.register(WebSocketConfig.GENAI_QQL_TOPIC, this);
        this.genAiService = genAiService;
    }

    @Override
    public Subscription onSubscribe(SimpMessageHeaderAccessor headerAccessor, SubscriptionChannel channel) {
        String userInput = headerAccessor.getFirstNativeHeader("userInput");
        String rawStreamKeys = headerAccessor.getFirstNativeHeader("streamKeys");
        String username = headerAccessor.getUser().getName();
        if (userInput == null || userInput.isEmpty()) {
            channel.sendError(new IllegalArgumentException("userInput header is required"));
        }
        if (username == null || username.isEmpty()) {
            channel.sendError(new IllegalArgumentException("Username is required"));
        }

        genAiService.subscribe(username, userInput, rawStreamKeys, channel);
        return () -> genAiService.unsubscribe(channel);
    }
}
