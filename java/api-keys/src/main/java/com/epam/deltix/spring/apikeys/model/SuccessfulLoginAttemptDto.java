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
package com.epam.deltix.spring.apikeys.model;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Objects;

public class SuccessfulLoginAttemptDto {
    private String _SessionId;

    private String _Challenge;

    private long _Ttl;

    private String _DhBase;

    private String _DhModulus;

    /**
     * Default constructor.
     */
    public SuccessfulLoginAttemptDto() {
        _SessionId = null;
        _Challenge = null;
        _DhBase = null;
        _DhModulus = null;
    }

    /**
     * ID of the current Session.
     *
     * @return Dto field.
     */
    @JsonProperty("session_id")
    public String getSessionId() {
        return _SessionId;
    }

    /**
     * ID of the current Session.
     *
     * @param value Value to be set.
     */
    @JsonProperty("session_id")
    public void setSessionId(String value) {
        _SessionId = value;
    }

    /**
     * A string, that has to be signed with the client's private key.
     *
     * @return Dto field.
     */
    @JsonProperty("challenge")
    public String getChallenge() {
        return _Challenge;
    }

    /**
     * A string, that has to be signed with the client's private key.
     *
     * @param value Value to be set.
     */
    @JsonProperty("challenge")
    public void setChallenge(String value) {
        _Challenge = value;
    }

    /**
     * The amount of time the server will wait for a confirmation after the initial login attempt.
     *
     * @return Dto field.
     */
    @JsonProperty("ttl")
    public long getTtl() {
        return _Ttl;
    }

    /**
     * The amount of time the server will wait for a confirmation after the initial login attempt.
     *
     * @param value Value to be set.
     */
    @JsonProperty("ttl")
    public void setTtl(long value) {
        _Ttl = value;
    }

    /**
     * Base for Diffie-Hellman key exchange (g), base64-encoded arbitrary number.
     *
     * @return Dto field.
     */
    @JsonProperty("dh_base")
    public String getDhBase() {
        return _DhBase;
    }

    /**
     * Base for Diffie-Hellman key exchange (g), base64-encoded arbitrary number.
     *
     * @param value Value to be set.
     */
    @JsonProperty("dh_base")
    public void setDhBase(String value) {
        _DhBase = value;
    }

    /**
     * Modulus for Diffie-Hellman key exchange (p), base64-encoded prime.
     *
     * @return Dto field.
     */
    @JsonProperty("dh_modulus")
    public String getDhModulus() {
        return _DhModulus;
    }

    /**
     * Modulus for Diffie-Hellman key exchange (p), base64-encoded prime.
     *
     * @param value Value to be set.
     */
    @JsonProperty("dh_modulus")
    public void setDhModulus(String value) {
        _DhModulus = value;
    }

    /**
     * Copies all fields from a specified {@link SuccessfulLoginAttemptDto}.
     *
     * @param that Source to copy from.
     */
    public void copyFrom(Object that) {
        if (that == null) {
            throw new IllegalArgumentException("that == null");
        }
        if (!(that instanceof SuccessfulLoginAttemptDto)) {
            throw new IllegalArgumentException("that is not instance of SuccessfulLoginAttemptDto");
        }

        ((SuccessfulLoginAttemptDto) that).copyTo(this);
    }

    /**
     * Copies all fields to a specified object.
     * Destination must be a {@link SuccessfulLoginAttemptDto}.
     *
     * @param that Destination to copy to.
     */
    public void copyTo(Object that) {
        if (that == null) {
            throw new IllegalArgumentException("that == null");
        }
        if (!(that instanceof SuccessfulLoginAttemptDto)) {
            throw new IllegalArgumentException("that is not instance of SuccessfulLoginAttemptDto");
        }

        this.copyTo((SuccessfulLoginAttemptDto) that);
    }

    /**
     * Copies all fields to a specified {@link SuccessfulLoginAttemptDto}.
     *
     * @param that Destination to copy to.
     */
    public void copyTo(SuccessfulLoginAttemptDto that) {
        if (that == null) {
            throw new IllegalArgumentException("that == null");
        }
        if (this == that) {
            return;
        }

        that._SessionId = this._SessionId;
        that._Challenge = this._Challenge;
        that._Ttl = this._Ttl;
        that._DhBase = this._DhBase;
        that._DhModulus = this._DhModulus;
    }

    /**
     * Creates a full copy of this object.
     *
     * @return A copy of this {@link SuccessfulLoginAttemptDto}.
     */
    @Override
    public SuccessfulLoginAttemptDto clone() {
        final SuccessfulLoginAttemptDto ret = new SuccessfulLoginAttemptDto();
        this.copyTo(ret);
        return ret;
    }

    /**
     * Calculates hash code of this object.
     *
     * @return Result hash code of this object.
     */
    @Override
    public int hashCode() {
        int hash = 0;
        if (_SessionId != null) {
            hash ^= _SessionId.hashCode();
        }
        if (_Challenge != null) {
            hash ^= _Challenge.hashCode();
        }
        hash ^= (int)(_Ttl ^ (_Ttl >>> 32));
        if (_DhBase != null) {
            hash ^= _DhBase.hashCode();
        }
        if (_DhModulus != null) {
            hash ^= _DhModulus.hashCode();
        }
        return hash;
    }

    /**
     * Compares this object for equality to specified one.
     *
     * @param that Object to compare to.
     * @return {@code true} if specified object equals to this, {@code false} otherwise.
     */
    @Override
    public boolean equals(Object that) {
        if (that == null) {
            return false;
        }
        if (this == that) {
            return true;
        }
        if (that.getClass() != SuccessfulLoginAttemptDto.class) {
            return false;
        }

        return fieldsEqual((SuccessfulLoginAttemptDto)that);
    }

    protected boolean fieldsEqual(SuccessfulLoginAttemptDto that) {
        if (!Objects.equals(this._SessionId, that._SessionId)) {
            return false;
        }
        if (!Objects.equals(this._Challenge, that._Challenge)) {
            return false;
        }
        if (this._Ttl != that._Ttl) {
            return false;
        }
        if (!Objects.equals(this._DhBase, that._DhBase)) {
            return false;
        }
        if (!Objects.equals(this._DhModulus, that._DhModulus)) {
            return false;
        }

        return true;
    }

    /**
     * Returns a string representation of this object.
     *
     * @return String representation of this object.
     */
    @Override
    public String toString() {
        final StringBuilder builder = new StringBuilder();
        builder.append("{");
        if (_SessionId != null) {
            builder.append(" SessionId = ");
            builder.append("\"");
            builder.append(_SessionId);
            builder.append("\"");
        }
        if (_Challenge != null) {
            builder.append(" Challenge = ");
            builder.append("\"");
            builder.append(_Challenge);
            builder.append("\"");
        }
        builder.append(" Ttl = ");
        builder.append(_Ttl);
        if (_DhBase != null) {
            builder.append(" DhBase = ");
            builder.append("\"");
            builder.append(_DhBase);
            builder.append("\"");
        }
        if (_DhModulus != null) {
            builder.append(" DhModulus = ");
            builder.append("\"");
            builder.append(_DhModulus);
            builder.append("\"");
        }
        builder.append(" }");
        return builder.toString();
    }

    public void clear() {
        _SessionId = null;
        _Challenge = null;
        _Ttl = 0;
        _DhBase = null;
        _DhModulus = null;
    }
}
