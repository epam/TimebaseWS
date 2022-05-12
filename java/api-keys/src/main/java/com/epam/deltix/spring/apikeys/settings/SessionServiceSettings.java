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
package com.epam.deltix.spring.apikeys.settings;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.math.BigInteger;
import java.util.Base64;

@Component
@ConfigurationProperties(prefix = "security.api-keys.sessions")
public class SessionServiceSettings {
    private boolean enabled;
    private int challengeSize = 2048; // Size of login challenge string, in bytes
    private int dhSecretSize = 512; // Size of our side of DH key, in bytes

    private long keepAliveMs = 100000;
    private long keepAliveLoginMs = 10000;
    private long keepAliveTimerMs = 1000;

    private BigInteger dhBase = hexToBigInteger("2");
    private BigInteger dhModulus = hexToBigInteger("ffffffffffffffffc90fdaa22168c234c4c6628b80dc1cd129024e088a67cc74020bbea63b139b22514a08798e3404ddef9519b3cd3a431b302b0a6df25f14374fe1356d6d51c245e485b576625e7ec6f44c42e9a637ed6b0bff5cb6f406b7edee386bfb5a899fa5ae9f24117c4b1fe649286651ece45b3dc2007cb8a163bf0598da48361c55d39a69163fa8fd24cf5f83655d23dca3ad961c62f356208552bb9ed529077096966d670c354e4abc9804f1746c08ca18217c32905e462e36ce3be39e772c180e86039b2783a2ec07a28fb5c55df06f4c52c9de2bcbf6955817183995497cea956ae515d2261898fa051015728e5a8aacaa68ffffffffffffffff");

    private String dhBaseB64 = null;
    private String dhModulusB64 = null;

    private boolean forwardUsername = true;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getDhBaseB64() {
        if (dhBaseB64 == null) {
            dhBaseB64 = Base64.getEncoder().encodeToString(dhBase.toByteArray());
        }
        return dhBaseB64;
    }

    public String getDhModulusB64() {
        if (dhModulusB64 == null) {
            dhModulusB64 = Base64.getEncoder().encodeToString(dhModulus.toByteArray());
        }
        return dhModulusB64;
    }

    public int getChallengeSize() {
        return challengeSize;
    }

    public void setChallengeSize(int challengeSize) {
        this.challengeSize = challengeSize;
    }

    public int getDhSecretSize() {
        return dhSecretSize;
    }

    public void setDhSecretSize(int dhSecretSize) {
        this.dhSecretSize = dhSecretSize;
    }

    public long getKeepAliveLoginMs() {
        return keepAliveLoginMs;
    }

    public void setKeepAliveLoginMs(long keepAliveLoginMs) {
        this.keepAliveLoginMs = keepAliveLoginMs;
    }

    public long getKeepAliveTimerMs() {
        return keepAliveTimerMs;
    }

    public void setKeepAliveTimerMs(long keepAliveTimerMs) {
        this.keepAliveTimerMs = keepAliveTimerMs;
    }

    public BigInteger getDhBase() {
        return dhBase;
    }

    public void setDhBaseHex(String dhBaseHex) {
        this.dhBase = hexToBigInteger(dhBaseHex);
    }

    public BigInteger getDhModulus() {
        return dhModulus;
    }

    public void setDhModulusHex(String dhModulusHex) {
        this.dhModulus = hexToBigInteger(dhModulusHex);
    }

    public long getKeepAliveMs() {
        return keepAliveMs;
    }

    public void setKeepAliveMs(long keepAliveMs) {
        this.keepAliveMs = keepAliveMs;
    }

    public boolean getForwardUsername() {
        return forwardUsername;
    }

    public void setForwardUsername(boolean forwardUsername) {
        this.forwardUsername = forwardUsername;
    }

    private static BigInteger hexToBigInteger(String hex) {
        return new BigInteger(hex, 16);
    }
}
