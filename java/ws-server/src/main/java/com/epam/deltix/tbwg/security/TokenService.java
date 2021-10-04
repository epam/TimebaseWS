package com.epam.deltix.tbwg.security;

import org.springframework.security.core.Authentication;

public interface TokenService {

    Authentication          extract(String token);

}
