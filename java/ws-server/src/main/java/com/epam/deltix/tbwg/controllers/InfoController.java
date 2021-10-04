package com.epam.deltix.tbwg.controllers;

import com.webcohesion.enunciate.metadata.rs.TypeHint;
import com.epam.deltix.tbwg.model.auth.AuthInfo;
import com.epam.deltix.tbwg.services.oid.AuthInfoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
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
