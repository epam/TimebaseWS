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
package com.epam.deltix.spring.apikeys;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.spring.apikeys.model.SuccessfulLoginConfirmationDto;
import com.epam.deltix.spring.apikeys.settings.SessionServiceSettings;
import com.epam.deltix.spring.apikeys.model.SuccessfulLoginAttemptDto;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.authentication.InsufficientAuthenticationException;

import java.math.BigInteger;
import java.net.InetAddress;
import java.security.SecureRandom;
import java.util.*;
import java.util.concurrent.locks.ReentrantReadWriteLock;

public class SessionServiceImpl implements SessionService {

    private static final Log LOGGER = LogFactory.getLog(SessionServiceImpl.class);

    private final Map<String, SessionInfo> unconfirmedSessions = new HashMap<>();
    private final ReentrantReadWriteLock activeSessionsLock = new ReentrantReadWriteLock();
    private final Map<String, SessionInfo> activeSessions = new HashMap<>();

    private final SessionServiceSettings sessionServiceSettings;
    private final long confirmSessionTimerThresholdNs;
    private final SessionLoginService sessionLoginService;

    private final SecureRandom secureRandom;

    public SessionServiceImpl(SessionServiceSettings sessionServiceSettings, SessionLoginService sessionLoginService) {
        this.sessionServiceSettings = sessionServiceSettings;
        this.sessionLoginService = sessionLoginService;
        this.confirmSessionTimerThresholdNs = sessionServiceSettings.getKeepAliveTimerMs() * 1_000_000;
        this.secureRandom = initSecureRandom();
    }

    private SecureRandom initSecureRandom() {
        try {
            return SecureRandom.getInstance("NativePRNGNonBlocking");
        } catch (Throwable t) {
            return new SecureRandom();
        }
    }

    @Scheduled(fixedRateString = "${sessionService.keepAliveLoginTimerMs:1000}")
    public void confirmSessionTimer() {
        long st = System.nanoTime();

        try {
            long maxKeepAliveTime = System.currentTimeMillis() - sessionServiceSettings.getKeepAliveLoginMs();
            synchronized (unconfirmedSessions) {
                unconfirmedSessions.entrySet().removeIf(session -> {
                    if (session.getValue().getTimeout() < maxKeepAliveTime) {
                        LOGGER.info().append("Unconfirmed API Key session removed by timeout: ").append(session).commit();
                        return true;
                    }
                    return false;
                });
            }
        } catch (Throwable ex) {
            LOGGER.error().append("Unexpected exception in confirmSessionTimer: ").append(ex).commit();
        } finally {
            long et = System.nanoTime();
            // todo:
            if (et - st > confirmSessionTimerThresholdNs) {
                LOGGER.warn().append("confirmSessionTimer took too much time to execute: ").append((et - st) / 1_000_000_000.0).append("s").commit();
            }
        }
    }
    @Scheduled(fixedRateString = "${sessionService.keepAliveTimerMs:60000}")
    public void keepAliveTimer() {
        long st = System.nanoTime(); // todo

        try {
            long now = System.currentTimeMillis();
            long maxKeepAliveTime = now - sessionServiceSettings.getKeepAliveMs();

            activeSessionsLock.writeLock().lock();
            try {
                activeSessions.entrySet().removeIf(session -> {
                    if (session.getValue().getTimeout() < maxKeepAliveTime) {
                        LOGGER.info().append("Session removed by timeout: ").append(session).commit();
                        return true;
                    }
                    return false;
                });
            } finally {
                activeSessionsLock.writeLock().unlock();
            }
        } catch (Throwable ex) {
            LOGGER.error().append("Unexpected exception in keepAliveTimer: ").append(ex).commit();
        } finally {
            // todo:
            long et = System.nanoTime();
            if (et - st > confirmSessionTimerThresholdNs) {
                LOGGER.warn().append("keepAliveTimer took too much time to execute: ").append((et - st) / 1_000_000_000.0).append("s").commit();
            }
        }
    }

    @Override
    public SuccessfulLoginAttemptDto loginAttempt(String apiKeyId) {
        SessionInfo session = new SessionInfo(
            UUID.randomUUID().toString(), apiKeyId,
            sessionServiceSettings.getDhBase(), sessionServiceSettings.getDhModulus(),
            sessionServiceSettings.getDhSecretSize(), sessionServiceSettings.getChallengeSize(),
            secureRandom
        );

        session.setTimeout(System.currentTimeMillis());
        LOGGER.info().append("Created API Key session: ").append(session).commit();

        addUnconfirmedSession(session);

        SuccessfulLoginAttemptDto loginAttemptDto = new SuccessfulLoginAttemptDto();
        loginAttemptDto.setTtl(session.getTimeout() + sessionServiceSettings.getKeepAliveLoginMs());
        loginAttemptDto.setDhModulus(sessionServiceSettings.getDhModulusB64());
        loginAttemptDto.setDhBase(sessionServiceSettings.getDhBaseB64());
        loginAttemptDto.setChallenge(Base64.getEncoder().encodeToString(session.getChallenge()));
        loginAttemptDto.setSessionId(session.getSessionId());
        return loginAttemptDto;
    }

    @Override
    public SuccessfulLoginConfirmationDto loginConfirmation(String sessionId, byte[] signature, BigInteger dhClientKey, InetAddress inetAddress) {
        final SessionInfo session = getUnconfirmedSession(sessionId);
        if (session == null) {
            throw new IllegalArgumentException("Attempt login session not found: " + sessionId);
        }

        if (session.isConfirmationInProgress()) {
            throw new IllegalStateException("Session confirm is already in progress.");
        }

        try {
            LOGGER.info().append("Session ").append(sessionId).append(" login in progress...").commit();
            ApiKeyInfo apiKeyInfo = sessionLoginService.login(
                session.getApiKeyId(), session.getChallenge(), signature, inetAddress
            );

            session.initSessionSecret(dhClientKey);
            session.setApiKeyInfo(apiKeyInfo);
            session.setTimeout(System.currentTimeMillis());

            addActiveSession(session);
            LOGGER.info().append("Added session to cache: ").append(session).commit();

            SuccessfulLoginConfirmationDto confirmationDto = new SuccessfulLoginConfirmationDto();
            confirmationDto.setDhKey(Base64.getEncoder().encodeToString(session.generateDhKey().toByteArray()));
            confirmationDto.setKeepaliveTimeout(sessionServiceSettings.getKeepAliveMs());
            return confirmationDto;
        } catch (Exception e) {
            throw new InsufficientAuthenticationException("Session confirmation failed. Check your signature");
        } finally {
            removeUnconfirmedSession(sessionId);
        }
    }

    @Override
    public void keepAlive(String sessionId) {
        activeSessionsLock.readLock().lock();
        try {
            final SessionInfo session = activeSessions.get(sessionId);
            if (session == null) {
                throw new IllegalArgumentException("Session not found: " + sessionId);
            }
            session.setTimeout(System.currentTimeMillis());
        } finally {
            activeSessionsLock.readLock().unlock();
        }
    }

    @Override
    public void deleteSession(String sessionId) {
        final SessionInfo session;
        activeSessionsLock.writeLock().lock();
        try {
            session = activeSessions.get(sessionId);
            if (session == null) {
                throw new IllegalArgumentException("Session not found: " + sessionId);
            }
            activeSessions.remove(sessionId);
            session.setTimeout(0);
            sessionLoginService.logout(session.getApiKeyInfo());
        } finally {
            activeSessionsLock.writeLock().unlock();
        }
    }

    @Override
    public boolean checkNonce(String sessionId, long nonce) {
        activeSessionsLock.readLock().lock();
        try {
            SessionInfo session = activeSessions.get(sessionId);
            if (session == null) {
                throw new IllegalArgumentException("Unknown session: " + sessionId);
            }

            long sessionNonce = session.getNonce();
            if (sessionNonce >= nonce) {
                return false;
            }

            session.setNonce(nonce);
            return true;
        } finally {
            activeSessionsLock.readLock().unlock();
        }
    }

    @Override
    public ApiKeyInfo checkSession(String sessionId, String payload, String signature) {
        if (sessionId == null)
            return null;

        activeSessionsLock.readLock().lock();
        try {
            SessionInfo session = activeSessions.get(sessionId);
            if (session == null) {
                throw new IllegalArgumentException("Unknown session: " + sessionId);
            }

            if (!(session.verifySignature(payload, signature))) {
                throw new InsufficientAuthenticationException("Invalid signature (failed verification)");
            }

            return session.getApiKeyInfo();
        } finally {
            activeSessionsLock.readLock().unlock();
        }
    }

    private void addUnconfirmedSession(SessionInfo session) {
        synchronized (unconfirmedSessions) {
            unconfirmedSessions.put(session.getSessionId(), session);
        }
    }

    private SessionInfo getUnconfirmedSession(String sessionId) {
        synchronized (unconfirmedSessions) {
            return unconfirmedSessions.get(sessionId);
        }
    }

    private void removeUnconfirmedSession(String sessionId) {
        synchronized (unconfirmedSessions) {
            unconfirmedSessions.remove(sessionId);
        }
    }

    private void addActiveSession(SessionInfo session) {
        activeSessionsLock.writeLock().lock();
        try {
            activeSessions.put(session.getSessionId(), session);
        } finally {
            activeSessionsLock.writeLock().unlock();
        }
    }

}
