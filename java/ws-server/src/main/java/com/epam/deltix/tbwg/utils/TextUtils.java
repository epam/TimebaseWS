package com.epam.deltix.tbwg.utils;


public class TextUtils {

    private static final byte ALLOWED_RANGE_BEGIN = 0x20; // ' '
    private static final byte ALLOWED_RANGE_END = 0x7E;   // '~'

    public static String toHex(final byte[] data) {
        if (data == null) {
            return null;
        }

        final char[] chars = new char[data.length << 1];

        for (int i = 0, j = 0; i < data.length; i++, j += 2) {
            final int b = data[i];

            chars[j + 0] = Character.forDigit((b >>> 4) & 0xF, 0x10);
            chars[j + 1] = Character.forDigit(b & 0xF, 0x10);
        }

        return new String(chars);
    }

    public static byte[] fromHex(final String hex) {
        if (hex == null || (hex.length() & 1) != 0) {
            return null;
        }

        final byte[] data = new byte[hex.length() >>> 1];

        for (int i = 0, j = 0; i < hex.length(); i += 2, j++) {
            final byte b0 = fromHex(hex.charAt(i + 0));
            final byte b1 = fromHex(hex.charAt(i + 1));

            if (b0 < 0 || b1 < 0) {
                return null;
            }

            data[j] = (byte) ((b0 << 4) | b1);
        }

        return data;
    }

    private static byte fromHex(final char c) {
        if (c >= '0' && c <= '9') return (byte) (c - '0');
        if (c >= 'a' && c <= 'f') return (byte) (c - 'a' + 10);
        if (c >= 'A' && c <= 'F') return (byte) (c - 'A' + 10);

        return -1;
    }

    public static boolean verify(final byte[] body) {
        for (final byte b : body) {
            if (b > ALLOWED_RANGE_END || (b < ALLOWED_RANGE_BEGIN && b != '\n' && b != '\r' && b != '\t')) {
                return false;
            }
        }

        return true;
    }

    public static boolean verify(final String body) {
        for (int i = 0; i < body.length(); i++) {
            final char c = body.charAt(i);

            if (c > ALLOWED_RANGE_END || (c < ALLOWED_RANGE_BEGIN && c != '\n' && c != '\r' && c != '\t')) {
                return false;
            }
        }

        return true;
    }

}
