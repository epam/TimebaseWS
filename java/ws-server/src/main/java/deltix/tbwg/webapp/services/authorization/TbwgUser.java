package deltix.tbwg.webapp.services.authorization;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.User;

import java.util.ArrayList;
import java.util.Collection;

public class TbwgUser extends User {

    private final String aiApiKey;

    public static TbwgUser create(String name, String password) {
        return new TbwgUser(name, password, new ArrayList<>(), null);
    }

    public TbwgUser(String username,
                    String password,
                    Collection<? extends GrantedAuthority> authorities,
                    String aiApiKey) {
        super(username, password, authorities);
        this.aiApiKey = aiApiKey;
    }

    public String getAiApiKey() {
        return aiApiKey;
    }
}
