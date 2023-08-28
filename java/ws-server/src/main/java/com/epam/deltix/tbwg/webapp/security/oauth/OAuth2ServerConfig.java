/*
 * Copyright 2023 EPAM Systems, Inc
 *
 * See the NOTICE file distributed with this work for additional information
 * regarding copyright ownership. Licensed under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

package com.epam.deltix.tbwg.webapp.security.oauth;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.tbwg.webapp.security.TokenService;
import com.epam.deltix.tbwg.webapp.services.authorization.TbwgUser;
import com.epam.deltix.tbwg.webapp.services.authorization.UsersProvider;
import com.epam.deltix.tbwg.webapp.settings.OAuthConfig;
import com.epam.deltix.tbwg.webapp.settings.SecurityOauth2ProviderSettings;
import com.epam.deltix.tbwg.webapp.settings.SecurityOauth2ServerSettings;
import com.epam.deltix.tbwg.webapp.utils.SignatureUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Conditional;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.config.annotation.configurers.ClientDetailsServiceConfigurer;
import org.springframework.security.oauth2.config.annotation.web.configuration.*;
import org.springframework.security.oauth2.config.annotation.web.configurers.AuthorizationServerEndpointsConfigurer;
import org.springframework.security.oauth2.config.annotation.web.configurers.AuthorizationServerSecurityConfigurer;
import org.springframework.security.oauth2.provider.token.DefaultTokenServices;
import org.springframework.security.oauth2.provider.token.RemoteTokenServices;
import org.springframework.security.oauth2.provider.token.ResourceServerTokenServices;
import org.springframework.security.oauth2.provider.token.TokenStore;
import org.springframework.security.oauth2.provider.token.store.JwtAccessTokenConverter;
import org.springframework.security.oauth2.provider.token.store.JwtTokenStore;
import org.springframework.security.web.firewall.DefaultHttpFirewall;
import org.springframework.security.web.firewall.HttpFirewall;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;

import java.security.NoSuchAlgorithmException;

import static com.epam.deltix.tbwg.webapp.config.WebMvcConfig.GRAFANA_API_PREFIX;
import static com.epam.deltix.tbwg.webapp.config.WebMvcConfig.MAIN_API_PREFIX;

/**
 *
 */
@Configuration
@Conditional(OAuthConfig.class)
@EnableWebSecurity
@SuppressWarnings("deprecation")
public class OAuth2ServerConfig {

    private static final Log LOG = LogFactory.getLog(OAuth2ServerConfig.class);

    @Configuration
    @EnableAuthorizationServer
    @ConditionalOnProperty(value = "security.oauth2.provider.providerType", havingValue = "BUILT_IN_OAUTH")
    protected static class AuthorizationServerConfiguration extends AuthorizationServerConfigurerAdapter {

        @Autowired
        private AuthenticationManager authenticationManager;

        @Autowired
        private SecurityOauth2ServerSettings securityOauth2ServerSettings;

        @Autowired
        private GatewayUserDetailsService gatewayUserDetailsService;

        @PostConstruct
        public void logInit() {
            LOG.info().append("Initialized built-in Authorization Server.").commit();
        }

        @Override
        public void configure(AuthorizationServerEndpointsConfigurer endpoints) throws Exception {
            endpoints
                    .tokenStore(tokenStore())
                    .accessTokenConverter(accessTokenConverter())
                    .authenticationManager(authenticationManager)
                    .userDetailsService(gatewayUserDetailsService);
        }

        @Override
        public void configure(AuthorizationServerSecurityConfigurer oauthServer) throws Exception {
            oauthServer.checkTokenAccess("isAuthenticated()")
                    .allowFormAuthenticationForClients();
        }

        @Override
        public void configure(ClientDetailsServiceConfigurer clients) throws Exception {
            clients.inMemory()
                .withClient(securityOauth2ServerSettings.getClientId())
                .secret(securityOauth2ServerSettings.getSecret())
                .authorizedGrantTypes(securityOauth2ServerSettings.getAuthorizedGrantTypes().toArray(new String[0]))
                .scopes(securityOauth2ServerSettings.getScopes().toArray(new String[0]))
                .accessTokenValiditySeconds(securityOauth2ServerSettings.getAccessTokenValiditySeconds())
                .refreshTokenValiditySeconds(securityOauth2ServerSettings.getRefreshTokenValiditySeconds())
                .autoApprove(true);
        }

        /**
         * JWT token store to be used both by authorization and resource server.
         *
         * @return Token store bean
         */
        @Bean
        public TokenStore tokenStore() {
            return new JwtTokenStore(accessTokenConverter());
        }

        /**
         * Access token converter to be used by token store. Required both for authorization and resource server.
         * Will be used to retrieve user SID information from JWT token and populate it to {@code Authentication} object.
         *
         * @return Access token converter bean
         */
        @Bean
        public JwtAccessTokenConverter accessTokenConverter() {
            JwtAccessTokenConverter converter = new JwtAccessTokenConverter();

            String privateKey = securityOauth2ServerSettings.getPrivateKey();
            if (privateKey == null || privateKey.isEmpty()) {
                try {
                    LOG.warn().append("Token signing keys are not specified. Signing key will be generated. " +
                            "Please, specify security.oauth2.privateKey and security.oauth2.publicKey properties.")
                        .commit();
                    converter.setKeyPair(SignatureUtils.generateRsaPair());
                } catch (NoSuchAlgorithmException e) {
                    throw new RuntimeException(e);
                }
            } else {
                converter.setSigningKey(privateKey);
                converter.setVerifierKey(securityOauth2ServerSettings.getPublicKey());
            }
            return converter;
        }

        /**
         * Token services bean.
         *
         * @return Token services bean
         */
        @Bean
        @Primary
        public DefaultTokenServices tokenServices() {
            DefaultTokenServices defaultTokenServices = new DefaultTokenServices();
            defaultTokenServices.setTokenStore(tokenStore());
            defaultTokenServices.setSupportRefreshToken(true);
            return defaultTokenServices;
        }
    }

    @Configuration
    @EnableResourceServer
    @Conditional(OAuthConfig.class)
    protected static class ResourceServerConfiguration extends ResourceServerConfigurerAdapter {

        @Autowired
        private SecurityOauth2ProviderSettings settings;

        @Override
        public void configure(HttpSecurity http) throws Exception {
            http.authorizeRequests()
                    .antMatchers("/ws/v0/**").fullyAuthenticated()
                    .antMatchers("/ping").permitAll()
                    .antMatchers("/api/v0/v").permitAll()
                    .antMatchers("/api/v0/docs/**").permitAll()
                    .antMatchers("/api/v0/authInfo").permitAll()
                    .antMatchers("/api/v0/download").permitAll()
                    .antMatchers(MAIN_API_PREFIX + "/**").fullyAuthenticated()
                    .antMatchers(GRAFANA_API_PREFIX + "/**").fullyAuthenticated();
            http.headers()
                .frameOptions().sameOrigin();
        }

        @ConditionalOnProperty(value = "security.oauth2.provider.providerType", havingValue = "EXTERNAL_AUTH")
        @Bean
        @Primary
        public RemoteTokenServices tokenService() {
            RemoteTokenServices tokenService = new RemoteTokenServices();
            tokenService.setCheckTokenEndpointUrl(settings.getOauthServer() + settings.getCheckTokenEndpoint());
            tokenService.setClientId(settings.getClientId());
            tokenService.setClientSecret(settings.getClientSecret());
            return tokenService;
        }

        @Component
        @SuppressWarnings("deprecation")
        @Conditional(OAuthConfig.class)
        public class BuiltInTokenService implements TokenService {

            private final ResourceServerTokenServices tokenServices;

            @Autowired
            public BuiltInTokenService(ResourceServerTokenServices tokenServices) {
                this.tokenServices = tokenServices;
            }

            @Override
            public Authentication extract(String token) {
                return tokenServices.loadAuthentication(token);
            }
        }
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public HttpFirewall allowUrlEncodedSlashHttpFirewall() {
        DefaultHttpFirewall firewall = new DefaultHttpFirewall();
        firewall.setAllowUrlEncodedSlash(true);
        return firewall;
    }

    @Autowired
    private UsersProvider usersProvider;

    @Autowired
    protected void configureGlobal(AuthenticationManagerBuilder auth) throws Exception {
        for (TbwgUser user : usersProvider.getUsers()) {
            auth.inMemoryAuthentication()
                    .withUser(user.getUsername())
                    .password(user.getPassword())
                    .authorities(user.getAuthorities().toArray(new GrantedAuthority[0]));
        }
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public WebSecurityCustomizer webSecurityCustomizer() {
        return web -> web.httpFirewall(allowUrlEncodedSlashHttpFirewall());
    }

}
