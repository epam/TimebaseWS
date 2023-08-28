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
package com.epam.deltix.tbwg.webapp.model.ws;

import com.google.gson.*;

import java.lang.reflect.Type;

/**
 * @author Daniil Yarmalkevich
 * Date: 8/22/2019
 */
public class WSMessageTypeAdapter implements JsonDeserializer<WSMessage> {

    @Override
    public WSMessage deserialize(JsonElement json, Type typeOfT, JsonDeserializationContext context) throws JsonParseException {
        if (!json.isJsonObject()) {
            throw new JsonParseException(String.format("JSON object has been expected, but got %s", json));
        }
        JsonObject object = json.getAsJsonObject();
        JsonElement type = object.get("messageType");
        if (type == null || !type.isJsonPrimitive()) {
            throw new JsonParseException(String.format("JSON object with \"messageType\" string field has been expected, but got %s", json));
        }
        MessageType messageType;
        try {
            messageType = MessageType.valueOf(type.getAsString());
        } catch (IllegalArgumentException exc) {
            throw new JsonParseException(exc);
        }
        switch (messageType) {
            case SUBSCRIBE:
                return context.deserialize(json, SubscribeMessage.class);
            case SET_SUBSCRIPTION:
                return context.deserialize(json, SetSubscriptionMessage.class);
            case SUBSCRIBE_QUERY:
                return context.deserialize(json, SubscribeQueryMessage.class);
        }
        return null;
    }

}
