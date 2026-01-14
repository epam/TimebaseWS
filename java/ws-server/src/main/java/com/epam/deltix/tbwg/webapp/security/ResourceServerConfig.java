/*
 * Copyright 2024 EPAM Systems, Inc
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
package com.epam.deltix.tbwg.webapp.security;

import com.epam.deltix.spring.apikeys.ApiKeysFilterProvider;
import com.epam.deltix.tbwg.webapp.security.jwt.AudienceValidator;
import com.epam.deltix.tbwg.webapp.security.jwt.JwtAuthenticationConverterImpl;
import com.epam.deltix.tbwg.webapp.settings.SecurityOauth2ProviderSettings;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.security.oauth2.resource.OAuth2ResourceServerProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.security.config.annotation.web.configurers.CsrfConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.annotation.web.configurers.RequestCacheConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.firewall.DefaultHttpFirewall;
import org.springframework.security.web.firewall.HttpFirewall;

import static com.epam.deltix.tbwg.webapp.config.WebMvcConfig.GRAFANA_API_PREFIX;
import static com.epam.deltix.tbwg.webapp.config.WebMvcConfig.MAIN_API_PREFIX;

@EnableWebSecurity()
@Configuration
public class ResourceServerConfig {

    private final OAuth2ResourceServerProperties.Jwt jwtConfig;
    private final SecurityOauth2ProviderSettings providerConfig;
    private final JwtAuthenticationConverterImpl jwtAuthenticationConverter;
    private final ApiKeysFilterProvider apiKeysFilterProvider;
    private final String contentSecurityPolicy;

    @Autowired
    public ResourceServerConfig(OAuth2ResourceServerProperties config,
                                SecurityOauth2ProviderSettings providerConfig,
                                JwtAuthenticationConverterImpl jwtAuthenticationConverter,
                                ApiKeysFilterProvider apiKeysFilterProvider,
                                @Value("${security.oauth2.contentSecurityPolicy:}") String contentSecurityPolicy)
    {
        this.jwtConfig = config.getJwt();
        this.providerConfig = providerConfig;
        this.jwtAuthenticationConverter = jwtAuthenticationConverter;
        this.apiKeysFilterProvider = apiKeysFilterProvider;
        this.contentSecurityPolicy = contentSecurityPolicy;

        if (jwtConfig == null) {
            throw new RuntimeException("Jwt config is missing. Please specify spring.security.oauth2.resourceserver.jwt config.");
        }
    }

    @Bean
    @Order(2)
    public SecurityFilterChain filterChain(final HttpSecurity http) throws Exception {
        http
            // Workaround for strict URI parsing when '%' appears in the request path
            .requestCache(RequestCacheConfigurer::disable)
            //.cors().and()
            .authorizeHttpRequests(auth ->
                auth
                    .requestMatchers("/ping").permitAll()
                    .requestMatchers(MAIN_API_PREFIX + "/v").permitAll()
                    .requestMatchers(MAIN_API_PREFIX + "/docs/**").permitAll()
                    .requestMatchers(MAIN_API_PREFIX + "/authInfo").permitAll()
                    .requestMatchers(MAIN_API_PREFIX + "/download").permitAll()
                    .requestMatchers(MAIN_API_PREFIX + "/**").fullyAuthenticated()
//                    .requestMatchers(WS_API_PREFIX + "/**").fullyAuthenticated()
                    .requestMatchers(GRAFANA_API_PREFIX + "/**").fullyAuthenticated()
                    .anyRequest().permitAll()
            ).csrf(csrf ->
                csrf.ignoringRequestMatchers("/session/login/**") // ignore session login
            ).oauth2ResourceServer(oauth2 ->
                oauth2.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter))
            );

        http.headers(headers -> headers.frameOptions(HeadersConfigurer.FrameOptionsConfig::sameOrigin));
        http.addFilterBefore(apiKeysFilterProvider.getInstance(), BearerTokenAuthenticationFilter.class);
        CsrfConfigurer<?> csrf = http.getConfigurer(CsrfConfigurer.class);
        if (csrf != null) {
            csrf.ignoringRequestMatchers(apiKeysFilterProvider.getInstance());
        }
        if (isContentSecurityPolicyConfigured()) {
            http.headers(headers -> headers.contentSecurityPolicy(c -> c.policyDirectives(contentSecurityPolicy)));
        }

        return http.build();
    }

    @Bean
    @ConditionalOnProperty(value = "security.oauth2.provider.providerType", havingValue = "SSO", matchIfMissing = true)
    public JwtDecoder jwtDecoder() {
        NimbusJwtDecoder jwtDecoder = JwtDecoders.fromIssuerLocation(jwtConfig.getIssuerUri());

        OAuth2TokenValidator<Jwt> validator;
        if (providerConfig.isValidateIssuer()) {
            validator = JwtValidators.createDefaultWithIssuer(jwtConfig.getIssuerUri());
        } else {
            validator = JwtValidators.createDefault();
        }

        if (providerConfig.getAudience() != null && !providerConfig.getAudience().isEmpty()) {
            OAuth2TokenValidator<Jwt> audienceValidator = new AudienceValidator(providerConfig.getAudience());
            validator = new DelegatingOAuth2TokenValidator<>(validator, audienceValidator);
        }

        jwtDecoder.setJwtValidator(validator);

        return jwtDecoder;
    }

    // Encoded slashes fix
    @Bean
    public HttpFirewall allowUrlEncodedSlashHttpFirewall() {
        DefaultHttpFirewall firewall = new DefaultHttpFirewall();
        firewall.setAllowUrlEncodedSlash(true);
        return firewall;
    }

    @Bean
    public WebSecurityCustomizer webSecurityCustomizer() {
        return web -> web.httpFirewall(allowUrlEncodedSlashHttpFirewall());
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    public boolean isContentSecurityPolicyConfigured() {
        return contentSecurityPolicy != null && !contentSecurityPolicy.isEmpty();
    }
}