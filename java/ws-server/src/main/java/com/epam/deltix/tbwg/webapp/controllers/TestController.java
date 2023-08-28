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
package com.epam.deltix.tbwg.webapp.controllers;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import java.security.Principal;

public class TestController {

    @RequestMapping(value = "/hello-public", method = RequestMethod.GET)
    public String hello1(Principal user) {
        return "Hello Public";
    }

    @RequestMapping(value = "/hello-read", method = RequestMethod.GET)
    @PreAuthorize("hasAnyAuthority('TB_ALLOW_READ', 'TB_ALLOW_WRITE')")
    public String hello2(Principal user) {
        return "Hello Read";
    }

    @RequestMapping(value = "/hello-write", method = RequestMethod.GET)
    @PreAuthorize("hasAuthority('TB_ALLOW_WRITE')")
    public String hello3(Principal user) throws Exception {
        return "Hello Write";
    }

    @RequestMapping(value = "/throw", method = RequestMethod.GET)
    public String throww(Principal user) throws Exception {
        throw new Exception();
    }


}
