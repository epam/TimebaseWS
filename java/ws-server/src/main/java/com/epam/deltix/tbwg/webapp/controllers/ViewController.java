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
package com.epam.deltix.tbwg.webapp.controllers;

import com.epam.deltix.tbwg.messages.ViewState;
import com.epam.deltix.tbwg.webapp.model.view.SaveQueryViewInfoDef;
import com.epam.deltix.tbwg.webapp.services.timebase.exc.InvalidQueryException;
import com.epam.deltix.tbwg.webapp.services.view.md.MutableQueryViewMd;
import com.epam.deltix.tbwg.webapp.services.view.md.ViewMd;
import com.epam.deltix.tbwg.webapp.services.view.ViewService;
import com.epam.deltix.tbwg.webapp.services.view.md.ViewMdUtils;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/v0/timebase/views")
@CrossOrigin
public class ViewController {

    private final ViewService viewService;

    public ViewController(ViewService viewService) {
        this.viewService = viewService;
    }

    @PreAuthorize("hasAnyAuthority('TB_ALLOW_READ', 'TB_ALLOW_WRITE')")
    @RequestMapping(value = {""}, method = RequestMethod.GET)
    @ResponseBody
    public List<ViewMd> views(@RequestParam(required = false) String tb) {
        return viewService.list(tb);
    }

    @PreAuthorize("hasAnyAuthority('TB_ALLOW_READ', 'TB_ALLOW_WRITE')")
    @RequestMapping(value = {"/{viewId}"}, method = RequestMethod.GET)
    @ResponseBody
    public ViewMd view(@PathVariable String viewId, @RequestParam(required = false) String tb) {
        return viewService.get(viewId, tb);
    }

    @PreAuthorize("hasAuthority('TB_ALLOW_WRITE')")
    @RequestMapping(value = "", method = {RequestMethod.POST}, consumes = MediaType.APPLICATION_JSON_VALUE,
        produces = MediaType.APPLICATION_JSON_VALUE)
    public ViewMd save(@RequestBody SaveQueryViewInfoDef viewMd,
                       @RequestParam(required = false) String tb) throws InvalidQueryException {
        if (viewMd.getId().contains("/") || viewMd.getId().contains("\\") || viewMd.getId().contains(" ")) {
            throw new RuntimeException("Invalid character in view (can't contain /, \\ or space)");
        }

        MutableQueryViewMd info = ViewMdUtils.INSTANCE.newQueryViewInfo();
        info.setId(viewMd.getId());
        info.setStream(ViewService.getStreamName(viewMd.getId()));
        info.setQuery(viewMd.getQuery());
        info.setLive(viewMd.isLive());
        info.setDescription(viewMd.getDescription());
        info.setState(ViewState.CREATED);
        info.setInfo(null);

        viewService.create(info, tb);
        return info;
    }

    @PreAuthorize("hasAuthority('TB_ALLOW_WRITE')")
    @RequestMapping(value = {"/{viewId}/restart"}, method = RequestMethod.PUT)
    @ResponseBody
    public void restart(@PathVariable String viewId,
                        @RequestParam(required = false) String tb,
                        @RequestParam(required = false) Instant from) {
        viewService.restart(viewId, tb, from);
    }

    @PreAuthorize("hasAuthority('TB_ALLOW_WRITE')")
    @RequestMapping(value = {"/{viewId}/stop"}, method = RequestMethod.PUT)
    @ResponseBody
    public void stop(@PathVariable String viewId, @RequestParam(required = false) String tb) {
        viewService.stop(viewId, tb);
    }

    @PreAuthorize("hasAuthority('TB_ALLOW_WRITE')")
    @RequestMapping(value = "/{viewId}", method = {RequestMethod.DELETE})
    public void delete(@PathVariable String viewId, @RequestParam(required = false) String tb) {
        viewService.delete(viewId, tb);
    }
}