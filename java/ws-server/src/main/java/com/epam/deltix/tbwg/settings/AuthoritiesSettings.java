package com.epam.deltix.tbwg.settings;

import com.epam.deltix.tbwg.model.authorization.UserDto;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@ConfigurationProperties(prefix = "security.oauth2")
public class AuthoritiesSettings {

    private List<UserDto> users = new ArrayList<>();

    public List<UserDto> getUsers() {
        return users;
    }

    public void setUsers(List<UserDto> users) {
        this.users = users;
    }

}
