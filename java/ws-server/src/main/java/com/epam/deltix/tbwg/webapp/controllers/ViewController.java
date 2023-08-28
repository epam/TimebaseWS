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

import com.epam.deltix.qsrv.hf.pub.md.ClassDescriptor;
import com.epam.deltix.qsrv.hf.pub.md.ClassSet;
import com.epam.deltix.qsrv.hf.tickdb.pub.SelectionOptions;
import com.epam.deltix.tbwg.messages.ViewState;
import com.epam.deltix.tbwg.webapp.model.view.SaveQueryViewInfoDef;
import com.epam.deltix.tbwg.webapp.services.timebase.TimebaseService;
import com.epam.deltix.tbwg.webapp.services.timebase.exc.InvalidQueryException;
import com.epam.deltix.tbwg.webapp.services.view.md.MutableQueryViewMd;
import com.epam.deltix.tbwg.webapp.services.view.md.ViewMd;
import com.epam.deltix.tbwg.webapp.services.view.ViewService;
import com.epam.deltix.tbwg.webapp.services.view.md.ViewMdUtils;
import com.epam.deltix.util.parsers.CompilationException;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/v0/timebase/views")
@CrossOrigin
public class ViewController {

    private final TimebaseService timebaseService;
    private final ViewService viewService;

    public ViewController(TimebaseService timebaseService, ViewService viewService) {
        this.timebaseService = timebaseService;
        this.viewService = viewService;
    }

    @PreAuthorize("hasAnyAuthority('TB_ALLOW_READ')")
    @RequestMapping(value = {""}, method = RequestMethod.GET)
    @ResponseBody
    public List<ViewMd> views() {
        return viewService.list();
    }

    @PreAuthorize("hasAnyAuthority('TB_ALLOW_READ')")
    @RequestMapping(value = {"/{viewId}"}, method = RequestMethod.GET)
    @ResponseBody
    public ViewMd view(@PathVariable String viewId) {
        return viewService.get(viewId);
    }

    @PreAuthorize("hasAuthority('TB_ALLOW_WRITE')")
    @RequestMapping(value = "", method = {RequestMethod.POST}, consumes = MediaType.APPLICATION_JSON_VALUE,
        produces = MediaType.APPLICATION_JSON_VALUE)
    public ViewMd save(@RequestBody SaveQueryViewInfoDef viewMd) throws InvalidQueryException {
        if (viewMd.getId().contains("/") || viewMd.getId().contains("\\") || viewMd.getId().contains(" ")) {
            throw new RuntimeException("Invalid character in view (can't contain /, \\ or space)");
        }

        try {
            ClassSet classSet = timebaseService.getConnection().describeQuery(viewMd.getQuery(), new SelectionOptions());
            ClassDescriptor[] descriptors = classSet.getClasses();
            for (ClassDescriptor descriptor : descriptors) {
                if (descriptor.getName() == null) {
                    throw new NullPointerException("Query result set contains types with empty name. " +
                        "Use `TYPE` keyword to specify type name for result set, for example: `SELECT a, b, c TYPE MyType`");
                }
            }
        } catch (CompilationException e) {
            throw new InvalidQueryException(viewMd.getQuery());
        }

        MutableQueryViewMd info = ViewMdUtils.INSTANCE.newQueryViewInfo();
        info.setId(viewMd.getId());
        info.setStream(ViewService.getStreamName(viewMd.getId()));
        info.setQuery(viewMd.getQuery());
        info.setLive(viewMd.isLive());
        info.setDescription(viewMd.getDescription());
        info.setType(viewMd.getType());
        info.setState(ViewState.CREATED);
        info.setInfo(null);

        viewService.create(info);
        return info;
    }

    @PreAuthorize("hasAuthority('TB_ALLOW_WRITE')")
    @RequestMapping(value = {"/{viewId}/restart"}, method = RequestMethod.PUT)
    @ResponseBody
    public void restart(@PathVariable String viewId, @RequestParam(required = false) Instant from) {
        viewService.restart(viewId, from);
    }

    @PreAuthorize("hasAuthority('TB_ALLOW_WRITE')")
    @RequestMapping(value = {"/{viewId}/stop"}, method = RequestMethod.PUT)
    @ResponseBody
    public void stop(@PathVariable String viewId) {
        viewService.stop(viewId);
    }

    @PreAuthorize("hasAuthority('TB_ALLOW_WRITE')")
    @RequestMapping(value = "/{viewId}", method = {RequestMethod.DELETE})
    public void delete(@PathVariable String viewId) {
        viewService.delete(viewId);
    }
}
