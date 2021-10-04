package com.epam.deltix.tbwg.model.ws.system;

import com.fasterxml.jackson.annotation.JsonProperty;

public abstract class SystemMessage {

    @JsonProperty("messageType")
    public abstract SystemMessageType systemMessageType();

}
