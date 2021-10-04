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
package com.epam.deltix.grafana.test;

/**
 */
public enum GrafanaTestEnum {
  /**
   */
  FIRST(0),

  /**
   */
  SECOND(1),

  /**
   */
  THIRD(2),

  /**
   */
  FOURTH(3);

  private final int value;

  GrafanaTestEnum(int value) {
    this.value = value;
  }

  public int getNumber() {
    return this.value;
  }

  public static GrafanaTestEnum valueOf(int number) {
    switch (number) {
      case 0: return FIRST;
      case 1: return SECOND;
      case 2: return THIRD;
      case 3: return FOURTH;
      default: return null;
    }
  }

  public static GrafanaTestEnum strictValueOf(int number) {
    final GrafanaTestEnum value = valueOf(number);
    if (value == null) {
      throw new IllegalArgumentException("Enumeration 'GrafanaTestEnum' does not have value corresponding to '" + number + "'.");
    }
    return value;
  }
}
