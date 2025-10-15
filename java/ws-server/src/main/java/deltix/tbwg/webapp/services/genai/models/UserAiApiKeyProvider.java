package deltix.tbwg.webapp.services.genai.models;

import deltix.tbwg.webapp.services.authorization.SettingsAuthorizationProvider;
import deltix.tbwg.webapp.services.authorization.TbwgUser;
import deltix.tbwg.webapp.settings.AiApiSettings;
import org.springframework.stereotype.Service;

@Service
public class UserAiApiKeyProvider {

    private final SettingsAuthorizationProvider usersProvider;
    private final AiApiSettings globalSettings;

    public UserAiApiKeyProvider(SettingsAuthorizationProvider usersProvider,
                                AiApiSettings globalSettings) {
        this.usersProvider = usersProvider;
        this.globalSettings = globalSettings;
    }

    public String resolve(String username) {
        String cfgKey = globalSettings.findUserKey(username);
        if (cfgKey != null && !cfgKey.isBlank()) {
            return cfgKey;
        }

        if (username != null && !username.isBlank()) {
            TbwgUser user = usersProvider.getUser(username);
            if (user != null && user.getAiApiKey() != null && !user.getAiApiKey().isBlank()) {
                return user.getAiApiKey();
            }
        }
        throw new IllegalStateException("No AI API key configured for user: " + username);
    }
}
