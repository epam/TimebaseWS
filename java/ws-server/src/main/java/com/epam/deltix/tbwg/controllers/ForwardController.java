package com.epam.deltix.tbwg.controllers;

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
    @RequestMapping("/app/**/{path:[^.]*}")
    public String redirect(@PathVariable String path) {
        return "forward:/";
    }

    @Ignore
    @RequestMapping("/auth/login")
    public String redirectLogin() {
        return "forward:/";
    }

    @Ignore
    @RequestMapping("/app")
    public String redirect() {
        return "forward:/";
    }
}
