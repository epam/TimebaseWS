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

import com.epam.deltix.dfp.Decimal;
import com.epam.deltix.timebase.messages.MessageInfo;

import java.lang.CharSequence;
import java.lang.Override;

/**
 */
public interface GrafanaTestMessageInfo extends MessageInfo {
  /**
   * @return High Price
   */
  @Decimal
  long getHighPrice();

  /**
   * @return true if High Price is not null
   */
  boolean hasHighPrice();

  /**
   * @return Low Price
   */
  @Decimal
  long getLowPrice();

  /**
   * @return true if Low Price is not null
   */
  boolean hasLowPrice();

  /**
   * @return Price
   */
  @Decimal
  long getPrice();

  /**
   * @return true if Price is not null
   */
  boolean hasPrice();

  /**
   * @return Vendor
   */
  CharSequence getVendor();

  /**
   * @return true if Vendor is not null
   */
  boolean hasVendor();

  /**
   * @return Currency
   */
  long getCurrency();

  /**
   * @return true if Currency is not null
   */
  boolean hasCurrency();

  /**
   * @return Price Type
   */
  GrafanaTestEnum getPriceType();

  /**
   * @return true if Price Type is not null
   */
  boolean hasPriceType();

  /**
   * Method copies state to a given instance
   */
  @Override
  GrafanaTestMessageInfo clone();
}
