package com.epam.deltix.tbwg.model.ws;

import com.google.gson.*;

import java.lang.reflect.Type;
import java.time.Instant;

public class InstantTypeAdapter implements JsonDeserializer<Instant>, JsonSerializer<Instant> {
    @Override
    public Instant deserialize(JsonElement json, Type typeOfT, JsonDeserializationContext context) throws JsonParseException {
        if (!json.isJsonPrimitive()) {
            throw new JsonParseException("Expected string value to parse into Instant object.");
        }
        return Instant.parse(json.getAsString());
    }

    @Override
    public JsonElement serialize(Instant src, Type typeOfSrc, JsonSerializationContext context) {
        return context.serialize(src.toString());
    }
}
