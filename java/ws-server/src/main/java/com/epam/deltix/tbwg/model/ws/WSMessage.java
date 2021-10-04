package com.epam.deltix.tbwg.model.ws;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * @author Daniil Yarmalkevich
 * Date: 8/21/2019
 */
public abstract class WSMessage {

    @JsonProperty
    public MessageType messageType;

    WSMessage(MessageType messageType) {
        this.messageType = messageType;
    }

}
