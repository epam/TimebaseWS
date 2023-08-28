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

import com.webcohesion.enunciate.metadata.Ignore;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * For Angular on UI.
 * When refreshing UI page Spring Boot knows nothing about specific Angular state,
 * so the forward to root page is needed.
 *
 * @author Daniil Yarmalkevich
 * Date: 8/16/2019
 */
@Controller
@CrossOrigin
public class ForwardController {

    /**
     * Forward to home page so that route is preserved.
     */
    @Ignore
    @RequestMapping("/app/**")
    public String redirect() {
        return "forward:/";
    }

    @Ignore
    @RequestMapping("/auth/login")
    public String redirectLogin() {
        return "forward:/";
    }

}
