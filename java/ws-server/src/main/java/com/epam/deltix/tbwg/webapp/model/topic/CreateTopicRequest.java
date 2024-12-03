/*
 * Copyright 2024 EPAM Systems, Inc
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
package com.epam.deltix.tbwg.webapp.model.topic;

import com.epam.deltix.qsrv.hf.pub.md.json.SchemaDef;
import lombok.Data;

@Data
public class CreateTopicRequest {

    private String key;
    private String type;

    private SchemaDef  schema;
    private String copyToStream = null;
    private int version = 5;
    private int distributionFactor = 0;

    //MulticastTopicSettings
    // (optional) Multicast group IP address or a hostname that resolves to a multicast IP.
    private String endpointHost;
    // (optional) Port for multicast
    private Integer endpointPort;
    // (optional) Network interface for sending messages (from publisher) and receiving messages (by consumer)/
    private String networkInterface;
    // (optional) TTL for multicast packets.
    private Integer ttl;


    /**
     * Sets term buffer length for topic.
     * <p>
     * Overrides default term buffer length set on server.
     */
    private Integer termBufferLength;

}