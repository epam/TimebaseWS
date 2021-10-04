package com.epam.deltix.tbwg.utils;

import com.epam.deltix.util.LangUtil;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Supplier;

public class HashUtils {

    public static final String HMAC_SHA1_ALGORITHM = "HmacSHA1";
    public static final String HMAC_SHA256_ALGORITHM = "HmacSHA256";
    public static final String HMAC_SHA384_ALGORITHM = "HmacSHA384";

    private static final ThreadLocal<Mac> HMAC_SHA1 = newLocalMac(HMAC_SHA1_ALGORITHM);
    private static final ThreadLocal<Mac> HMAC_SHA256 = newLocalMac(HMAC_SHA256_ALGORITHM);
    private static final ThreadLocal<Mac> HMAC_SHA384 = newLocalMac(HMAC_SHA384_ALGORITHM);

    private static final Map<String, ThreadLocal<Mac>> macs = new HashMap<>();

    static {
        macs.put(HMAC_SHA1_ALGORITHM, HMAC_SHA1);
        macs.put(HMAC_SHA256_ALGORITHM, HMAC_SHA256);
        macs.put(HMAC_SHA384_ALGORITHM, HMAC_SHA384);
    }

    public static byte[] hash(final String value, final byte[] secret, final String algorithm) {
        final ThreadLocal<Mac> localMac = macs.get(algorithm);

        if (localMac == null) {
            throw new RuntimeException("Unknown algorithm: " + algorithm);
        }

        final Mac mac = localMac.get();
        final SecretKeySpec key = new SecretKeySpec(secret, algorithm);

        try {
            mac.reset();
            mac.init(key);

            return mac.doFinal(value.getBytes());
        } catch (final InvalidKeyException e) {
            throw new RuntimeException("Key is not supported.", e);
        }
    }

    public static byte[] hashHmacSha384(final byte[] value, final byte[] secret) {
        final Mac mac = HMAC_SHA384.get();
        final SecretKeySpec key = new SecretKeySpec(secret, HMAC_SHA384_ALGORITHM);

        try {
            mac.reset();
            mac.init(key);

            return mac.doFinal(value);
        } catch (final InvalidKeyException e) {
            throw new RuntimeException("Key is not supported.", e);
        }
    }

    private static ThreadLocal<Mac> newLocalMac(final String algorithm) {
        final Supplier<? extends Mac> supplier = () -> {
            try {
                return Mac.getInstance(algorithm);
            } catch (final NoSuchAlgorithmException e) {
                LangUtil.rethrowUnchecked(e);
                return null;
            }
        };

        return ThreadLocal.withInitial(supplier);
    }

}
