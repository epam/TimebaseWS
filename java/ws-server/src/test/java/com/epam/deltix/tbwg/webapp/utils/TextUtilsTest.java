package com.epam.deltix.tbwg.webapp.utils;

import org.junit.Assert;
import org.junit.Test;

public class TextUtilsTest {

    @Test
    public void testAppendURIPath() {
        Assert.assertEquals(TextUtils.appendURIPath("aaa://AAA:123", "bbb/ccc"), "aaa://AAA:123/bbb/ccc");
        Assert.assertEquals(TextUtils.appendURIPath("aaa://AAA:123/aaa", "bbb/ccc"), "aaa://AAA:123/aaa/bbb/ccc");
        Assert.assertEquals(TextUtils.appendURIPath("aaa://AAA:123/aaa/", "bbb/ccc"), "aaa://AAA:123/aaa/bbb/ccc");
        Assert.assertEquals(TextUtils.appendURIPath("aaa://AAA:123/aaa/", "/bbb"), "aaa://AAA:123/aaa/bbb");

        Assert.assertEquals(
            TextUtils.appendURIPath(
                "https://hydra-config.stage.shiftmarketsdev.com/",
                "/.well-known/openid-configuration"
            ),
            "https://hydra-config.stage.shiftmarketsdev.com/.well-known/openid-configuration"
        );

        Assert.assertEquals(
            TextUtils.appendURIPath(
                "https://hydra-config.stage.shiftmarketsdev.com",
                "/.well-known/openid-configuration"
            ),
            "https://hydra-config.stage.shiftmarketsdev.com/.well-known/openid-configuration"
        );

        Assert.assertEquals(
            TextUtils.appendURIPath(
                "https://hydra-config.stage.shiftmarketsdev.com/",
                ".well-known/openid-configuration"
            ),
            "https://hydra-config.stage.shiftmarketsdev.com/.well-known/openid-configuration"
        );
    }
}

