package deltix.tbwg.webapp.settings;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@ConfigurationProperties(prefix = "ai-api")
@Getter
@Setter
@ToString(exclude = {"keys"})
@ConditionalOnExpression("${ai-api.enabled:false}")
public class AiApiSettings {
    private boolean enabled;
    private String endpointUrl;
    private List<UserKey> keys;
    private String deploymentName;
    private String embeddingDeploymentName;
    private int maxAttempts;

    @Getter
    @Setter
    public static class UserKey {
        private String username;
        private String key;
    }

    public String findUserKey(String username) {
        if (username == null || keys == null) return null;
        return keys.stream()
                .filter(k -> username.equalsIgnoreCase(k.getUsername()))
                .map(UserKey::getKey)
                .filter(v -> v != null && !v.isBlank())
                .findFirst()
                .orElse(null);
    }
}
