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

import com.webcohesion.enunciate.metadata.rs.TypeHint;
import com.epam.deltix.tbwg.webapp.model.auth.AuthInfo;
import com.epam.deltix.tbwg.webapp.services.oid.AuthInfoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.swing.text.html.HTML;
import java.io.IOException;

@RestController
@RequestMapping("/api/v0")
@CrossOrigin
public class InfoController {

    @Autowired
    private AuthInfoService authInfoService;

    /**
     * Provides auth information.
     */
    @ResponseBody
    @RequestMapping(value = "/authInfo", method = RequestMethod.GET, produces = "application/json")
    public AuthInfo getAuthInfo() {
        return authInfoService.getAuthInfo();
    }

    /**
     * Edit 
     * @return
     */
    @PreAuthorize("hasAnyAuthority('TB_ALLOW_WRITE')")
    @ResponseBody
    @RequestMapping(value = "/writable", method = RequestMethod.GET, produces = "application/json")
    public boolean  isEditable() {
        return true;
    }

    /**
     * <p>Returns documentation.</p>
     */
    @RequestMapping(value = "/docs", method = RequestMethod.GET, produces = MediaType.TEXT_HTML_VALUE)
    @ResponseBody
    @TypeHint(HTML.class)
    void redirectDocs(HttpServletRequest request, HttpServletResponse response) throws IOException {
        String path = request.getServletPath();
        String redirectPath = path.endsWith("/") ? path + "index.html" : path + "/index.html";
        response.sendRedirect(redirectPath);
    }

}
