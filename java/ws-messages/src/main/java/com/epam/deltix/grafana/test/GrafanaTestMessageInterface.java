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
import com.epam.deltix.timebase.messages.MessageInterface;
import com.epam.deltix.timebase.messages.RecordInfo;

import java.lang.CharSequence;
import java.lang.Override;

/**
 */
public interface GrafanaTestMessageInterface extends GrafanaTestMessageInfo, MessageInterface {
  /**
   * @param value - High Price
   */
  void setHighPrice(@Decimal long value);

  /**
   */
  void nullifyHighPrice();

  /**
   * @param value - Low Price
   */
  void setLowPrice(@Decimal long value);

  /**
   */
  void nullifyLowPrice();

  /**
   * @param value - Price
   */
  void setPrice(@Decimal long value);

  /**
   */
  void nullifyPrice();

  /**
   * @param value - Vendor
   */
  void setVendor(CharSequence value);

  /**
   */
  void nullifyVendor();

  /**
   * @param value - Currency
   */
  void setCurrency(long value);

  /**
   */
  void nullifyCurrency();

  /**
   * @param value - Price Type
   */
  void setPriceType(GrafanaTestEnum value);

  /**
   */
  void nullifyPriceType();

  /**
   * Method nullifies all instance properties
   */
  @Override
  GrafanaTestMessageInterface nullify();

  /**
   * Resets all instance properties to their default values
   */
  @Override
  GrafanaTestMessageInterface reset();

  @Override
  GrafanaTestMessageInterface copyFrom(RecordInfo template);
}
