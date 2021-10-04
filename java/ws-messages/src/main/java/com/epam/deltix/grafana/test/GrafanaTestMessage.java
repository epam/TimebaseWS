package com.epam.deltix.grafana.test;

import com.epam.deltix.containers.BinaryAsciiString;
import com.epam.deltix.containers.CharSequenceUtils;
import com.epam.deltix.containers.interfaces.MutableString;
import com.epam.deltix.dfp.Decimal;
import com.epam.deltix.dfp.Decimal64Utils;
import com.epam.deltix.timebase.messages.*;
import java.lang.CharSequence;
import java.lang.Object;
import java.lang.Override;
import java.lang.String;
import java.lang.StringBuilder;

/**
 */
public class GrafanaTestMessage extends InstrumentMessage implements GrafanaTestMessageInterface {
  public static final String CLASS_NAME = GrafanaTestMessage.class.getName();

  /**
   */
  @Decimal
  protected long highPrice = TypeConstants.DECIMAL_NULL;

  /**
   */
  @Decimal
  protected long lowPrice = TypeConstants.DECIMAL_NULL;

  /**
   */
  @Decimal
  protected long price = TypeConstants.DECIMAL_NULL;

  /**
   */
  protected CharSequence vendor = null;

  /**
   */
  protected long currency = TypeConstants.INT64_NULL;

  /**
   */
  protected GrafanaTestEnum priceType = null;

  /**
   * @return High Price
   */
  @Decimal
  @SchemaElement
  @SchemaType(
      encoding = "DECIMAL64",
      isNullable = true,
      dataType = SchemaDataType.FLOAT
  )
  public long getHighPrice() {
    return highPrice;
  }

  /**
   * @param value - High Price
   */
  public void setHighPrice(@Decimal long value) {
    this.highPrice = value;
  }

  /**
   * @return true if High Price is not null
   */
  public boolean hasHighPrice() {
    return highPrice != TypeConstants.DECIMAL_NULL;
  }

  /**
   */
  public void nullifyHighPrice() {
    this.highPrice = TypeConstants.DECIMAL_NULL;
  }

  /**
   * @return Low Price
   */
  @Decimal
  @SchemaElement
  @SchemaType(
      encoding = "DECIMAL64",
      isNullable = true,
      dataType = SchemaDataType.FLOAT
  )
  public long getLowPrice() {
    return lowPrice;
  }

  /**
   * @param value - Low Price
   */
  public void setLowPrice(@Decimal long value) {
    this.lowPrice = value;
  }

  /**
   * @return true if Low Price is not null
   */
  public boolean hasLowPrice() {
    return lowPrice != TypeConstants.DECIMAL_NULL;
  }

  /**
   */
  public void nullifyLowPrice() {
    this.lowPrice = TypeConstants.DECIMAL_NULL;
  }

  /**
   * @return Price
   */
  @Decimal
  @SchemaElement
  @SchemaType(
      encoding = "DECIMAL64",
      isNullable = true,
      dataType = SchemaDataType.FLOAT
  )
  public long getPrice() {
    return price;
  }

  /**
   * @param value - Price
   */
  public void setPrice(@Decimal long value) {
    this.price = value;
  }

  /**
   * @return true if Price is not null
   */
  public boolean hasPrice() {
    return price != TypeConstants.DECIMAL_NULL;
  }

  /**
   */
  public void nullifyPrice() {
    this.price = TypeConstants.DECIMAL_NULL;
  }

  /**
   * @return Vendor
   */
  @SchemaElement
  public CharSequence getVendor() {
    return vendor;
  }

  /**
   * @param value - Vendor
   */
  public void setVendor(CharSequence value) {
    this.vendor = value;
  }

  /**
   * @return true if Vendor is not null
   */
  public boolean hasVendor() {
    return vendor != null;
  }

  /**
   */
  public void nullifyVendor() {
    this.vendor = null;
  }

  /**
   * @return Currency
   */
  @SchemaElement
  @SchemaType(
      encoding = "ALPHANUMERIC(10)",
      dataType = SchemaDataType.VARCHAR
  )
  public long getCurrency() {
    return currency;
  }

  /**
   * @param value - Currency
   */
  public void setCurrency(long value) {
    this.currency = value;
  }

  /**
   * @return true if Currency is not null
   */
  public boolean hasCurrency() {
    return currency != TypeConstants.INT64_NULL;
  }

  /**
   */
  public void nullifyCurrency() {
    this.currency = TypeConstants.INT64_NULL;
  }

  /**
   * @return Price Type
   */
  @SchemaElement
  public GrafanaTestEnum getPriceType() {
    return priceType;
  }

  /**
   * @param value - Price Type
   */
  public void setPriceType(GrafanaTestEnum value) {
    this.priceType = value;
  }

  /**
   * @return true if Price Type is not null
   */
  public boolean hasPriceType() {
    return priceType != null;
  }

  /**
   */
  public void nullifyPriceType() {
    this.priceType = null;
  }

  /**
   * Creates new instance of this class.
   * @return new instance of this class.
   */
  @Override
  protected GrafanaTestMessage createInstance() {
    return new GrafanaTestMessage();
  }

  /**
   * Method nullifies all instance properties
   */
  @Override
  public GrafanaTestMessage nullify() {
    super.nullify();
    nullifyHighPrice();
    nullifyLowPrice();
    nullifyPrice();
    nullifyVendor();
    nullifyCurrency();
    nullifyPriceType();
    return this;
  }

  /**
   * Resets all instance properties to their default values
   */
  @Override
  public GrafanaTestMessage reset() {
    super.reset();
    highPrice = TypeConstants.DECIMAL_NULL;
    lowPrice = TypeConstants.DECIMAL_NULL;
    price = TypeConstants.DECIMAL_NULL;
    vendor = null;
    currency = TypeConstants.INT64_NULL;
    priceType = null;
    return this;
  }

  /**
   * Method copies state to a given instance
   */
  @Override
  public GrafanaTestMessage clone() {
    GrafanaTestMessage t = createInstance();
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
    if (!(obj instanceof GrafanaTestMessageInfo)) return false;
    GrafanaTestMessageInfo other =(GrafanaTestMessageInfo)obj;
    if (hasHighPrice() != other.hasHighPrice()) return false;
    if (hasHighPrice() && !Decimal64Utils.equals(getHighPrice(), other.getHighPrice())) return false;
    if (hasLowPrice() != other.hasLowPrice()) return false;
    if (hasLowPrice() && !Decimal64Utils.equals(getLowPrice(), other.getLowPrice())) return false;
    if (hasPrice() != other.hasPrice()) return false;
    if (hasPrice() && !Decimal64Utils.equals(getPrice(), other.getPrice())) return false;
    if (hasVendor() != other.hasVendor()) return false;
    if (hasVendor()) {
      if (getVendor().length() != other.getVendor().length()) return false; else {
        CharSequence s1 = getVendor();
        CharSequence s2 = other.getVendor();
        if ((s1 instanceof MutableString && s2 instanceof MutableString) || (s1 instanceof String && s2 instanceof String) || (s1 instanceof BinaryAsciiString && s2 instanceof BinaryAsciiString)) {
          if (!s1.equals(s2)) return false;
        } else {
          if (!CharSequenceUtils.equals(s1, s2)) return false;
        }
      }
    }
    if (hasCurrency() != other.hasCurrency()) return false;
    if (hasCurrency() && getCurrency() != other.getCurrency()) return false;
    if (hasPriceType() != other.hasPriceType()) return false;
    if (hasPriceType() && getPriceType() != other.getPriceType()) return false;
    return true;
  }

  /**
   * Returns a hash code value for the object. This method is * supported for the benefit of hash tables such as those provided by.
   */
  @Override
  public int hashCode() {
    int hash = super.hashCode();
    if (hasHighPrice()) {
      hash = hash * 31 + ((int)(getHighPrice() ^ (getHighPrice() >>> 32)));
    }
    if (hasLowPrice()) {
      hash = hash * 31 + ((int)(getLowPrice() ^ (getLowPrice() >>> 32)));
    }
    if (hasPrice()) {
      hash = hash * 31 + ((int)(getPrice() ^ (getPrice() >>> 32)));
    }
    if (hasVendor()) {
      hash = hash * 31 + getVendor().hashCode();
    }
    if (hasCurrency()) {
      hash = hash * 31 + ((int)(getCurrency() ^ (getCurrency() >>> 32)));
    }
    if (hasPriceType()) {
      hash = hash * 31 + getPriceType().getNumber();
    }
    return hash;
  }

  /**
   * Method copies state to a given instance
   * @param template class instance that should be used as a copy source
   */
  @Override
  public GrafanaTestMessage copyFrom(RecordInfo template) {
    super.copyFrom(template);
    if (template instanceof GrafanaTestMessageInfo) {
      GrafanaTestMessageInfo t = (GrafanaTestMessageInfo)template;
      if (t.hasHighPrice()) {
        setHighPrice(t.getHighPrice());
      } else {
        nullifyHighPrice();
      }
      if (t.hasLowPrice()) {
        setLowPrice(t.getLowPrice());
      } else {
        nullifyLowPrice();
      }
      if (t.hasPrice()) {
        setPrice(t.getPrice());
      } else {
        nullifyPrice();
      }
      if (t.hasVendor()) {
        if (hasVendor() && getVendor() instanceof StringBuilder) {
          ((StringBuilder)getVendor()).setLength(0);
        } else {
          setVendor(new StringBuilder());
        }
        ((StringBuilder)getVendor()).append(t.getVendor());
      } else {
        nullifyVendor();
      }
      if (t.hasCurrency()) {
        setCurrency(t.getCurrency());
      } else {
        nullifyCurrency();
      }
      if (t.hasPriceType()) {
        setPriceType(t.getPriceType());
      } else {
        nullifyPriceType();
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
    str.append("{ \"$type\":  \"GrafanaTestMessage\"");
    if (hasHighPrice()) {
      str.append(", \"highPrice\": ");
      Decimal64Utils.appendTo(getHighPrice(), str);
    }
    if (hasLowPrice()) {
      str.append(", \"lowPrice\": ");
      Decimal64Utils.appendTo(getLowPrice(), str);
    }
    if (hasPrice()) {
      str.append(", \"price\": ");
      Decimal64Utils.appendTo(getPrice(), str);
    }
    if (hasVendor()) {
      str.append(", \"vendor\": \"").append(getVendor()).append("\"");
    }
    if (hasCurrency()) {
      str.append(", \"currency\": ").append(getCurrency());
    }
    if (hasPriceType()) {
      str.append(", \"priceType\": \"").append(getPriceType()).append("\"");
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
