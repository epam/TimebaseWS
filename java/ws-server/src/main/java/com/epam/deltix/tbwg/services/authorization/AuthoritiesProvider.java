package com.epam.deltix.tbwg.services.authorization;

import org.springframework.security.core.GrantedAuthority;

import java.util.List;

public interface AuthoritiesProvider {

    List<GrantedAuthority>      getAuthorities(String username);

}
