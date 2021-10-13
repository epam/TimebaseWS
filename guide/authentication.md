# TimeBase Web Administrator Authentication

* [Web Authentication](#web-authentication) 
* [API Keys](#api-keys) 

## Web Authentication 

TimeBase Web Administrator supports two types of authentication: built-in OAuth2 & SSO. **One of those types must be enabled to run the application.**

### Client Web Application Authentication Flow 

![](/img/tb_auth.svg)

1. Authentication service provider identification check is made upon each application start.
2. Browser local storage is checked to have a Refresh Token for the current user.
3. If Refresh Token exists, Silent Token Update is performed to obtain a new Access Token.
4. If Silent Token Update fails for any reason, the user will be logged out and redirected to a Login page.

### OAuth2

To enable built-in authentication, you need to add the following security block to your `application.yaml` configuration file. We recommend using this authentication method for test purposes.

```yaml
security:
  oauth2:
    provider:
    providerType: BUILT_IN_OAUTH
    clientId: web
    tokenEndpoint: /oauth/token
    clientId: web
    secret: <BCrypt_encoded_secret>
    authorizedGrantTypes:
    - password
    - refresh_token
    users: # list of users with its authorities
    - username: <username>
      password: <BCrypt_encoded_password>
      authorities: [TB_ALLOW_READ, TB_ALLOW_WRITE]
    scopes:
    - trust
    accessTokenValiditySeconds: 300 # 5 min
    refreshTokenValiditySeconds: 86400 # one day
    privateKey: |
    -----BEGIN RSA PRIVATE KEY-----
    <RSA private key>
    -----END RSA PRIVATE KEY----- |
    publicKey: |
    <RSA public key>
```

#### ORY Hydra

To enable SSO with [ORY Hydra](https://www.ory.sh/hydra/) add the following blocks to your `application.yaml` configuration file. 

```yaml

spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri:  # Issuer URI

...

security:
  oauth2:
    provider:
      providerType: SSO
      name: hydra
      clientId: <client_id> # Your client ID
      validateIssuer: false
      userInfo:
        enable: true

```

#### Auth0

In this section we describe how to configure TimeBase Web Admin Authentication with [Auth0](https://auth0.com/) authentication service provider.

##### Auth0 Settings 

![](/img/auth0.png)

![](/img/auth0_2.png)

1. In **Applications** create Single Page Application
2. For the application you have just created configure the following settings:
  + Allowed Callback URLs: `<tbwa_base_url>/assets/sign-in.html`, `<tbwa_base_url>/assets/silent-auth.html`
  + Allowed Logout URLs: `<tbwa_base_url>//assets/sign-in.html`
  + Allowed Web Origins: `<tbwa_base_url>`
  + Allowed Origins (CORS): `<tbwa_base_url>`
  + Disable Refresh Token Rotation
  + Disable Absolute Expiration in Refresh Token Expiration
  + Disable Inactivity Expiration in Refresh Token Expiration
3. In **Applications** go to **APIs** and create a new API
  + Set your application Client ID as API_Audience value
4. In **User Management** under **Users** create a new user
5. In **Tenant Settings** under **Advanced Settings** disable **Refresh Token Revocation Deletes Grant**

##### TimeBase Web Admin Settings 

Add the following variables to TimeBase chart in TimeBase Web Admin section: 

```yaml
  SPRING_SECURITY_OAUTH2_RESOURCESERVER_JWT_ISSUER-URI: https://<your_domain>.auth0.com/
  SECURITY_OAUTH2_PROVIDER_VALIDATEISSUER: true
  SECURITY_OAUTH2_PROVIDER_USERINFO_ENABLE: true
  SECURITY_OAUTH2_PROVIDER_CLIENTID: <client_id>
  SECURITY_OAUTH2_PROVIDER_CLIENTSECRET: <secret>
  SECURITY_OAUTH2_PROVIDER_PROVIDERTYPE: SSO
  SECURITY_OAUTH2_PROVIDER_NAME: auth0
  SECURITY_OAUTH2_PROVIDER_AUDIENCE: <api_audience>
  SECURITY_OAUTH2_PROVIDER_CONFIGURL: https://<your_domain>.auth0.com/.well-known/openid-configuration
  SECURITY_OAUTH2_PROVIDER_LOGOUTURL: https://<your_domain>.auth0.com/logout
  SECURITY_OAUTH2_USERS_0_USERNAME: "<username>"
```

## API Keys 

The Api Keys library supports two flows of accessing API with API Keys:

* [Basic flow](#basic-flow) with ApiKey and ApiSecret (more simple, but less secure because the server must store API Secret). [Samples](#client-samples).
* [Sessions-based](#session-based-flow) flow. [Samples](#client-samples-1).

### Basic Flow

Each Api Key is a pair: _ApiKey_ and _ApiSecret_. ApiKey is a name of the pair, and ApiSecret is used to get a query's signature. Signature is used to verify that a query was signed with a valid ApiSecret.

**Api Keys for REST Client**

Provide two headers to send requests with API Keys:

```bash
X-Deltix-ApiKey: ApiKey
X-Deltix-Signature: Base64EncodedString(HmacSHA384(Payload, ApiSecret)) - some payload, signed by ApiSecret with hmac sha384 algorithm

here Payload = uppercase(HttpMethod) + lowercase(UrlPath) + QueryParameters + body
where QueryParameters is separated by '&' lowercase(key)=value pairs, sorted alphabetically by key
```

For example, to send:

```bash
Query = GET http://localhost:8099/api/v0/charting/bbo?startTime=2009-06-19T19:22:00.000Z&endTime=2009-06-19T19:25:00.000Z&symbols=AAPL&levels=1&maxPoints=6000&type=TRADES_BBO
```

First, calculate a signature:

```bash
Query = GET http://localhost:8099/api/v0/charting/bbo?startTime=2009-06-19T19:22:00.000Z&endTime=2009-06-19T19:25:00.000Z&symbols=AAPL&levels=1&maxPoints=6000&type=TRADES_BBO

ApiKey = TEST_API_KEY
ApiSecret = TEST_API_SECRET

Payload = GET/api/v0/charting/bboendtime=2009-06-19T19:25:00.000Z&levels=1&maxpoints=6000&starttime=2009-06-19T19:22:00.000Z&symbols=AAPL&type=TRADES_BBO
Signature = 7amMhPgGq2mXo6twDUyDUlWAYJ9g+PyemZ1yIj6yhCnk4TS5viVi9DCGpaWX+GZz
```

Than, add two headers to the query and make a Send:

```bash
GET http://localhost:8099/api/v0/charting/bbo?startTime=2009-06-19T19:22:00.000Z&endTime=2009-06-19T19:25:00.000Z&symbols=AAPL&levels=1&maxPoints=6000&type=TRADES_BBO
X-Deltix-ApiKey: TEST_API_KEY
X-Deltix-Signature: 7amMhPgGq2mXo6twDUyDUlWAYJ9g+PyemZ1yIj6yhCnk4TS5viVi9DCGpaWX+GZz
```

Example with body:

```bash
Query: POST http://localhost:8099/api/v0/bars1min/goog/select

{
  "from":null,
  "to":null,
  "offset":0,
  "rows":1000,
  "reverse":false,
  "space":null,
  "types": ["deltix.timebase.api.messages.BarMessage"]
}

ApiKey = TEST_API_KEY
ApiSecret = TEST_API_SECRET

Payload = POST/api/v0/bars1min/goog/select{"from":null,"to":null,"offset":0,"rows":1000,"reverse":false,"space":null,"types":["deltix.timebase.api.messages.BarMessage"]}
Signature = DtMdHJ4vc0LYx9H0YB80dICiah10x/i1KFrJ+Ba+RyOw5wc+6WcXdxCHA3GFYrIe
```

**Websockets Api Keys Support**

Provide 3 STOMP headers to connect to WebGateway with websockets:

```bash
X-Deltix-ApiKey: ApiKey
X-Deltix-Payload: Some random string generated every connect by client (for example current timestamp)
X-Deltix-Signature: Base64EncodedString(HmacSHA384(Payload, ApiSecret))

where Payload = "CONNECTX-Deltix-Payload=" + HeaderValue(X-Deltix-Payload) + "&X-Deltix-ApiKey=" + HeaderValue(X-Deltix-ApiKey)
```

Example:

```bash
ApiKey = TEST_API_KEY
ApiSecret = TEST_API_SECRET

Payload random generated = 90dd333e-4858-4fba-a71b-12f958b36689
Signature payload = CONNECTX-Deltix-Payload=90dd333e-4858-4fba-a71b-12f958b36689&X-Deltix-ApiKey=TEST_API_KEY
Signature = nAoVRNtR+g8gKUG6/4hQbBbRy6A9KcqGfBjIx1gZCfwrGkvHBelJIpzosxelRRGF

# Connect a STOMP query:

CONNECT
X-Deltix-ApiKey: TEST_API_KEY
X-Deltix-Payload: 90dd333e-4858-4fba-a71b-12f958b36689
X-Deltix-Signature: nAoVRNtR+g8gKUG6/4hQbBbRy6A9KcqGfBjIx1gZCfwrGkvHBelJIpzosxelRRGF
heart-beat:0,0
accept-version:1.1,1.2
```
#### Client Samples

**Python REST Query Sample**

```python
import requests
import hashlib
import hmac
import base64

apiKey = "TEST_API_KEY"
apiSecret = "TEST_API_SECRET"
payload = "GET/api/v0/streams"
signature = base64.b64encode(hmac.new(apiSecret.encode('utf-8'), payload.encode('utf-8'), hashlib.sha384).digest())

headers = {'X-Deltix-ApiKey' : apiKey, 'X-Deltix-Signature' : signature}
response = requests.get("http://localhost:8099/api/v0/streams", headers=headers)

print(response)
print(response.json())
```

**Node.js REST Query Sample**

```js
const http = require('http');
var crypto = require('crypto');

var hmac = crypto.createHmac('sha384', 'TEST_API_SECRET');    
hmac.write('GET/api/v0/streams'); 
hmac.end();
signature = hmac.read().toString('base64');

var options = {
  headers: {
    'X-Deltix-ApiKey': 'TEST_API_KEY',
	'X-Deltix-Signature': signature
  }
};

request = http.get('http://localhost:8099/api/v0/streams', options, function(res) {
   var body = "";
   res.on('data', function(data) {
      body += data;
   });
   res.on('end', function() {
      console.log(body);
   })
   res.on('error', function(e) {
      onsole.log("Got error: " + e.message);
   });
});
```

**Java REST Query Sample**

* Refer to [Rest](https://gitlab.deltixhub.com/Deltix/Nursery/api-keys/-/blob/master/java/api-keys/src/test/java/deltix/spring/apikeys/SessionRestSample.java) samples. 
* Refer to [WS](https://gitlab.deltixhub.com/Deltix/Nursery/api-keys/-/blob/master/java/api-keys/src/test/java/deltix/spring/apikeys/ApiKeysWsSamples.java) samples.


### Session-Based Flow

When Api Keys library is configured to use sessions, server does not store any private (secret) keys. In this case, client and secret must perform a *login* procedure to create a *session* with a secret key shared only between the client and the server.

**Creating Session**

![image](/img/api-key-session.png)

Session includes two steps:

1. Login attempt;
2. Login confirmation.

**Login Attempt**

In this step the Client sends an attempt POST request to the Web server.

```bash
POST /api/v1/login/attempt

# Request details:

api_key_id [string] - API key identifier that is going to be used for creating the session.

# Response details:

session_id [string] - Unique session identifier generated by the server;
challenge [string] - Random string generated by the server that is used for user validation, encoded as base64;
dh_base [string] - String containing Diffie–Hellman public base, encoded as base64;
dh_modulus [string] - String containing Diffie–Hellman public modulus, encoded as base64;
ttl [string] - Number of milliseconds defining the time when session will be dropped if no confirmation comes.
```

**Login Confirmation**

In this step the Client sends a confirmation POST request to the Web server.

```bash
POST /api/v1/login/confirm

# Request details:

session_id [string] - Unique session identifier generated by the server;
signature [string] - String, containing a base54-encoded signature generated using SHA256withRSA of challenge string provided to the client during login attempt and a private key of the API key, which identifier was sent to the server during login attempt;
dh_key [string] - String containing Diffie–Hellman key of the client, encoded as base64.

# Response details:

dh_key [string] - String containing client's Diffie–Hellman public key, encoded as base64;
keepalive_timeout [string] - Inactivity period after which the session will be terminated by the server in milliseconds.
```

**Using Session**

Each REST and Websocket CONNECT request must be signed using a session secret. Web server will compute the signature on such requests and, if the result is different from the signature provided, the request will be rejected.

Include three headers in the request:

 - `X-Deltix-Nonce` - is a number called `nonce`. Each subsequent request within a single session must have `nonce` value greater than the previous request `nonce` value. If the request contains the same or lower `nonce` value than the previous request, such request will be rejected;
 - `X-Deltix-Session-Id` - session identifier created during the login. This must be equal to the `session_id` returned by the login attempt;
 - `X-Deltix-Signature` - signature `string`.

Where signature is calculated as follows:

```bash
Signature = Base64EncodedString(HmacSHA384(Payload, SessionSecret)) - session secret, obtained during the login procedure;

Payload = uppercase(HttpMethod) + lowercase(UrlPath) + QueryParameters + RequestHeaders + body
where QueryParameters is separated by '&' lowercase(key)=value pairs, sorted alphabetically by key
and RequestHeaders = X-Deltix-Nonce=...&X-Deltix-Session-Id=...
```

**Websockets with Sessions**

Provide 3 STOMP headers to connect to WebGateway with websockets:

```bash
X-Deltix-Session-Id: # Your session id
X-Deltix-Signature: Base64EncodedString(HmacSHA384(Payload, SessionSecret))
X-Deltix-Nonce: # is a number called nonce. Each subsequent request within a single session must have nonce value greater than the previous request nonce value. If the request contains the same or lower nonce value than the previous request, such request will be rejected;

where Payload = "CONNECTX-Deltix-Nonce=" + nonce + "&X-Deltix-Session-Id=" + sessionId
```

Example:

```bash
SessionId = # session-id

Signature payload = CONNECTX-Deltix-Nonce=1000&X-Deltix-Session-Id=session-id
Signature = # SomeCalculatedSignature

# Connect STOMP query:

CONNECT
X-Deltix-Session-Id: session-id
X-Deltix-Signature: SomeCalculatedSignature
X-Deltix-Nonce: 1000
heart-beat:0,0
accept-version:1.1,1.2
```

#### Client Samples 

**Java Sample**

```java
public class Main {

    public static void main(String[] args) throws IOException, URISyntaxException, InterruptedException, NoSuchAlgorithmException, SignatureException, InvalidKeySpecException, InvalidKeyException {
        Gson gson = new Gson();
        Map<String, String> config = gson.fromJson(new FileReader("../config.json"), Map.class);

        HttpClient client = HttpClient.newHttpClient();
        HttpRequest attemptRequest = HttpRequest.newBuilder()
                .uri(URI.create(String.format("https://%s/session/login/attempt", config.get("host"))))
                .POST(HttpRequest.BodyPublishers.ofString(
                        String.format("{\"api_key_id\": \"%s\"}", config.get("api_key_id"))
                ))
                .header("Content-Type", "application/json")
                .build();
        Map<String, String> attemptResponse = gson.fromJson(client.send(attemptRequest, HttpResponse.BodyHandlers.ofString()).body(), Map.class);

        Signature signatureCreator = Signature.getInstance("SHA256withRSA");
        signatureCreator.initSign(KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(
                Base64.getDecoder().decode(config.get("api_key_private"))
        )));
        signatureCreator.update(Base64.getDecoder().decode(attemptResponse.get("challenge")));
        byte[] signature = signatureCreator.sign();
        BigInteger dhBase = new BigInteger(Base64.getDecoder().decode(attemptResponse.get("dh_base")));
        BigInteger dhModulus = new BigInteger(Base64.getDecoder().decode(attemptResponse.get("dh_modulus")));
        BigInteger dhSecretInteger = new BigInteger(512, new SecureRandom());

        System.out.println("Successfully started login attempt");

        Map<String, String> confirmationBody = new HashMap<>();
        confirmationBody.put("dh_key", Base64.getEncoder().encodeToString(dhBase.modPow(dhSecretInteger, dhModulus).toByteArray()));
        confirmationBody.put("signature", Base64.getEncoder().encodeToString(signature));
        confirmationBody.put("session_id", attemptResponse.get("session_id"));
        HttpRequest confirmationRequest = HttpRequest.newBuilder()
                .uri(URI.create(String.format("https://%s/session/login/confirm", config.get("host"))))
                .POST(HttpRequest.BodyPublishers.ofString(gson.toJson(confirmationBody)))
                .header("Content-Type", "application/json")
                .build();

        Map<String, String> confirmationResponse = gson.fromJson(client.send(confirmationRequest, HttpResponse.BodyHandlers.ofString()).body(), Map.class);
        BigInteger sessionSecret = new BigInteger(Base64.getDecoder().decode(confirmationResponse.get("dh_key"))).modPow(dhSecretInteger, dhModulus);

        System.out.println("Successfully confirmed a session login");

        Mac mac = Mac.getInstance("HmacSHA384");
        mac.init(new SecretKeySpec(sessionSecret.toByteArray(), "Raw Bytes"));
        String payload = "GET"+config.get("test_request")+"X-Deltix-Nonce=1&X-Deltix-Session-Id="+attemptResponse.get("session_id");
        String requestSignature = Base64.getEncoder().encodeToString(mac.doFinal(payload.getBytes()));
        HttpRequest testRequest = HttpRequest.newBuilder()
                .uri(URI.create(String.format("https://%s%s", config.get("host"), config.get("test_request"))))
                .header("X-Deltix-Signature", requestSignature)
                .header("X-Deltix-Nonce", "1")
                .header("X-Deltix-Session-Id", attemptResponse.get("session_id"))
                .GET()
                .build();
        System.out.println(client.send(testRequest, HttpResponse.BodyHandlers.ofString()).body());
    }
}
```

**JavaScript Sample**

```js
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
```