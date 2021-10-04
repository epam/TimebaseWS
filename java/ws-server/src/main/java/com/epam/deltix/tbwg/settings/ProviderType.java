package com.epam.deltix.tbwg.settings;

public enum ProviderType {
    /**
     * using simple built-in OAuth2 authorization server
     */
    BUILT_IN_OAUTH,
    /**
     * using external OAuth2 authorization server
     */
    EXTERNAL_OAUTH,
    /**
     * using Deltix SSO
     */
    SSO
}
