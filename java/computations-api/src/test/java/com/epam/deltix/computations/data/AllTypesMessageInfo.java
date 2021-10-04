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

import com.epam.deltix.util.collections.generated.*;

import java.lang.Override;

/**
 */
public interface AllTypesMessageInfo extends AllSimpleTypesMessageInfo {
  /**
   * @return Object
   */
  AllSimpleTypesMessageInfo getObject();

  /**
   * @return true if Object is not null
   */
  boolean hasObject();

  /**
   * @return Boolean List
   */
  BooleanList getBooleanList();

  /**
   * @return true if Boolean List is not null
   */
  boolean hasBooleanList();

  /**
   * @return Byte List
   */
  ByteList getByteList();

  /**
   * @return true if Byte List is not null
   */
  boolean hasByteList();

  /**
   * @return Double List
   */
  DoubleList getDoubleList();

  /**
   * @return true if Double List is not null
   */
  boolean hasDoubleList();

  /**
   * @return Float List
   */
  FloatList getFloatList();

  /**
   * @return true if Float List is not null
   */
  boolean hasFloatList();

  /**
   * @return Int List
   */
  IntegerList getIntList();

  /**
   * @return true if Int List is not null
   */
  boolean hasIntList();

  /**
   * @return Long List
   */
  LongList getLongList();

  /**
   * @return true if Long List is not null
   */
  boolean hasLongList();

  /**
   * @return Short List
   */
  ShortList getShortList();

  /**
   * @return true if Short List is not null
   */
  boolean hasShortList();

  /**
   * @return Objects List
   */
  ObjectList<AllSimpleTypesMessageInfo> getObjectsList();

  /**
   * @return true if Objects List is not null
   */
  boolean hasObjectsList();

  /**
   * Method copies state to a given instance
   */
  @Override
  AllTypesMessageInfo clone();
}
