package com.epam.deltix.tbwg.webapp.utils.json;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import org.jetbrains.annotations.NotNull;
import org.springframework.core.MethodParameter;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

@Component
public class JsonBigIntEncodingArgumentResolver implements HandlerMethodArgumentResolver {

    private static final Log LOG = LogFactory.getLog(JsonBigIntEncodingArgumentResolver.class);
    public static final String BIG_INT_ENCODING_HEADER = "X-JSON-BigInt-Encoding";
    public static final JsonBigIntEncoding DEFAULT_ENCODING = JsonBigIntEncoding.NUMBER;

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.getParameterType() == JsonBigIntEncoding.class;
    }

    @Override
    public Object resolveArgument(@NotNull MethodParameter parameter, ModelAndViewContainer mavContainer,
                                  NativeWebRequest webRequest, org.springframework.web.bind.support.WebDataBinderFactory binderFactory) {
        String headerValue = webRequest.getHeader(BIG_INT_ENCODING_HEADER);
        if (headerValue != null) {
            try {
                return JsonBigIntEncoding.valueOf(headerValue.trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                LOG.warn("Unknown value for %s: '%s', using default: %s")
                        .with(BIG_INT_ENCODING_HEADER).with(headerValue).with(DEFAULT_ENCODING);
            }
        }
        return DEFAULT_ENCODING;
    }
}