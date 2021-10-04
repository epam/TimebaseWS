package com.epam.deltix.tbwg.utils;

import com.epam.deltix.util.cmdline.DefaultApplication;
import org.apache.commons.codec.digest.HmacAlgorithms;
import org.apache.commons.codec.digest.HmacUtils;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.util.Base64;
import java.util.Random;

public class ApiKeysTool extends DefaultApplication {

    private static final String ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    private static final int RSA_KEYSIZE = 1024;

    protected ApiKeysTool(String[] args) {
        super(args);
    }

    @Override
    protected void run() throws Throwable {
        int keySize = getIntArgValue("-key-size", 12);
        int secretSize = getIntArgValue("-secret-size", 32);
        boolean generate = isArgSpecified("-generate-keys");
        String payload = getArgValue("-payload");
        String secret = getArgValue("-secret");

        if (payload != null) {
            String signature = Base64.getEncoder().encodeToString(
                new HmacUtils(HmacAlgorithms.HMAC_SHA_384, secret).hmac(payload)
            );
            System.out.println("Signature: " + signature);
        } else if (generate) {
            System.out.println("----------");
            System.out.println("API KEY: " + randomAlphabetic(keySize));
            System.out.println("API SECRET: " + randomAlphabetic(secretSize));
            System.out.println("----------");
            KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
            generator.initialize(RSA_KEYSIZE);
            KeyPair pair = generator.generateKeyPair();
            PrivateKey privateKey = pair.getPrivate();
            PublicKey publicKey = pair.getPublic();
            System.out.println("RSA Private: " + Base64.getEncoder().encodeToString(privateKey.getEncoded()));
            System.out.println("RSA Public: " + Base64.getEncoder().encodeToString(publicKey.getEncoded()));
            System.out.println("----------");
        } else {
            System.out.println("Usage: -generate-keys");
            System.out.println("Usage: -sign <str> -secret <secret>");
        }
    }

    private static String randomAlphabetic(int size) {
        Random random = new Random();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < size; ++i) {
            sb.append(nextChar(random));
        }

        return sb.toString();
    }

    private static char nextChar(Random random) {
        return ALPHABET.charAt(random.nextInt(ALPHABET.length()));
    }

    public static void main(String[] args) throws Throwable {
        new ApiKeysTool(args).run();
    }
}
