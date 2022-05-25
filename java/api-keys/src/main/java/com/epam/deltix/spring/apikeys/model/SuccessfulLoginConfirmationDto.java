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

public class SuccessfulLoginConfirmationDto {
    private String _DhKey;

    private long _KeepaliveTimeout;

    /**
     * Default constructor.
     */
    public SuccessfulLoginConfirmationDto() {
        _DhKey = null;
    }

    /**
     * Server's public Diffie-Hellman key (B), base64-encoded number.
     *
     * @return Dto field.
     */
    @JsonProperty("dh_key")
    public String getDhKey() {
        return _DhKey;
    }

    /**
     * Server's public Diffie-Hellman key (B), base64-encoded number.
     *
     * @param value Value to be set.
     */
    @JsonProperty("dh_key")
    public void setDhKey(String value) {
        _DhKey = value;
    }

    /**
     * The amount of time between the requests, to keep the session from being considered ended.
     *
     * @return Dto field.
     */
    @JsonProperty("keepalive_timeout")
    public long getKeepaliveTimeout() {
        return _KeepaliveTimeout;
    }

    /**
     * The amount of time between the requests, to keep the session from being considered ended.
     *
     * @param value Value to be set.
     */
    @JsonProperty("keepalive_timeout")
    public void setKeepaliveTimeout(long value) {
        _KeepaliveTimeout = value;
    }

    /**
     * Copies all fields from a specified {@link SuccessfulLoginConfirmationDto}.
     *
     * @param that Source to copy from.
     */
    public void copyFrom(Object that) {
        if (that == null) {
            throw new IllegalArgumentException("that == null");
        }
        if (!(that instanceof SuccessfulLoginConfirmationDto)) {
            throw new IllegalArgumentException("that is not instance of SuccessfulLoginConfirmationDto");
        }

        ((SuccessfulLoginConfirmationDto) that).copyTo(this);
    }

    /**
     * Copies all fields to a specified object.
     * Destination must be a {@link SuccessfulLoginConfirmationDto}.
     *
     * @param that Destination to copy to.
     */
    public void copyTo(Object that) {
        if (that == null) {
            throw new IllegalArgumentException("that == null");
        }
        if (!(that instanceof SuccessfulLoginConfirmationDto)) {
            throw new IllegalArgumentException("that is not instance of SuccessfulLoginConfirmationDto");
        }

        this.copyTo((SuccessfulLoginConfirmationDto) that);
    }

    /**
     * Copies all fields to a specified {@link SuccessfulLoginConfirmationDto}.
     *
     * @param that Destination to copy to.
     */
    public void copyTo(SuccessfulLoginConfirmationDto that) {
        if (that == null) {
            throw new IllegalArgumentException("that == null");
        }
        if (this == that) {
            return;
        }

        that._DhKey = this._DhKey;
        that._KeepaliveTimeout = this._KeepaliveTimeout;
    }

    /**
     * Creates a full copy of this object.
     *
     * @return A copy of this {@link SuccessfulLoginConfirmationDto}.
     */
    @Override
    public SuccessfulLoginConfirmationDto clone() {
        final SuccessfulLoginConfirmationDto ret = new SuccessfulLoginConfirmationDto();
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
        if (_DhKey != null) {
            hash ^= _DhKey.hashCode();
        }
        hash ^= (int)(_KeepaliveTimeout ^ (_KeepaliveTimeout >>> 32));
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
        if (that.getClass() != SuccessfulLoginConfirmationDto.class) {
            return false;
        }

        return fieldsEqual((SuccessfulLoginConfirmationDto)that);
    }

    protected boolean fieldsEqual(SuccessfulLoginConfirmationDto that) {
        if (!Objects.equals(this._DhKey, that._DhKey)) {
            return false;
        }
        if (this._KeepaliveTimeout != that._KeepaliveTimeout) {
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
        if (_DhKey != null) {
            builder.append(" DhKey = ");
            builder.append("\"");
            builder.append(_DhKey);
            builder.append("\"");
        }
        builder.append(" KeepaliveTimeout = ");
        builder.append(_KeepaliveTimeout);
        builder.append(" }");
        return builder.toString();
    }

    public void clear() {
        _DhKey = null;
        _KeepaliveTimeout = 0;
    }
}
