package com.epam.deltix.tbwg.services;

import com.epam.deltix.util.io.IOUtil;
import org.springframework.stereotype.Service;

@Service
public class MangleServiceImpl implements MangleService {
    private static final String SUFFIX = "superKey";
    private static final String PREFIX = "EV";

    private MangleServiceImpl() {
    }

    @Override
    public String convertHashedValue(String value) {
        if (value == null)
            return null;

        return split(value);
    }

    private static String concat(String value) {
        return PREFIX + IOUtil.concat(value, SUFFIX);
    }

    private static String split(String value) {
        if (!isMangled(value))
            return value;

        value = value.substring(PREFIX.length());
        return IOUtil.split(value, SUFFIX);
    }

    private static boolean isMangled(String value) {
        return value.startsWith(PREFIX);
    }

    public static void main(String[] args) {
        if (args.length == 0) {
            System.out.println("Specify string to mangle");
            return;
        }

        System.out.println(MangleServiceImpl.concat(args[0]));
    }
}
