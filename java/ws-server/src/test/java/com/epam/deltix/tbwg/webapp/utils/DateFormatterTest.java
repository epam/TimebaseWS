package com.epam.deltix.tbwg.webapp.utils;

import org.junit.Test;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.net.URISyntaxException;
import java.net.URL;
import java.nio.file.Files;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import static org.junit.Assert.*;


public class DateFormatterTest {

    @Test
    public void msDateFormate() throws URISyntaxException, IOException {
        long timestampMs = 1700000000000L;
        long timestampNs = 1700000000000000000L;
        BufferedReader formatReader = getSourceReader("import/dateformat-expected.txt");
        List<String> timestamps = readAllLines("import/dateformat.txt");
        String format = formatReader.readLine();
        int formatLine = 0;
        while (format != null) {
            DateFormatter formatter = new DateFormatter(format);
            for (int timestampLine = 0; timestampLine < timestamps.size(); timestampLine++) {
                String timestampStr = timestamps.get(timestampLine);
                if (timestampLine == formatLine) {
                    //the format matches the date - everything is fine
                    long ms = formatter.fromDateString(timestampStr);
                    String dateString = formatter.toDateString(timestampMs);
                    assertEquals(timestampStr, dateString);
                    //When trying to lead to NS Everything is ok, but we got only ms part in Ns
                    long nsTime = formatter.fromNanoDateString(timestampStr);
                    assertTrue(nsTime == timestampNs || formatter.toNanosDateString(timestampNs).equals(timestampStr));
                    assertEquals(ms * 1000000, nsTime);
                } else {
                    //format does not match the date - expect an error and to nano and to ms
                    try {
                        formatter.fromDateString(timestampStr);
                        fail("Expected an DateTimeParseException to be thrown");
                    } catch (DateTimeParseException e) {
                        // Test passes
                    }
                    try {
                        formatter.fromNanoDateString(timestampStr);
                    } catch (DateTimeParseException e) {
                        // Test passes
                    }
                }

            }
            format = formatReader.readLine();
            formatLine++;
        }
        formatReader.close();
    }

    @Test
    public void nsDateFormate() throws URISyntaxException, IOException {
        long timestampMs = 1700000000123L;
        long timestampNs = 1700000000123456789L;
        List<String> formats = readAllLines("import/dateformat-nanotime-expected.txt");
        List<String> timestamps = readAllLines("import/dateformat-nanotime.txt");
        for (int formatLine = 0; formatLine < formats.size(); formatLine++) {
            String format = formats.get(formatLine);
            DateFormatter formatter = new DateFormatter(format);
            for (int timestampLine = 0; timestampLine < timestamps.size(); timestampLine++) {
                String timestampStr = timestamps.get(timestampLine);
                if (timestampLine == formatLine) {
                    //the format matches the date - everything is fine
                    formatter.fromNanoDateString(timestampStr);
                    String dateString = formatter.toNanosDateString(timestampNs);
                    assertEquals(timestampStr, dateString);
                    //When trying to lead to MS Everything is ok, but we lose the NS part
                    long msTime = formatter.fromDateString(timestampStr);
                    assertEquals(timestampMs, msTime);
                } else {
                    //format does not match the date - expect an error and to nano and to ms
                    try {
                        formatter.fromNanoDateString(timestampStr);
                        fail("Expected an DateTimeParseException to be thrown");
                    } catch (DateTimeParseException e) {
                        // Test passes
                    }
                    try {
                        formatter.fromDateString(timestampStr);
                        fail("Expected an DateTimeParseException to be thrown");
                    } catch (DateTimeParseException e) {
                        //Test passes
                    }
                }
            }
        }
    }

    @Test
    public void fromMsTimeToNsPattern() throws URISyntaxException, IOException {
        List<String> formats = readAllLines("import/dateformat-nanotime-expected.txt");
        List<String> timestamps = readAllLines("import/dateformat.txt");
        for (int formatLine = 0; formatLine < formats.size(); formatLine++) {
            String format = formats.get(formatLine);
            DateFormatter formatter = new DateFormatter(format);
            for (int timestampLine = 0; timestampLine < timestamps.size(); timestampLine++) {
                String timestampStr = timestamps.get(timestampLine);

                try {
                    formatter.fromNanoDateString(timestampStr);
                    fail("Expected an DateTimeParseException to be thrown");
                } catch (DateTimeParseException e) {
                    // Test passes
                }

                try {
                    formatter.fromDateString(timestampStr);
                    fail("Expected an DateTimeParseException to be thrown");
                } catch (DateTimeParseException e) {
                    // Test passes
                }
            }
        }
    }

    @Test
    public void fromNsTimeToMsPattern() throws URISyntaxException, IOException {
        List<String> formats = readAllLines("import/dateformat-expected.txt");
        List<String> timestamps = readAllLines("import/dateformat-nanotime.txt");
        for (int formatLine = 0; formatLine < formats.size(); formatLine++) {
            String format = formats.get(formatLine);
            DateFormatter formatter = new DateFormatter(format);
            for (int timestampLine = 0; timestampLine < timestamps.size(); timestampLine++) {
                String timestampStr = timestamps.get(timestampLine);

                try {
                    formatter.fromNanoDateString(timestampStr);
                    fail("Expected an DateTimeParseException to be thrown");
                } catch (DateTimeParseException e) {
                    // Test passes
                }

                try {
                    formatter.fromDateString(timestampStr);
                    fail("Expected an DateTimeParseException to be thrown");
                } catch (DateTimeParseException e) {
                    // Test passes
                }
            }
        }
    }

    private List<String> readAllLines(String path) throws URISyntaxException, IOException {
        List<String> result = new ArrayList<>();
        BufferedReader reader = getSourceReader(path);
        String line = reader.readLine();
        while (line != null) {
            result.add(line);
            line = reader.readLine();
        }
        reader.close();
        return result;
    }

    private BufferedReader getSourceReader(String res) throws URISyntaxException, IOException {
        URL resource = getClass().getClassLoader().getResource(res);
        File file = new File(Objects.requireNonNull(resource).toURI());
        return Files.newBufferedReader(file.toPath());
    }

}