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
package com.epam.deltix.computations.data;

import com.epam.deltix.dfp.Decimal64Utils;
import com.epam.deltix.timebase.messages.*;
import com.epam.deltix.util.collections.generated.*;

import java.lang.Object;
import java.lang.Override;
import java.lang.String;
import java.lang.StringBuilder;

/**
 */
public class AllTypesMessage extends AllSimpleTypesMessage implements AllTypesMessageInfo {
  public static final String CLASS_NAME = AllTypesMessage.class.getName();

  /**
   */
  protected AllSimpleTypesMessageInfo object = null;

  /**
   */
  protected BooleanArrayList booleanList = null;

  /**
   */
  protected ByteArrayList byteList = null;

  /**
   */
  protected DoubleArrayList doubleList = null;

  /**
   */
  protected FloatArrayList floatList = null;

  /**
   */
  protected IntegerArrayList intList = null;

  /**
   */
  protected LongArrayList longList = null;

  /**
   */
  protected ShortArrayList shortList = null;

  /**
   */
  protected ObjectArrayList<AllSimpleTypesMessageInfo> objectsList = null;

  /**
   * @return Object
   */
  @SchemaElement
  @SchemaType(
      dataType = SchemaDataType.OBJECT,
      nestedTypes =  {
            AllSimpleTypesMessage.class}

  )
  public AllSimpleTypesMessageInfo getObject() {
    return object;
  }

  /**
   * @param value - Object
   */
  public void setObject(AllSimpleTypesMessageInfo value) {
    this.object = value;
  }

  /**
   * @return true if Object is not null
   */
  public boolean hasObject() {
    return object != null;
  }

  /**
   */
  public void nullifyObject() {
    this.object = null;
  }

  /**
   * @return Boolean List
   */
  @SchemaElement
  public BooleanArrayList getBooleanList() {
    return booleanList;
  }

  /**
   * @param value - Boolean List
   */
  public void setBooleanList(BooleanArrayList value) {
    this.booleanList = value;
  }

  /**
   * @return true if Boolean List is not null
   */
  public boolean hasBooleanList() {
    return booleanList != null;
  }

  /**
   */
  public void nullifyBooleanList() {
    this.booleanList = null;
  }

  /**
   * @return Byte List
   */
  @SchemaElement
  public ByteArrayList getByteList() {
    return byteList;
  }

  /**
   * @param value - Byte List
   */
  public void setByteList(ByteArrayList value) {
    this.byteList = value;
  }

  /**
   * @return true if Byte List is not null
   */
  public boolean hasByteList() {
    return byteList != null;
  }

  /**
   */
  public void nullifyByteList() {
    this.byteList = null;
  }

  /**
   * @return Double List
   */
  @SchemaElement
  public DoubleArrayList getDoubleList() {
    return doubleList;
  }

  /**
   * @param value - Double List
   */
  public void setDoubleList(DoubleArrayList value) {
    this.doubleList = value;
  }

  /**
   * @return true if Double List is not null
   */
  public boolean hasDoubleList() {
    return doubleList != null;
  }

  /**
   */
  public void nullifyDoubleList() {
    this.doubleList = null;
  }

  /**
   * @return Float List
   */
  @SchemaElement
  public FloatArrayList getFloatList() {
    return floatList;
  }

  /**
   * @param value - Float List
   */
  public void setFloatList(FloatArrayList value) {
    this.floatList = value;
  }

  /**
   * @return true if Float List is not null
   */
  public boolean hasFloatList() {
    return floatList != null;
  }

  /**
   */
  public void nullifyFloatList() {
    this.floatList = null;
  }

  /**
   * @return Int List
   */
  @SchemaElement
  public IntegerArrayList getIntList() {
    return intList;
  }

  /**
   * @param value - Int List
   */
  public void setIntList(IntegerArrayList value) {
    this.intList = value;
  }

  /**
   * @return true if Int List is not null
   */
  public boolean hasIntList() {
    return intList != null;
  }

  /**
   */
  public void nullifyIntList() {
    this.intList = null;
  }

  /**
   * @return Long List
   */
  @SchemaElement
  public LongArrayList getLongList() {
    return longList;
  }

  /**
   * @param value - Long List
   */
  public void setLongList(LongArrayList value) {
    this.longList = value;
  }

  /**
   * @return true if Long List is not null
   */
  public boolean hasLongList() {
    return longList != null;
  }

  /**
   */
  public void nullifyLongList() {
    this.longList = null;
  }

  /**
   * @return Short List
   */
  @SchemaElement
  public ShortArrayList getShortList() {
    return shortList;
  }

  /**
   * @param value - Short List
   */
  public void setShortList(ShortArrayList value) {
    this.shortList = value;
  }

  /**
   * @return true if Short List is not null
   */
  public boolean hasShortList() {
    return shortList != null;
  }

  /**
   */
  public void nullifyShortList() {
    this.shortList = null;
  }

  /**
   * @return Objects List
   */
  @SchemaElement
  @SchemaArrayType(
      elementTypes =  {
            AllSimpleTypesMessage.class}

  )
  public ObjectArrayList<AllSimpleTypesMessageInfo> getObjectsList() {
    return objectsList;
  }

  /**
   * @param value - Objects List
   */
  public void setObjectsList(ObjectArrayList<AllSimpleTypesMessageInfo> value) {
    this.objectsList = value;
  }

  /**
   * @return true if Objects List is not null
   */
  public boolean hasObjectsList() {
    return objectsList != null;
  }

  /**
   */
  public void nullifyObjectsList() {
    this.objectsList = null;
  }

  /**
   * Creates new instance of this class.
   * @return new instance of this class.
   */
  @Override
  protected AllTypesMessage createInstance() {
    return new AllTypesMessage();
  }

  /**
   * Method nullifies all instance properties
   */
  @Override
  public AllTypesMessage nullify() {
    super.nullify();
    nullifyObject();
    nullifyBooleanList();
    nullifyByteList();
    nullifyDoubleList();
    nullifyFloatList();
    nullifyIntList();
    nullifyLongList();
    nullifyShortList();
    nullifyObjectsList();
    return this;
  }

  /**
   * Resets all instance properties to their default values
   */
  @Override
  public AllTypesMessage reset() {
    super.reset();
    object = null;
    booleanList = null;
    byteList = null;
    doubleList = null;
    floatList = null;
    intList = null;
    longList = null;
    shortList = null;
    objectsList = null;
    return this;
  }

  /**
   * Method copies state to a given instance
   */
  @Override
  public AllTypesMessage clone() {
    AllTypesMessage t = createInstance();
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
    if (!(obj instanceof AllTypesMessageInfo)) return false;
    AllTypesMessageInfo other =(AllTypesMessageInfo)obj;
    if (hasObject() != other.hasObject()) return false;
    if (hasObject() && !(getObject().equals(other.getObject()))) return false;
    if (hasBooleanList() != other.hasBooleanList()) return false;
    if (hasBooleanList()) {
      if (getBooleanList().size() != other.getBooleanList().size()) return false;
      else for (int j = 0; j < getBooleanList().size(); ++j) {
        if (getBooleanList().get(j) != other.getBooleanList().get(j)) return false;
      }
    }
    if (hasByteList() != other.hasByteList()) return false;
    if (hasByteList()) {
      if (getByteList().size() != other.getByteList().size()) return false;
      else for (int j = 0; j < getByteList().size(); ++j) {
        if (getByteList().get(j) != other.getByteList().get(j)) return false;
      }
    }
    if (hasDoubleList() != other.hasDoubleList()) return false;
    if (hasDoubleList()) {
      if (getDoubleList().size() != other.getDoubleList().size()) return false;
      else for (int j = 0; j < getDoubleList().size(); ++j) {
        if (getDoubleList().get(j) != other.getDoubleList().get(j)) return false;
      }
    }
    if (hasFloatList() != other.hasFloatList()) return false;
    if (hasFloatList()) {
      if (getFloatList().size() != other.getFloatList().size()) return false;
      else for (int j = 0; j < getFloatList().size(); ++j) {
      }
    }
    if (hasIntList() != other.hasIntList()) return false;
    if (hasIntList()) {
      if (getIntList().size() != other.getIntList().size()) return false;
      else for (int j = 0; j < getIntList().size(); ++j) {
        if (getIntList().get(j) != other.getIntList().get(j)) return false;
      }
    }
    if (hasLongList() != other.hasLongList()) return false;
    if (hasLongList()) {
      if (getLongList().size() != other.getLongList().size()) return false;
      else for (int j = 0; j < getLongList().size(); ++j) {
        if (getLongList().get(j) != other.getLongList().get(j)) return false;
      }
    }
    if (hasShortList() != other.hasShortList()) return false;
    if (hasShortList()) {
      if (getShortList().size() != other.getShortList().size()) return false;
      else for (int j = 0; j < getShortList().size(); ++j) {
        if (getShortList().get(j) != other.getShortList().get(j)) return false;
      }
    }
    if (hasObjectsList() != other.hasObjectsList()) return false;
    if (hasObjectsList()) {
      if (getObjectsList().size() != other.getObjectsList().size()) return false;
      else for (int j = 0; j < getObjectsList().size(); ++j) {
        if ((getObjectsList().get(j) != null) != (other.getObjectsList().get(j) != null)) return false;
        if (getObjectsList().get(j) != null && !getObjectsList().get(j).equals(other.getObjectsList().get(j))) return false;
      }
    }
    return true;
  }

  /**
   * Returns a hash code value for the object. This method is * supported for the benefit of hash tables such as those provided by.
   */
  @Override
  public int hashCode() {
    int hash = super.hashCode();
    if (hasObject()) {
      hash = hash * 31 + getObject().hashCode();
    }
    if (hasBooleanList()) {
      hash = hash * 31 + getBooleanList().hashCode();
    }
    if (hasByteList()) {
      hash = hash * 31 + getByteList().hashCode();
    }
    if (hasDoubleList()) {
      hash = hash * 31 + getDoubleList().hashCode();
    }
    if (hasIntList()) {
      hash = hash * 31 + getIntList().hashCode();
    }
    if (hasLongList()) {
      hash = hash * 31 + getLongList().hashCode();
    }
    if (hasShortList()) {
      hash = hash * 31 + getShortList().hashCode();
    }
    if (hasObjectsList()) {
      for (int j = 0; j < getObjectsList().size(); ++j) {
        hash ^= getObjectsList().get(j).hashCode();
      }
    }
    return hash;
  }

  /**
   * Method copies state to a given instance
   * @param template class instance that should be used as a copy source
   */
  @Override
  public AllTypesMessage copyFrom(RecordInfo template) {
    super.copyFrom(template);
    if (template instanceof AllTypesMessageInfo) {
      AllTypesMessageInfo t = (AllTypesMessageInfo)template;
      if (t.hasObject()) {
        if (hasObject() && getObject() instanceof RecordInterface) {
          ((RecordInterface)getObject()).copyFrom(t.getObject());
        } else {
          setObject((AllSimpleTypesMessageInfo)t.getObject().clone());
        }
      } else {
        nullifyObject();
      }
      if (t.hasBooleanList()) {
        if (!hasBooleanList()) {
          setBooleanList(new BooleanArrayList(t.getBooleanList().size()));
        } else {
          getBooleanList().clear();
        }
        for (int i = 0; i < getBooleanList().size(); ++i) ((BooleanArrayList)getBooleanList()).add(t.getBooleanList().get(i));
      } else {
        nullifyBooleanList();
      }
      if (t.hasByteList()) {
        if (!hasByteList()) {
          setByteList(new ByteArrayList(t.getByteList().size()));
        } else {
          getByteList().clear();
        }
        for (int i = 0; i < getByteList().size(); ++i) ((ByteArrayList)getByteList()).add(t.getByteList().get(i));
      } else {
        nullifyByteList();
      }
      if (t.hasDoubleList()) {
        if (!hasDoubleList()) {
          setDoubleList(new DoubleArrayList(t.getDoubleList().size()));
        } else {
          getDoubleList().clear();
        }
        for (int i = 0; i < getDoubleList().size(); ++i) ((DoubleArrayList)getDoubleList()).add(t.getDoubleList().get(i));
      } else {
        nullifyDoubleList();
      }
      if (t.hasFloatList()) {
        if (!hasFloatList()) {
          setFloatList(new FloatArrayList(t.getFloatList().size()));
        } else {
          getFloatList().clear();
        }
        for (int i = 0; i < getFloatList().size(); ++i) ((FloatArrayList)getFloatList()).add(t.getFloatList().get(i));
      } else {
        nullifyFloatList();
      }
      if (t.hasIntList()) {
        if (!hasIntList()) {
          setIntList(new IntegerArrayList(t.getIntList().size()));
        } else {
          getIntList().clear();
        }
        for (int i = 0; i < getIntList().size(); ++i) ((IntegerArrayList)getIntList()).add(t.getIntList().get(i));
      } else {
        nullifyIntList();
      }
      if (t.hasLongList()) {
        if (!hasLongList()) {
          setLongList(new LongArrayList(t.getLongList().size()));
        } else {
          getLongList().clear();
        }
        for (int i = 0; i < getLongList().size(); ++i) ((LongArrayList)getLongList()).add(t.getLongList().get(i));
      } else {
        nullifyLongList();
      }
      if (t.hasShortList()) {
        if (!hasShortList()) {
          setShortList(new ShortArrayList(t.getShortList().size()));
        } else {
          getShortList().clear();
        }
        for (int i = 0; i < getShortList().size(); ++i) ((ShortArrayList)getShortList()).add(t.getShortList().get(i));
      } else {
        nullifyShortList();
      }
      if (t.hasObjectsList()) {
        if (!hasObjectsList()) {
          setObjectsList(new ObjectArrayList<AllSimpleTypesMessageInfo>(t.getObjectsList().size()));
        } else {
          getObjectsList().clear();
        }
        for (int i = 0; i < t.getObjectsList().size(); ++i) ((ObjectArrayList<AllSimpleTypesMessageInfo>)getObjectsList()).add((AllSimpleTypesMessageInfo)t.getObjectsList().get(i).clone());
      } else {
        nullifyObjectsList();
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
    str.append("{ \"$type\":  \"AllTypesMessage\"");
    if (hasObject()) {
      str.append(", \"object\": ");
      getObject().toString(str);
    }
    if (hasBooleanList()) {
      str.append(", \"booleanList\": [");
      if (getBooleanList().size() > 0) {
        str.append(getBooleanList().get(0));
      }
      for (int i = 1; i < getBooleanList().size(); ++i) {
        str.append(", ");
        str.append(getBooleanList().get(i));
      }
      str.append("]");
    }
    if (hasByteList()) {
      str.append(", \"byteList\": [");
      if (getByteList().size() > 0) {
        str.append(getByteList().get(0));
      }
      for (int i = 1; i < getByteList().size(); ++i) {
        str.append(", ");
        str.append(getByteList().get(i));
      }
      str.append("]");
    }
    if (hasDoubleList()) {
      str.append(", \"doubleList\": [");
      if (getDoubleList().size() > 0) {
        str.append(getDoubleList().get(0));
      }
      for (int i = 1; i < getDoubleList().size(); ++i) {
        str.append(", ");
        str.append(getDoubleList().get(i));
      }
      str.append("]");
    }
    if (hasFloatList()) {
      str.append(", \"floatList\": [");
      if (getFloatList().size() > 0) {
        str.append(getFloatList().get(0));
      }
      for (int i = 1; i < getFloatList().size(); ++i) {
        str.append(", ");
        str.append(getFloatList().get(i));
      }
      str.append("]");
    }
    if (hasIntList()) {
      str.append(", \"intList\": [");
      if (getIntList().size() > 0) {
        str.append(getIntList().get(0));
      }
      for (int i = 1; i < getIntList().size(); ++i) {
        str.append(", ");
        str.append(getIntList().get(i));
      }
      str.append("]");
    }
    if (hasLongList()) {
      str.append(", \"longList\": [");
      if (getLongList().size() > 0) {
        str.append(getLongList().get(0));
      }
      for (int i = 1; i < getLongList().size(); ++i) {
        str.append(", ");
        str.append(getLongList().get(i));
      }
      str.append("]");
    }
    if (hasShortList()) {
      str.append(", \"shortList\": [");
      if (getShortList().size() > 0) {
        str.append(getShortList().get(0));
      }
      for (int i = 1; i < getShortList().size(); ++i) {
        str.append(", ");
        str.append(getShortList().get(i));
      }
      str.append("]");
    }
    if (hasObjectsList()) {
      str.append(", \"objectsList\": [");
      if (getObjectsList().size() > 0) {
        if (getObjectsList().get(0) == null) {
          str.append("null");
        } else {
          getObjectsList().get(0).toString(str);
        }
      }
      for (int i = 1; i < getObjectsList().size(); ++i) {
        str.append(", ");
        if (getObjectsList().get(i) == null) {
          str.append("null");
        } else {
          getObjectsList().get(i).toString(str);
        }
      }
      str.append("]");
    }
    if (hasBoolField()) {
      str.append(", \"boolField\": ").append(isBoolField());
    }
    if (hasBoolNullableField()) {
      str.append(", \"boolNullableField\": ").append(isBoolNullableField());
    }
    if (hasBinaryField()) {
      str.append(", \"binaryField\": ").append(getBinaryField());
    }
    if (hasBinaryNullableField()) {
      str.append(", \"binaryNullableField\": ").append(getBinaryNullableField());
    }
    if (hasByteField()) {
      str.append(", \"byteField\": ").append(getByteField());
    }
    if (hasByteNullableField()) {
      str.append(", \"byteNullableField\": ").append(getByteNullableField());
    }
    if (hasShortField()) {
      str.append(", \"shortField\": ").append(getShortField());
    }
    if (hasShortNullableField()) {
      str.append(", \"shortNullableField\": ").append(getShortNullableField());
    }
    if (hasIntField()) {
      str.append(", \"intField\": ").append(getIntField());
    }
    if (hasIntNullableField()) {
      str.append(", \"intNullableField\": ").append(getIntNullableField());
    }
    if (hasLongField()) {
      str.append(", \"longField\": ").append(getLongField());
    }
    if (hasLongNullableField()) {
      str.append(", \"longNullableField\": ").append(getLongNullableField());
    }
    if (hasFloatField()) {
      str.append(", \"floatField\": ").append(getFloatField());
    }
    if (hasFloatNullableField()) {
      str.append(", \"floatNullableField\": ").append(getFloatNullableField());
    }
    if (hasDoubleField()) {
      str.append(", \"doubleField\": ").append(getDoubleField());
    }
    if (hasDoubleNullableField()) {
      str.append(", \"doubleNullableField\": ").append(getDoubleNullableField());
    }
    if (hasDecimalField()) {
      str.append(", \"decimalField\": ");
      Decimal64Utils.appendTo(getDecimalField(), str);
    }
    if (hasDecimalNullableField()) {
      str.append(", \"decimalNullableField\": ");
      Decimal64Utils.appendTo(getDecimalNullableField(), str);
    }
    if (hasTextAlphaNumericField()) {
      str.append(", \"textAlphaNumericField\": ").append(getTextAlphaNumericField());
    }
    if (hasTextAlphaNumericNullableField()) {
      str.append(", \"textAlphaNumericNullableField\": ").append(getTextAlphaNumericNullableField());
    }
    if (hasTextField()) {
      str.append(", \"textField\": \"").append(getTextField()).append("\"");
    }
    if (hasTextNullableField()) {
      str.append(", \"textNullableField\": \"").append(getTextNullableField()).append("\"");
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
