package com.epam.deltix.tbwg.utils;

import java.nio.file.Paths;
import java.util.Properties;

/**
 * Created by Alex Karpovich on 7/18/2018.
 */
public class SimpleArgsParser {

    public static Properties process(String[] args) {
        return process(args, "-");
    }

    public static Properties process(String[] args, String namePrefix) {

        Properties props = new Properties();

        for (int i = 0; i < args.length; i++) {
            String arg = args[i];

            if (arg.startsWith(namePrefix)) {
                if (++i == args.length)
                    throw new IllegalArgumentException("Undefined value for name: " + arg);
                props.put(arg, args[i]);
            }
        }

        return props;
    }
}
