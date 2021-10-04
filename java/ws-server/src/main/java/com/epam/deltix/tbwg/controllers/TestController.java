package com.epam.deltix.tbwg.controllers;

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
