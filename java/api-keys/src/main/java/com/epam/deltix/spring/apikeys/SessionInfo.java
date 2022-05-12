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

import com.epam.deltix.spring.apikeys.utils.HmacUtils;

import java.math.BigInteger;
import java.security.SecureRandom;
import java.util.concurrent.atomic.AtomicBoolean;

public class SessionInfo {

    private final String sessionId;
    private final String apiKeyId;
    private final BigInteger dhModulus;
    private final BigInteger dhBase;
    private final BigInteger dhSecretInteger;
    private final byte[] challenge;
    private final AtomicBoolean apiKeyConfirmInProgress = new AtomicBoolean(false);

    private volatile long timeout;
    private volatile long nonce;

    private BigInteger dhSessionSecret;
    private ApiKeyInfo apiKeyInfo;

    public SessionInfo(String sessionId, String apiKeyId, BigInteger dhBase, BigInteger dhModulus,
                       int secretSize, int challengeSize, SecureRandom secureRandom)
    {
        this.sessionId = sessionId;
        this.apiKeyId = apiKeyId;
        this.dhBase = dhBase;
        this.dhModulus = dhModulus;
        this.dhSecretInteger = new BigInteger(secretSize * 8, secureRandom);
        this.challenge = new byte[challengeSize];
        secureRandom.nextBytes(challenge);
    }

    public void initSessionSecret(BigInteger dhClientKey) {
        dhSessionSecret = dhClientKey.modPow(dhSecretInteger, dhModulus);
    }

    public BigInteger generateDhKey() {
        return dhBase.modPow(dhSecretInteger, dhModulus);
    }

    public boolean verifySignature(String payload, String signature) {
        return HmacUtils.verifyHmacSha384(payload, signature, dhSessionSecret.toByteArray());
    }

    public boolean isConfirmationInProgress() {
        return !apiKeyConfirmInProgress.compareAndSet(false, true);
    }

    @Override
    public String toString() {
        return "{" +
            " SessionId = " + getSessionId() +
            "; ApiKeyId = " + getApiKeyId() +
            " }";
    }

    public long getTimeout() {
        return timeout;
    }

    public void setTimeout(long timeout) {
        this.timeout = timeout;
    }

    public long getNonce() {
        return nonce;
    }

    public void setNonce(long nonce) {
        this.nonce = nonce;
    }

    public ApiKeyInfo getApiKeyInfo() {
        return apiKeyInfo;
    }

    public void setApiKeyInfo(ApiKeyInfo apiKeyInfo) {
        this.apiKeyInfo = apiKeyInfo;
    }

    public String getApiKeyId() {
        return apiKeyId;
    }

    public byte[] getChallenge() {
        return challenge;
    }

    public String getSessionId() {
        return sessionId;
    }

}
