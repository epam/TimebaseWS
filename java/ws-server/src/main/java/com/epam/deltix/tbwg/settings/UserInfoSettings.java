package com.epam.deltix.tbwg.settings;

import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class UserInfoSettings {

    private boolean enable;

    private String userInfoUrl;

    private List<String> usernameKey;

    public boolean isEnable() {
        return enable;
    }

    public void setEnable(boolean enable) {
        this.enable = enable;
    }

    public String getUserInfoUrl() {
        return userInfoUrl;
    }

    public void setUserInfoUrl(String userInfoUrl) {
        this.userInfoUrl = userInfoUrl;
    }

    public List<String> getUsernameKey() {
        return usernameKey;
    }

    public void setUsernameKey(List<String> usernameKey) {
        this.usernameKey = usernameKey;
    }
}
