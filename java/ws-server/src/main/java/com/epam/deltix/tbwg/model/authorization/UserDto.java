package com.epam.deltix.tbwg.model.authorization;

import org.jetbrains.annotations.NotNull;

import java.util.List;

public class UserDto {

    @NotNull
    private String username;

    private String password;

    @NotNull
    private List<String> authorities;

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public List<String> getAuthorities() {
        return authorities;
    }

    public void setAuthorities(List<String> authorities) {
        this.authorities = authorities;
    }
}
