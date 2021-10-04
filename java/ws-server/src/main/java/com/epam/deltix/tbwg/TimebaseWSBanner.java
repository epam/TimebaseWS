package com.epam.deltix.tbwg;

import org.springframework.boot.Banner;
import org.springframework.core.env.Environment;

import java.io.PrintStream;

public class TimebaseWSBanner implements Banner {
    @Override
    public void printBanner(Environment environment, Class<?> sourceClass, PrintStream out) {
        out.append("\n" +
                " _______  _                ______                          ______                                          \n" +
                        "(_______)(_)              (____  \\                        / _____)        _                                \n" +
                        " _        _  ____    ____  ____)  )  ____   ___   ____   | /  ___   ____ | |_    ____  _ _ _   ____  _   _ \n" +
                        "| |      | ||    \\  / _  )|  __  (  / _  | /___) / _  )  | | (___) / _  ||  _)  / _  )| | | | / _  || | | |\n" +
                        "| |_____ | || | | |( (/ / | |__)  )( ( | ||___ |( (/ /   | \\____/|( ( | || |__ ( (/ / | | | |( ( | || |_| |\n" +
                        " \\______)|_||_|_|_| \\____)|______/  \\_||_|(___/  \\____)   \\_____/  \\_||_| \\___) \\____) \\____| \\_||_| \\__  |\n" +
                        "                                                                                                    (____/ "
        );
    }
}
