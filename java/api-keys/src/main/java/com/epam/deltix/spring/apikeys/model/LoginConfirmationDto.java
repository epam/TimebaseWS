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

public class LoginConfirmationDto {
    private String _SessionId;

    private String _Signature;

    private String _DhKey;

    /**
     * Default constructor.
     */
    public LoginConfirmationDto() {
        _SessionId = null;
        _Signature = null;
        _DhKey = null;
    }

    /**
     * ID of the current session, received as a response to a login attempt.
     *
     * @return Dto field.
     */
    @JsonProperty("session_id")
    public String getSessionId() {
        return _SessionId;
    }

    /**
     * ID of the current session, received as a response to a login attempt.
     *
     * @param value Value to be set.
     */
    @JsonProperty("session_id")
    public void setSessionId(String value) {
        _SessionId = value;
    }

    /**
     * A signature generated with RSA from the challenge and a private key.
     *
     * @return Dto field.
     */
    @JsonProperty("signature")
    public String getSignature() {
        return _Signature;
    }

    /**
     * A signature generated with RSA from the challenge and a private key.
     *
     * @param value Value to be set.
     */
    @JsonProperty("signature")
    public void setSignature(String value) {
        _Signature = value;
    }

    /**
     * User's Diffie-Hellman public key (A), base64-encoded number.
     *
     * @return Dto field.
     */
    @JsonProperty("dh_key")
    public String getDhKey() {
        return _DhKey;
    }

    /**
     * User's Diffie-Hellman public key (A), base64-encoded number.
     *
     * @param value Value to be set.
     */
    @JsonProperty("dh_key")
    public void setDhKey(String value) {
        _DhKey = value;
    }

    /**
     * Copies all fields from a specified {@link LoginConfirmationDto}.
     *
     * @param that Source to copy from.
     */
    public void copyFrom(Object that) {
        if (that == null) {
            throw new IllegalArgumentException("that == null");
        }
        if (!(that instanceof LoginConfirmationDto)) {
            throw new IllegalArgumentException("that is not instance of LoginConfirmationDto");
        }

        ((LoginConfirmationDto) that).copyTo(this);
    }

    /**
     * Copies all fields to a specified object.
     * Destination must be a {@link LoginConfirmationDto}.
     *
     * @param that Destination to copy to.
     */
    public void copyTo(Object that) {
        if (that == null) {
            throw new IllegalArgumentException("that == null");
        }
        if (!(that instanceof LoginConfirmationDto)) {
            throw new IllegalArgumentException("that is not instance of LoginConfirmationDto");
        }

        this.copyTo((LoginConfirmationDto) that);
    }

    /**
     * Copies all fields to a specified {@link LoginConfirmationDto}.
     *
     * @param that Destination to copy to.
     */
    public void copyTo(LoginConfirmationDto that) {
        if (that == null) {
            throw new IllegalArgumentException("that == null");
        }
        if (this == that) {
            return;
        }

        that._SessionId = this._SessionId;
        that._Signature = this._Signature;
        that._DhKey = this._DhKey;
    }

    /**
     * Creates a full copy of this object.
     *
     * @return A copy of this {@link LoginConfirmationDto}.
     */
    public LoginConfirmationDto clone() {
        final LoginConfirmationDto ret = new LoginConfirmationDto();
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
        if (_Signature != null) {
            hash ^= _Signature.hashCode();
        }
        if (_DhKey != null) {
            hash ^= _DhKey.hashCode();
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
        if (that.getClass() != LoginConfirmationDto.class) {
            return false;
        }

        return fieldsEqual((LoginConfirmationDto)that);
    }

    protected boolean fieldsEqual(LoginConfirmationDto that) {
        if (!Objects.equals(this._SessionId, that._SessionId)) {
            return false;
        }
        if (!Objects.equals(this._Signature, that._Signature)) {
            return false;
        }
        if (!Objects.equals(this._DhKey, that._DhKey)) {
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
        if (_Signature != null) {
            builder.append(" Signature = ");
            builder.append("\"");
            builder.append(_Signature);
            builder.append("\"");
        }
        if (_DhKey != null) {
            builder.append(" DhKey = ");
            builder.append("\"");
            builder.append(_DhKey);
            builder.append("\"");
        }
        builder.append(" }");
        return builder.toString();
    }

    public void clear() {
        _SessionId = null;
        _Signature = null;
        _DhKey = null;
    }
}
