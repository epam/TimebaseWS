package com.epam.deltix.tbwg.webapp.security;

import com.epam.deltix.tbwg.webapp.services.authorization.TbwgUser;
import com.epam.deltix.tbwg.webapp.services.authorization.UsersProvider;
import com.epam.deltix.tbwg.webapp.settings.SecurityOauth2ProviderSettings;
import com.epam.deltix.tbwg.webapp.settings.SecurityOauth2ServerSettings;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.server.authorization.client.InMemoryRegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClient;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.config.annotation.web.configuration.OAuth2AuthorizationServerConfiguration;
import org.springframework.security.oauth2.server.authorization.config.annotation.web.configurers.OAuth2AuthorizationServerConfigurer;
import org.springframework.security.oauth2.server.authorization.settings.AuthorizationServerSettings;
import org.springframework.security.oauth2.server.authorization.settings.TokenSettings;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.beans.factory.annotation.Autowired;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Configuration
@EnableWebSecurity
@ConditionalOnProperty(value = "security.oauth2.provider.providerType", havingValue = "BUILT_IN_OAUTH", matchIfMissing = true)
public class AuthorizationServerConfig {

    @Autowired
    private UsersProvider usersProvider;

    @Autowired
    private SecurityOauth2ServerSettings securityOauth2ServerSettings;

    @Autowired
    private SecurityOauth2ProviderSettings securityOauth2ProviderSettings;

    @Bean
    @Order(1)
    public SecurityFilterChain authorizationServerSecurityFilterChain(HttpSecurity http) throws Exception {
        OAuth2AuthorizationServerConfiguration.applyDefaultSecurity(http);
        http.getConfigurer(OAuth2AuthorizationServerConfigurer.class)
                .oidc(Customizer.withDefaults());	// Enable OpenID Connect 1.0
        return http.build();
    }

    @Bean
    public RegisteredClientRepository registeredClientRepository() {
        List<RegisteredClient> clients = new ArrayList<>();
        for (TbwgUser user : usersProvider.getUsers()) {
            clients.add(RegisteredClient.withId(UUID.randomUUID().toString())
                    .clientId(user.getUsername())
                    .clientSecret(user.getPassword())
                    .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_POST)
                    .authorizationGrantType(AuthorizationGrantType.CLIENT_CREDENTIALS)
                    .scopes((scopes) -> scopes.addAll(securityOauth2ProviderSettings.getScopes()))
                    .tokenSettings(
                            TokenSettings.builder()
                                    .accessTokenTimeToLive(
                                            Duration.ofSeconds(securityOauth2ServerSettings.getAccessTokenValiditySeconds())
                                    ).build()
                    )
                    .build()
            );
        }

        return new InMemoryRegisteredClientRepository(clients);
    }

    @Bean
    public JWKSource<SecurityContext> jwkSource() {
        KeyPair keyPair = generateRsaKey();
        RSAPublicKey publicKey = (RSAPublicKey) keyPair.getPublic();
        RSAPrivateKey privateKey = (RSAPrivateKey) keyPair.getPrivate();
        RSAKey rsaKey = new RSAKey.Builder(publicKey)
                .privateKey(privateKey)
                .keyID(UUID.randomUUID().toString())
                .build();
        JWKSet jwkSet = new JWKSet(rsaKey);
        return new ImmutableJWKSet<>(jwkSet);
    }

    private static KeyPair generateRsaKey() {
        KeyPair keyPair;
        try {
            KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance("RSA");
            keyPairGenerator.initialize(2048);
            keyPair = keyPairGenerator.generateKeyPair();
        }
        catch (Exception ex) {
            throw new IllegalStateException(ex);
        }
        return keyPair;
    }

    @Bean
    public JwtDecoder jwtDecoder(JWKSource<SecurityContext> jwkSource) {
        return OAuth2AuthorizationServerConfiguration.jwtDecoder(jwkSource);
    }

    @Bean
    public AuthorizationServerSettings authorizationServerSettings() {
        return AuthorizationServerSettings.builder().build();
    }

}

