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
package com.epam.deltix.tbwg.messages;

import com.epam.deltix.containers.BinaryAsciiString;
import com.epam.deltix.containers.MutableString;
import com.epam.deltix.timebase.messages.*;


public class SecurityStatusMessage extends InstrumentMessage implements RecordInterface {
  public static final String CLASS_NAME = SecurityStatusMessage.class.getName();

  protected CharSequence cause = null;

  protected long exchangeId = TypeConstants.EXCHANGE_NULL;

  protected CharSequence originalStatus = null;

  protected SecurityStatus status = null;

  /**
   * @return Cause
   */
  @SchemaElement(
      title = "Cause"
  )
  @SchemaType(
      isNullable = true
  )
  public CharSequence getCause() {
    return cause;
  }

  /**
   * @param value - Cause
   */
  public void setCause(CharSequence value) {
    this.cause = value;
  }

  /**
   * @return true if Causeis not null
   */
  public boolean hasCause() {
    return cause != null;
  }

  public void nullifyCause() {
    this.cause = null;
  }

  /**
   * @return Exchange Id
   */
  @SchemaElement(
      title = "Exchange Id"
  )
  @SchemaType(
      encoding = "ALPHANUMERIC(10)",
      isNullable = true,
      dataType = SchemaDataType.VARCHAR
  )
  public long getExchangeId() {
    return exchangeId;
  }

  /**
   * @param value - Exchange Id
   */
  public void setExchangeId(long value) {
    this.exchangeId = value;
  }

  /**
   * @return true if Exchange Idis not null
   */
  public boolean hasExchangeId() {
    return exchangeId != TypeConstants.EXCHANGE_NULL;
  }

  public void nullifyExchangeId() {
    this.exchangeId = TypeConstants.EXCHANGE_NULL;
  }

  /**
   * @return Original Status
   */
  @SchemaElement(
      title = "Original Status"
  )
  @SchemaType(
      isNullable = true
  )
  public CharSequence getOriginalStatus() {
    return originalStatus;
  }

  /**
   * @param value - Original Status
   */
  public void setOriginalStatus(CharSequence value) {
    this.originalStatus = value;
  }

  /**
   * @return true if Original Statusis not null
   */
  public boolean hasOriginalStatus() {
    return originalStatus != null;
  }

  public void nullifyOriginalStatus() {
    this.originalStatus = null;
  }

  /**
   * @return Status
   */
  @SchemaElement(
      title = "Status"
  )
  @SchemaType(
      isNullable = true
  )
  public SecurityStatus getStatus() {
    return status;
  }

  /**
   * @param value - Status
   */
  public void setStatus(SecurityStatus value) {
    this.status = value;
  }

  /**
   * @return true if Statusis not null
   */
  public boolean hasStatus() {
    return status != null;
  }

  public void nullifyStatus() {
    this.status = null;
  }

  /**
   * Creates new instance of this class.
   * @return new instance of this class.
   */
  @Override
  protected SecurityStatusMessage createInstance() {
    return new SecurityStatusMessage();
  }

  /**
   * Method nullifies all instance properties
   */
  @Override
  public SecurityStatusMessage nullify() {
    super.nullify();
    nullifyCause();
    nullifyExchangeId();
    nullifyOriginalStatus();
    nullifyStatus();
    return this;
  }

  /**
   * Resets all instance properties to their default values
   */
  @Override
  public SecurityStatusMessage reset() {
    super.reset();
    cause = null;
    exchangeId = TypeConstants.EXCHANGE_NULL;
    originalStatus = null;
    status = null;
    return this;
  }

  /**
   * Method copies state to a given instance
   */
  @Override
  public SecurityStatusMessage clone() {
    SecurityStatusMessage t = createInstance();
    t.copyFrom(this);
    return t;
  }

  /**
   * Indicates whether some other object is "equal to" this one.
   */
  @Override
  public boolean equals(Object obj) {
    if (this == obj) return true;
    boolean superEquals = super.equals(obj);
    if (!superEquals) return false;
    if (!(obj instanceof SecurityStatusMessage)) return false;
    SecurityStatusMessage other =(SecurityStatusMessage)obj;
    if (hasCause() != other.hasCause()) return false;
    if (hasCause()) {
      if (getCause().length() != other.getCause().length()) return false; else {
        CharSequence s1 = getCause();
        CharSequence s2 = other.getCause();
        if ((s1 instanceof MutableString && s2 instanceof MutableString) || (s1 instanceof String && s2 instanceof String) || (s1 instanceof BinaryAsciiString && s2 instanceof BinaryAsciiString)) {
          if (!s1.equals(s2)) return false;
        } else {
          for (int i = 0; i < s1.length(); ++i) if (s1.charAt(i) != s2.charAt(i)) return false;
        }
      }
    }
    if (hasExchangeId() != other.hasExchangeId()) return false;
    if (hasExchangeId() && getExchangeId() != other.getExchangeId()) return false;
    if (hasOriginalStatus() != other.hasOriginalStatus()) return false;
    if (hasOriginalStatus()) {
      if (getOriginalStatus().length() != other.getOriginalStatus().length()) return false; else {
        CharSequence s1 = getOriginalStatus();
        CharSequence s2 = other.getOriginalStatus();
        if ((s1 instanceof MutableString && s2 instanceof MutableString) || (s1 instanceof String && s2 instanceof String) || (s1 instanceof BinaryAsciiString && s2 instanceof BinaryAsciiString)) {
          if (!s1.equals(s2)) return false;
        } else {
          for (int i = 0; i < s1.length(); ++i) if (s1.charAt(i) != s2.charAt(i)) return false;
        }
      }
    }
    if (hasStatus() != other.hasStatus()) return false;
    if (hasStatus() && getStatus() != other.getStatus()) return false;
    return true;
  }

  /**
   * Returns a hash code value for the object. This method is * supported for the benefit of hash tables such as those provided by.
   */
  @Override
  public int hashCode() {
    int hash = super.hashCode();
    if (hasCause()) {
      hash = hash * 31 + getCause().hashCode();
    }
    if (hasExchangeId()) {
      hash = hash * 31 + ((int)(getExchangeId() ^ (getExchangeId() >>> 32)));
    }
    if (hasOriginalStatus()) {
      hash = hash * 31 + getOriginalStatus().hashCode();
    }
    if (hasStatus()) {
      hash = hash * 31 + getStatus().getNumber();
    }
    return hash;
  }

  /**
   * Method copies state to a given instance
   * @param template class instance that should be used as a copy source
   */
  @Override
  public SecurityStatusMessage copyFrom(RecordInfo template) {
    super.copyFrom(template);
    if (template instanceof SecurityStatusMessage) {
      SecurityStatusMessage t = (SecurityStatusMessage)template;
      if (t.hasCause()) {
        if (hasCause() && getCause() instanceof StringBuilder) {
          ((StringBuilder)getCause()).setLength(0);
        } else {
          setCause(new StringBuilder());
        }
        ((StringBuilder)getCause()).append(t.getCause());
      } else {
        nullifyCause();
      }
      if (t.hasExchangeId()) {
        setExchangeId(t.getExchangeId());
      } else {
        nullifyExchangeId();
      }
      if (t.hasOriginalStatus()) {
        if (hasOriginalStatus() && getOriginalStatus() instanceof StringBuilder) {
          ((StringBuilder)getOriginalStatus()).setLength(0);
        } else {
          setOriginalStatus(new StringBuilder());
        }
        ((StringBuilder)getOriginalStatus()).append(t.getOriginalStatus());
      } else {
        nullifyOriginalStatus();
      }
      if (t.hasStatus()) {
        setStatus(t.getStatus());
      } else {
        nullifyStatus();
      }
    }
    return this;
  }

  /**
   * @return a string representation of this class object.
   */
  @Override
  public String toString() {
    StringBuilder str = new StringBuilder();
    return toString(str).toString();
  }

  /**
   * @return a string representation of this class object.
   */
  @Override
  public StringBuilder toString(StringBuilder str) {
    str.append("{ \"$type\":  \"SecurityStatusMessage\"");
    if (hasCause()) {
      str.append(", \"cause\": ").append(getCause());
    }
    if (hasExchangeId()) {
      str.append(", \"exchangeId\": ").append(getExchangeId());
    }
    if (hasOriginalStatus()) {
      str.append(", \"originalStatus\": ").append(getOriginalStatus());
    }
    if (hasStatus()) {
      str.append(", \"status\": ").append(getStatus());
    }

    if (hasTimeStampMs()) {
      str.append(", \"timestamp\": \"").append(formatNanos(getTimeStampMs(), (int)getNanoTime())).append("\"");
    }

    if (hasSymbol()) {
      str.append(", \"symbol\": \"").append(getSymbol()).append("\"");
    }
    str.append("}");
    return str;
  }
}
