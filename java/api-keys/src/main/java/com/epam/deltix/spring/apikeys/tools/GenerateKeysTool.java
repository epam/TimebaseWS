/*
 * Copyright 2021 EPAM Systems, Inc
 *
 * See the NOTICE file distributed with this work for additional information
 * regarding copyright ownership. Licensed under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
package com.epam.deltix.spring.apikeys.tools;

import java.security.*;
import java.util.Base64;
import java.util.Random;

public class GenerateKeysTool {

    private static final String ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    private static final int KEY_SIZE = 12;
    private static final int SECRET_KEY_SIZE = 32;
    private static final int RSA_KEYSIZE = 1024;

    public static void main(String[] args) throws NoSuchAlgorithmException {
        System.out.println("----------");
        System.out.println("API KEY: " + randomAlphabetic(KEY_SIZE));
        System.out.println("API SECRET: " + randomAlphabetic(SECRET_KEY_SIZE));

        System.out.println("----------");
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(RSA_KEYSIZE);
        KeyPair pair = generator.generateKeyPair();
        PrivateKey privateKey = pair.getPrivate();
        PublicKey publicKey = pair.getPublic();
        System.out.println("RSA Private: " + Base64.getEncoder().encodeToString(privateKey.getEncoded()));
        System.out.println("RSA Public: " + Base64.getEncoder().encodeToString(publicKey.getEncoded()));
        System.out.println("----------");
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

}
