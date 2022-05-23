# API Keys 

The Api Keys library supports two flows of accessing API with API Keys:

* [Basic flow](#basic-flow) with ApiKey and ApiSecret (more simple, but less secure because the server must store API Secret). [Samples](#client-samples).
* [Sessions-based](#session-based-flow) flow. [Samples](#client-samples-1).


## Basic Flow

Each Api Key is a pair: _ApiKey_ and _ApiSecret_. ApiKey is a name of the pair, and ApiSecret is used to get a query's signature. Signature is used to verify that a query was signed with a valid ApiSecret.

### Api Keys for REST Client

Provide two headers to send requests with API Keys:

```
X-Deltix-ApiKey: # ApiKey
X-Deltix-Signature: # signature
```
where 

* `X-Deltix-ApiKey`: your ApiKey
* `X-Deltix-Signature`: a payload, signed by ApiSecret with **hmac sha384** algorithm
  + Base64EncodedString(HmacSHA384(Payload, ApiSecret)), where
    * `Payload` = uppercase(HttpMethod) + lowercase(UrlPath) + QueryParameters + body, where
      + `QueryParameters` is separated by `&` `lowercase(key)=value` pairs, sorted alphabetically by keys

**Example**

To send query: 

`GET http://localhost:8099/api/v0/charting/bbo?startTime=2009-06-19T19:22:00.000Z&endTime=2009-06-19T19:25:00.000Z&symbols=AAPL&levels=1&maxPoints=6000&type=TRADES_BBO`

1. Calculate a signature:

* `ApiSecret` = your ApiSecret
* `Payload` = `GET/api/v0/charting/bboendtime=2009-06-19T19:25:00.000Z&levels=1&maxpoints=6000&starttime=2009-06-19T19:22:00.000Z&symbols=AAPL&type=TRADES_BBO`
* Use Base64EncodedString(HmacSHA384(Payload, ApiSecret)) to calculate a `Signature = 7amMhPgGq2mXo6twDUyDUlWAYJ9g+PyemZ1yIj6yhCnk4TS5viVi9DCGpaWX+GZz`.

2. Add two headers to the query and make a Send:

```bash
GET http://localhost:8099/api/v0/charting/bbo?startTime=2009-06-19T19:22:00.000Z&endTime=2009-06-19T19:25:00.000Z&symbols=AAPL&levels=1&maxPoints=6000&type=TRADES_BBO
X-Deltix-ApiKey: your ApiKey
X-Deltix-Signature: 7amMhPgGq2mXo6twDUyDUlWAYJ9g+PyemZ1yIj6yhCnk4TS5viVi9DCGpaWX+GZz
```

**Example with Body**

```json
POST http://localhost:8099/api/v0/bars1min/goog/select

{
  "from":null,
  "to":null,
  "offset":0,
  "rows":1000,
  "reverse":false,
  "space":null,
  "types": ["deltix.timebase.api.messages.BarMessage"]
}
```
Use: 

* `ApiSecret` = your ApiSecret
* `Payload` = POST/api/v0/bars1min/goog/select{"from":null,"to":null,"offset":0,"rows":1000,"reverse":false,"space":null,"types":["deltix.timebase.api.messages.BarMessage"]}

To calculate a Signature via Base64EncodedString(HmacSHA384(Payload, ApiSecret)): 

* `Signature = DtMdHJ4vc0LYx9H0YB80dICiah10x/i1KFrJ+Ba+RyOw5wc+6WcXdxCHA3GFYrIe`

Pass two headers with POST request: 

```bash
POST http://localhost:8099/api/v0/bars1min/goog/select{"from":null,"to":null,"offset":0,"rows":1000,"reverse":false,"space":null,"types":["deltix.timebase.api.messages.BarMessage"]}
X-Deltix-ApiKey: your ApiKey
X-Deltix-Signature: DtMdHJ4vc0LYx9H0YB80dICiah10x/i1KFrJ+Ba+RyOw5wc+6WcXdxCHA3GFYrIe
```

### WebSockets Api Keys Support

Provide 3 STOMP headers to connect to WebGateway with websockets:

```bash
X-Deltix-ApiKey
X-Deltix-Payload
X-Deltix-Signature
``` 
where 

* `ApiKey`: your ApiKey
* `Payload`: random string
* `Signature`: signature value calculated using Base64EncodedString(HmacSHA384(Signature payload, ApiSecret))
  + `Signature payload`: CONNECTX-Deltix-Payload= + HeaderValue(X-Deltix-Payload) + "&X-Deltix-ApiKey=" + HeaderValue(X-Deltix-ApiKey)
  + `ApiSecret`: your ApiSecret

**Example**

Take:

* `ApiKey` = your ApiKey
* `ApiSecret` = your ApiSecret
* `Payload` (random string) = 90dd333e-4858-4fba-a71b-12f958b36689
* `Signature payload` = CONNECTX-Deltix-Payload= 90dd333e-4858-4fba-a71b-12f958b36689&X-Deltix-ApiKey=yourApiKey
* `Signature` = nAoVRNtR+g8gKUG6/4hQbBbRy6A9KcqGfBjIx1gZCfwrGkvHBelJIpzosxelRRGF

Connect a STOMP query:

```bash
CONNECT
X-Deltix-ApiKey: your ApiKey
X-Deltix-Payload: 90dd333e-4858-4fba-a71b-12f958b36689
X-Deltix-Signature: nAoVRNtR+g8gKUG6/4hQbBbRy6A9KcqGfBjIx1gZCfwrGkvHBelJIpzosxelRRGF
heart-beat:0,0
accept-version:1.1,1.2
```

### Client Samples

* [Python REST Query Sample](https://github.com/epam/TimebaseWS/blob/main-1.0/samples/python/simple_rest_client_apiKeys.py)
* [JS REST Query Sample](https://github.com/epam/TimebaseWS/blob/main-1.0/samples/js/simpleRest_apiKeys.js)
* [JS WS (stomp) Sample](https://github.com/epam/TimebaseWS/blob/main-1.0/samples/js/simpleStomp_apiKeys.js)
* [JS WS (non-stomp) Sample](https://github.com/epam/TimebaseWS/blob/main-1.0/samples/js/simpleWs_ApiKeys.js)
* [Java REST Sample](https://github.com/epam/TimebaseWS/blob/main-1.0/java/ws-server/src/main/java/com/epam/deltix/tbwg/webapp/utils/SessionRestSample.java) 
* [Java WS (stomp) Sample](https://github.com/epam/TimebaseWS/blob/main-1.0/java/ws-server/src/main/java/com/epam/deltix/tbwg/webapp/utils/ApiKeysWsSamples.java)

**API Keys Configuration to Run These Code Examples**

```yaml
security:
  authorization:
    source: CONFIG # valid values: FILE, CONFIG
  api-keys:
    sessions:
      enabled: false
  api-keys-provider:
    api-keys:
      - name: TEST_API_KEY
        key: TEST_API_SECRET
        user: admin
        authorities: [TB_ALLOW_READ, TB_ALLOW_WRITE]
```

Refer to [Configuration](#configuration) to learn more. 

## Session-Based Flow

When Api Keys library is configured to use sessions, server does not store any private (secret) keys. In this case, client and secret must perform a *login* procedure to create a *session* with a secret key shared only between the client and the server.

![image](/img/api-key-session.png)

Session includes two steps:

1. [Login attempt;](#login-attempt)
2. [Login confirmation](#login-confirmation)

### Login Attempt

In this step the Client sends an attempt POST request to the Web server.

```
POST /api/v1/login/attempt
```

**Request details:**

* `api_key_id` [string] - API key identifier that is going to be used for creating the session.

**Response details:**

* `session_id` [string] - Unique session identifier generated by the server;
* `challenge` [string] - Random string generated by the server that is used for user validation, encoded as base64;
* `dh_base` [string] - String containing Diffie–Hellman public base, encoded as base64;
* `dh_modulus` [string] - String containing Diffie–Hellman public modulus, encoded as base64;
* `ttl` [string] - Number of milliseconds defining the time when session will be dropped if no confirmation comes.

### Login Confirmation

In this step the Client sends a confirmation POST request to the Web server.

```
POST /api/v1/login/confirm
```

**Request details:**

* `session_id` [string] - Unique session identifier generated by the server;
* `signature` [string] - String, containing a base54-encoded signature generated using SHA256withRSA of challenge string provided to the client during login attempt and a private `key` of the API key, which identifier was sent to the server during login attempt;
* `dh_key` [string] - String containing Diffie–Hellman key of the client, encoded as base64.

**Response details:**

* `dh_key` [string] - String containing client's Diffie–Hellman public key, encoded as base64;
* `keepalive_timeout` [string] - Inactivity period after which the session will be terminated by the server in milliseconds.

>  Upon the successful completion of this step, both the Client and the Server have enough data to generate **Session Secret** using Diffie–Hellman method. Session Secret is used for signing requests - see the following section.

### Using Session

Each REST and Websocket CONNECT request must be signed using a session secret. Web server will compute the signature on such requests and, if the result is different from the signature provided, the request will be rejected.

Include three headers in the request:

 - `X-Deltix-Nonce` - is a number called `nonce`. Each subsequent request within a single session must have `nonce` value greater than the previous request `nonce` value. If the request contains the same or lower `nonce` value than the previous request, such request will be rejected;
 - `X-Deltix-Session-Id` - session identifier created during the login. This must be equal to the `session_id` returned by the login attempt;
 - `X-Deltix-Signature` - signature `string`.

Where `Signature` is calculated as follows Base64EncodedString(HmacSHA384(Payload, SessionSecret)), where
  + `Payload` = uppercase(HttpMethod) + lowercase(UrlPath) + QueryParameters + RequestHeaders + body
    * where `QueryParameters` is separated by '&' lowercase(key)=value pairs, sorted alphabetically by key
    * and `RequestHeaders` = X-Deltix-Nonce=...&X-Deltix-Session-Id=...
  + `SessionSecret` generated after the login procedure.

### WebSockets with Sessions

Provide 3 STOMP headers to connect to WebGateway with websockets:

```bash
X-Deltix-Session-Id
X-Deltix-Signature
X-Deltix-Nonce
```
where

* `X-Deltix-Session-Id`: Your session id
* `X-Deltix-Signature`: Base64EncodedString(HmacSHA384(Payload, SessionSecret))
  + `Payload`: "CONNECTX-Deltix-Nonce=" + nonce + "&X-Deltix-Session-Id=" + sessionId
  + `SessionSecret`: generated after the login procedure
* `X-Deltix-Nonce`:a number called `nonce`. Each subsequent request within a single session must have `nonce` value greater than the previous request `nonce` value. If the request contains the same or lower `nonce` value than the previous request, such request will be rejected;

**Example**

```bash
CONNECT
X-Deltix-Session-Id: Your session id
X-Deltix-Signature: Signature
X-Deltix-Nonce: 1000
heart-beat:0,0
accept-version:1.1,1.2
```

### Client Samples 

* [Java REST Sample](https://github.com/epam/TimebaseWS/blob/main-1.0/java/ws-server/src/main/java/com/epam/deltix/tbwg/webapp/utils/SessionRestSample.java)
* [JS REST Sample](https://github.com/epam/TimebaseWS/blob/main-1.0/samples/js/simpleRest_apiKeys_sessions.js)

**API Keys Configuration to Run These Code Examples**

```yaml
security:
  authorization:
    source: CONFIG # valid values: FILE, CONFIG
  api-keys:
    sessions:
      enabled: true
  api-keys-provider:
    api-keys:
      - name: TEST_SESSION_API_KEY
        key: "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDq/Y/kEag9vPlfPu2dzFUeuPTZX94g85v/L3TxRvXHmR1IQtjOSPCtY4NmzeLb3rLwf0J2+X8HeC3Fva6oRVl5hora77cOTmLuTmEZe6oVxjFvdRsQqfcUlAqijViiPMlnDQZ/HsC6S7WLZyMwatdbBsFtnbT9fb3m4VDeakUVQwIDAQAB"
        user: admin
        authorities: [TB_ALLOW_READ, TB_ALLOW_WRITE]
```

Refer to [Configuration](#configuration) to learn more. 

## Configuration 

### Configuration of API Keys

You can configure Basic and Session-based flows in TimeBase Web Admin `application.yaml`. 

To switch between Basic (default) and Session-based flows use flag:

```yaml
security:
  api-keys:
    sessions:
      enabled: false # disabled by default
```

### Configuration to Run Code Examples 

```yaml
# configuration to run code examples from this manual

# basic flow
security:
  authorization:
    source: CONFIG # valid values: FILE, CONFIG
  api-keys:
    sessions:
      enabled: false
  api-keys-provider:
    api-keys:
      - name: TEST_API_KEY
        key: TEST_API_SECRET
        user: admin
        authorities: [TB_ALLOW_READ, TB_ALLOW_WRITE]
      - name: TEST_SESSION_API_KEY
        key: "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDq/Y/kEag9vPlfPu2dzFUeuPTZX94g85v/L3TxRvXHmR1IQtjOSPCtY4NmzeLb3rLwf0J2+X8HeC3Fva6oRVl5hora77cOTmLuTmEZe6oVxjFvdRsQqfcUlAqijViiPMlnDQZ/HsC6S7WLZyMwatdbBsFtnbT9fb3m4VDeakUVQwIDAQAB"
        user: admin
        authorities: [TB_ALLOW_READ, TB_ALLOW_WRITE]

# session-based flow
security:
  authorization:
    source: CONFIG # valid values: FILE, CONFIG
  api-keys:
    sessions:
      enabled: true
  api-keys-provider:
    api-keys:
      - name: TEST_API_KEY
        key: TEST_API_SECRET
        user: admin
        authorities: [TB_ALLOW_READ, TB_ALLOW_WRITE]
      - name: TEST_SESSION_API_KEY
        key: "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDq/Y/kEag9vPlfPu2dzFUeuPTZX94g85v/L3TxRvXHmR1IQtjOSPCtY4NmzeLb3rLwf0J2+X8HeC3Fva6oRVl5hora77cOTmLuTmEZe6oVxjFvdRsQqfcUlAqijViiPMlnDQZ/HsC6S7WLZyMwatdbBsFtnbT9fb3m4VDeakUVQwIDAQAB"
        user: admin
        authorities: [TB_ALLOW_READ, TB_ALLOW_WRITE]
```

### Session-Based Flow Configuration

```yaml
security:
  api-keys:
    sessions:
      login-root: api/v0
      challengeSize: 2048
      dhSecretSize: 512
      keepAliveMs: 100000
      keepAliveLoginMs: 10000
      keepAliveTimerMs: 1000
      dhBase: 2
      dhModulus: ffffffffffffffffc90fdaa22168c234c4c6628b80dc1cd129024e088a67cc74020bbea63b139b22514a08798e3404ddef9519b3cd3a431b302b0a6df25f14374fe1356d6d51c245e485b576625e7ec6f44c42e9a637ed6b0bff5cb6f406b7edee386bfb5a899fa5ae9f24117c4b1fe649286651ece45b3dc2007cb8a163bf0598da48361c55d39a69163fa8fd24cf5f83655d23dca3ad961c62f356208552bb9ed529077096966d670c354e4abc9804f1746c08ca18217c32905e462e36ce3be39e772c180e86039b2783a2ec07a28fb5c55df06f4c52c9de2bcbf6955817183995497cea956ae515d2261898fa051015728e5a8aacaa68ffffffffffffffff
```

### Configuration of API Keys Provider 

There are two options to store API keys: in `application.yaml` config and in JSON file. 

Example when API keys are stored in `application.yaml` config:

```yaml
security:
  authorization:
    source: CONFIG # valid values: FILE, CONFIG
  api-keys-provider:
    api-keys: # list of api keys and their users
      - name: api key name
        key: api key
        user: api key user
        authorities: [TB_ALLOW_READ, TB_ALLOW_WRITE] # Specify authorities for api key, otherwise authorities will get from user - see Authorization section.
      - name: api key name
        key: api key
        user: api key user
```

You can also use a JSON file to configure API keys:

```yaml
security:
  authorization:
    source: FILE # valid values: FILE, CONFIG
    file-source:
      path: /path/to/tbwg.users.json
```

`tbwg.users.json` example:

```json
{
  "apiKeys" : [ {
    "name" : "api key name",
    "key" : "api key",
    "user" : "api key user"
  } ]
}
```
