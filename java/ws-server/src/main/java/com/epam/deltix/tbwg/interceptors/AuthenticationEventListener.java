package com.epam.deltix.tbwg.interceptors;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import org.springframework.context.ApplicationListener;
import org.springframework.security.authentication.event.AuthenticationSuccessEvent;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

@Component
public class AuthenticationEventListener implements ApplicationListener<AuthenticationSuccessEvent> {

    private static final Log LOGGER = LogFactory.getLog(AuthenticationEventListener.class);

    @Override
    public void onApplicationEvent(AuthenticationSuccessEvent event) {
        Authentication authentication = event.getAuthentication();
        Object principalObj = authentication.getPrincipal();
        if (principalObj instanceof UserDetails) {
            UserDetails userDetails = (UserDetails) principalObj;
            LOGGER.info().append("Login: ").append(userDetails.getUsername()).commit();
        }
    }
}
