package com.epam.deltix.tbwg.model.ws;

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
        }
        return null;
    }

}
