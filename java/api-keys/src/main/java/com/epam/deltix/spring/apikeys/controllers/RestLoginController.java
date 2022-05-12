/*
 * Copyright 2021 EPAM Systems, Inc
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
package com.epam.deltix.spring.apikeys.controllers;

import com.epam.deltix.spring.apikeys.model.LoginAttemptDto;
import com.epam.deltix.spring.apikeys.model.LoginConfirmationDto;
import com.epam.deltix.spring.apikeys.model.SuccessfulLoginConfirmationDto;
import com.epam.deltix.spring.apikeys.utils.RequestUtils;
import com.epam.deltix.spring.apikeys.SessionService;
import com.epam.deltix.spring.apikeys.model.SuccessfulLoginAttemptDto;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.math.BigInteger;
import java.net.InetAddress;
import java.util.Base64;

@RestController
@RequestMapping("${security.api-keys.sessions.login-root:session/login}")
@ConditionalOnBean(SessionService.class)
public class RestLoginController {

    private final SessionService sessionService;

    public RestLoginController(final SessionService sessionService) {
        this.sessionService = sessionService;
    }

    /**
     * Attempt to login using API key.
     *`
     * @param loginAttempt Login attempt parameters.
     * @return Login attempt result with parameters needed to confirm a login.
     */
    @RequestMapping(value = "/attempt", method = RequestMethod.POST)
    public SuccessfulLoginAttemptDto loginAttempt(@RequestBody LoginAttemptDto loginAttempt) {
        if (loginAttempt.getApiKeyId() == null) {
            throw new IllegalArgumentException("api_key_id");
        }

        return sessionService.loginAttempt(loginAttempt.getApiKeyId());
    }

    /**
     * Confirm a login using API key.
     *
     * @param loginConfirmation Login confirm parameters.
     * @return Login confirm result with parameters needed to finish constructing a session key.
     */
    @RequestMapping(value = "/confirm", method = RequestMethod.POST)
    public SuccessfulLoginConfirmationDto loginConfirm(HttpServletRequest request,
                                                       @RequestBody LoginConfirmationDto loginConfirmation) throws Exception
    {
        if (loginConfirmation.getSessionId() == null) {
            throw new IllegalArgumentException("session_id");
        }
        if (loginConfirmation.getSignature() == null) {
            throw new IllegalArgumentException("signature");
        }
        if (loginConfirmation.getDhKey() == null) {
            throw new IllegalArgumentException("dh_key");
        }

        return sessionService.loginConfirmation(
            loginConfirmation.getSessionId(),
            Base64.getDecoder().decode(loginConfirmation.getSignature()),
            new BigInteger(Base64.getDecoder().decode(loginConfirmation.getDhKey())),
            InetAddress.getByName(RequestUtils.getRemote(request))
        );
    }

    /**
     * Request for keeping the API key session alive.
     */
    @RequestMapping(value = "keepalive", method = RequestMethod.POST)
    public void keepAlive(HttpServletRequest request)
    {
        final String sessionId = RequestUtils.getSessionFromRequest(request);
        sessionService.keepAlive(sessionId);
    }

    /**
     * Request for removing the API key session.
    */
    @RequestMapping(value = "logout", method = RequestMethod.POST)
    public void logout(HttpServletRequest request) {
        final String sessionId = RequestUtils.getSessionFromRequest(request);
        sessionService.deleteSession(sessionId);
    }
}
