/*
 * Copyright 2023 EPAM Systems, Inc
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
package com.epam.deltix.tbwg.webapp.model.schema;

public enum StandardMessageTypes {

    BARS(new String[]{"deltix.timebase.api.messages.BarMessage"}),
    TRADES(new String[]{"deltix.timebase.api.messages.TradeMessage"}),
    BBO(new String[]{"deltix.timebase.api.messages.BestBidOfferMessage"}),
    UNIVERSAL(new String[]{"deltix.timebase.api.messages.universal.PackageHeader"}),
    SECURITIES(new String[]{
            "deltix.timebase.api.messages.securities.Equity",
            "deltix.timebase.api.messages.securities.Future",
            "deltix.timebase.api.messages.securities.ContinuousFuture",
            "deltix.timebase.api.messages.securities.Currency",
            "deltix.timebase.api.messages.securities.CustomInstrument",
            "deltix.timebase.api.messages.securities.Option",
            "deltix.timebase.api.messages.securities.Bond",
            "deltix.timebase.api.messages.securities.Index",
            "deltix.timebase.api.messages.securities.ETF",
            "deltix.timebase.api.messages.securities.ExchangeTradedSynthetic"});

    private final String[] classNames;

    StandardMessageTypes(String[] classNames) {
        this.classNames = classNames;
    }

    public String[] getClassNames() {
        return classNames;
    }
}
