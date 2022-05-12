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

public class LoginAttemptDto {
    private String _ApiKeyId;

    /**
     * Default constructor.
     */
    public LoginAttemptDto() {
        _ApiKeyId = null;
    }

    /**
     * ID of the API key generated through the Web interface.
     *
     * @return Dto field.
     */
    @JsonProperty("api_key_id")
    public String getApiKeyId() {
        return _ApiKeyId;
    }

    /**
     * ID of the API key generated through the Web interface.
     *
     * @param value Value to be set.
     */
    @JsonProperty("api_key_id")
    public void setApiKeyId(String value) {
        _ApiKeyId = value;
    }

    /**
     * Copies all fields from a specified {@link LoginAttemptDto}.
     *
     * @param that Source to copy from.
     */
    public void copyFrom(Object that) {
        if (that == null) {
            throw new IllegalArgumentException("that == null");
        }
        if (!(that instanceof LoginAttemptDto)) {
            throw new IllegalArgumentException("that is not instance of LoginAttemptDto");
        }

        ((LoginAttemptDto) that).copyTo(this);
    }

    /**
     * Copies all fields to a specified object.
     * Destination must be a {@link LoginAttemptDto}.
     *
     * @param that Destination to copy to.
     */
    public void copyTo(Object that) {
        if (that == null) {
            throw new IllegalArgumentException("that == null");
        }
        if (!(that instanceof LoginAttemptDto)) {
            throw new IllegalArgumentException("that is not instance of LoginAttemptDto");
        }

        this.copyTo((LoginAttemptDto) that);
    }

    /**
     * Copies all fields to a specified {@link LoginAttemptDto}.
     *
     * @param that Destination to copy to.
     */
    public void copyTo(LoginAttemptDto that) {
        if (that == null) {
            throw new IllegalArgumentException("that == null");
        }
        if (this == that) {
            return;
        }

        that._ApiKeyId = this._ApiKeyId;
    }

    /**
     * Creates a full copy of this object.
     *
     * @return A copy of this {@link LoginAttemptDto}.
     */
    @Override
    public LoginAttemptDto clone() {
        final LoginAttemptDto ret = new LoginAttemptDto();
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
        if (_ApiKeyId != null) {
            hash ^= _ApiKeyId.hashCode();
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
        if (that.getClass() != LoginAttemptDto.class) {
            return false;
        }

        return fieldsEqual((LoginAttemptDto)that);
    }

    protected boolean fieldsEqual(LoginAttemptDto that) {
        if (!Objects.equals(this._ApiKeyId, that._ApiKeyId)) {
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
        if (_ApiKeyId != null) {
            builder.append(" ApiKeyId = ");
            builder.append("\"");
            builder.append(_ApiKeyId);
            builder.append("\"");
        }
        builder.append(" }");
        return builder.toString();
    }

    public void clear() {
        _ApiKeyId = null;
    }

}
