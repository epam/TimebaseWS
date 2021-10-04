package com.epam.deltix.tbwg.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

/**
 * Ping Controller
 */
@Controller
@CrossOrigin
public class PingController {

    /**
     * Returns server timestamp.
     * @return server timestamp in UTC
     */
    @GetMapping("/ping")
    @ResponseBody
    public Long           ping() {
        return System.currentTimeMillis();
    }
}
