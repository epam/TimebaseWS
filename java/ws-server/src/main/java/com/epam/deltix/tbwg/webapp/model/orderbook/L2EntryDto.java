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
package com.epam.deltix.tbwg.webapp.model.orderbook;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.epam.deltix.dfp.Decimal64Utils;

public class L2EntryDto {

    public Side side;

    public Short level;

    public L2Action action;

    @JsonProperty("exchange_id")
    public String exchangeId;

    @JsonIgnore
    public long alphanumericExchangeId;

    private long price;
    private String priceStr;

    public void setPrice(long price) {
        this.price = price;
        this.priceStr = null;
    }

    public String getPrice() {
        if (priceStr == null) {
            priceStr = Decimal64Utils.isNaN(price) || Decimal64Utils.isNull(price) ? null : Decimal64Utils.toString(price);
        }

        return priceStr;
    }

    private long quantity;
    private String quantityStr;

    public void setQuantity(long quantity) {
        this.quantity = quantity;
        this.quantityStr = null;
    }

    public String getQuantity() {
        if (quantityStr == null) {
            quantityStr = Decimal64Utils.isNaN(quantity) || Decimal64Utils.isNull(quantity) ? null : Decimal64Utils.toString(quantity);
        }

        return quantityStr;
    }

    @JsonProperty("number_of_orders")
    public long numberOfOrders;

}
