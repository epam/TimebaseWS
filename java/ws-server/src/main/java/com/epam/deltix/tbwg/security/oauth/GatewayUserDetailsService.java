package com.epam.deltix.tbwg.security.oauth;

import com.epam.deltix.tbwg.services.authorization.AuthoritiesProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class GatewayUserDetailsService implements UserDetailsService {

    private final AuthoritiesProvider authoritiesProvider;

    @Autowired
    public GatewayUserDetailsService(AuthoritiesProvider authoritiesProvider) {
        this.authoritiesProvider = authoritiesProvider;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        if (username == null || username.equals("")) {
            throw new IllegalArgumentException("Username cannot be blank.");
        }

        return new User(username, "", authoritiesProvider.getAuthorities(username));
    }

}
