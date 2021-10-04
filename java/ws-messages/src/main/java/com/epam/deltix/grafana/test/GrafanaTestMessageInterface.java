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
