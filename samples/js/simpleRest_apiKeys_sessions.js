const https = require('https');
const http = require('http');
const crypto = require('crypto');
const bigintCryptoUtils = require('bigint-crypto-utils');

const fetch = async (url, method = 'GET', body = null, headers = {}) => {
    return new Promise((resolve, reject) => {
        const request = (url.startsWith('https:') ? https : http).request(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers,
            },
        }, (response) => {

            response.on('data', (buffer) => {
                if (response.statusCode >= 200 && response.statusCode < 400) {
                    resolve(buffer.toString('utf-8'));
                } else {
                    reject(new Error(response.statusCode + buffer.toString('utf-8')));
                }
            });
        });

        if (body) {
            request.write(JSON.stringify(body))
        }

        request.on('error', reject);

        request.end();
    });
};
/**
 * Convert base64 string to BigInt
 * @param {string} base64Str
 */
const fromBase64 = (base64Str) => BigInt('0x' + Buffer.from(base64Str, 'base64').toString('hex'));

/**
 * Makes Java specific conversion of BigInt to Buffer
 * @param {BigInt} bigInt
 */
const bigIntToBuffer = (bigInt) => {
    const hex = bigInt.toString(16);
    // For Java BigInts the length of byte[] representation of BigIntegers should be exactly (ceil((number.bitLength() + 1)/8)) so we right-pad the number with 0s
    const str = '0'.repeat(Math.ceil((bigInt.toString(2).length + 1) / 8) * 2 - hex.length) + hex;
    return Buffer.from(str, 'hex');
};

/**
 * Convert BigInt to base64 string
 * @param {BigInt} bigInt
 */
const toBase64 = (bigInt) => bigIntToBuffer(bigInt).toString('base64');

const main = async () => {

    const singInAttemptResponse = await fetch(`http://localhost:8099/session/login/attempt`, 'POST', {
        api_key_id: 'TEST_SESSION_API_KEY',
    });

    const singInAttempt = JSON.parse(singInAttemptResponse);
    const dhModulus = fromBase64(singInAttempt.dh_modulus);
    const dhBase = fromBase64(singInAttempt.dh_base);

    const privateKey = crypto.createPrivateKey({
        key: `-----BEGIN PRIVATE KEY-----\nMIICdgIBADANBgkqhkiG9w0BAQEFAASCAmAwggJcAgEAAoGBAOr9j+QRqD28+V8+7Z3MVR649Nlf3iDzm/8vdPFG9ceZHUhC2M5I8K1jg2bN4tvesvB/Qnb5fwd4LcW9rqhFWXmGitrvtw5OYu5OYRl7qhXGMW91GxCp9xSUCqKNWKI8yWcNBn8ewLpLtYtnIzBq11sGwW2dtP19vebhUN5qRRVDAgMBAAECgYAwP3+bxERW6MYK2FDRZXLUrAUZ3KUu/tW4v3WzVG6CXN22SINbV36TGyuPoBZELqVu27I522BJmFNNlnSV+Cc2d7+Je/LnyH853DNQu3QqlsBLzUEWt0KqCLjKF1BdVxALD0ddGka3RIAsjTJnxDVLVagfqxVOXcg/pxtrFvkMgQJBAPg1+J+dD71EocoNaSd0rsGtMEHSSiT2Dyfi9JJHHCooZ8pEJs6WtCH0Qc0xA4NQ/+EV7Zqg74J9fSrkPXxI0/8CQQDyXWI/H7T9WeqWVxh0/ZUUI2Y1x1SD6Y7LYNprzT/raUBqSPVaIv5W+A8057s80AeIiLJ7OLUJvKggcvqul269AkBiLObUK0mIcVcVFkzbYFmnHZuSzVyqVfEUs75NBXdsbWLwLBi1agKB050bTiG3lRhArW231aQmlwAlMPXo7N19AkBU7nCdWkkcd0QDxyWk6bAyTG1m7yEo0NHfZ2NjX5vErS+Lj2GbYqPqaic6DPLKTsQ1DmItWCPo85mfNWuvfxWpAkEAxX3/9QJQefjsfZvk77tLZZRM8aUI/O2YnT5ex1oufzeXmdVZpZ3f427pnosRAHZwFPvL3g8oh1iK8ynAm11EMA==\n-----END PRIVATE KEY-----`,
        format: 'pem',
        type: 'pkcs8'
    });

    const signer = crypto.createSign('RSA-SHA256');
    signer.write(Buffer.from(singInAttempt.challenge, 'base64'));
    const signature = signer.sign(privateKey, 'base64');
    const buffer = crypto.randomBytes(512);
    const dhNumber = BigInt('0x' + buffer.toString('hex'));
    const dhKey = bigintCryptoUtils.modPow(dhBase, dhNumber, dhModulus);

    const signInResponse = await fetch(`http://localhost:8099/session/login/confirm`, 'POST', {
        session_id: singInAttempt.session_id,
        signature,
        dh_key: toBase64(dhKey),
    });

    const signIn = JSON.parse(signInResponse);

    const signKey = bigintCryptoUtils.modPow(fromBase64(signIn.dh_key), dhNumber, dhModulus);
    const secretKey = crypto.createSecretKey(bigIntToBuffer(signKey));

    const nonce = Date.now();
    const payload = `GET/api/v0/streamsX-Deltix-Nonce=${nonce}&X-Deltix-Session-Id=${singInAttempt.session_id}`;
    const requestSignature = crypto.createHmac('SHA384', secretKey).update(payload).digest('base64');

    const brokersResponse = await fetch(`http://localhost:8099/api/v0/streams`, 'GET', void 0, {
        'X-Deltix-Nonce': nonce,
        'X-Deltix-Session-Id': singInAttempt.session_id,
        'X-Deltix-Signature': requestSignature,
    });

    console.log(brokersResponse);
};

return main();