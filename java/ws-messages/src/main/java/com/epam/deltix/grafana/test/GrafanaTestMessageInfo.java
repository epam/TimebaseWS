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
