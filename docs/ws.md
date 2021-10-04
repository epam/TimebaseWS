# Timebase WebSocket API

---

## General principles

**STOMP** messaging protocol is used for websocket communication.

All subscriptions are sent to `/ws/v0/{stream}/select` and `/ws/v0/select` channels.

In case of request error, **STOMP** `MESSAGE` will be returned with header `status` containing `4xx` **HTTP** error code.
In case of server error, **STOMP** `MESSAGE` will be returned with header `status` containing `5xx` **HTTP** error code.

Web sockets requests supports "live" mode, which allows to retrieve message updates having opened connection.

<br />

## Resources

---

|name                                                  |path                                       |method     |
|------------------------------------------------------|-------------------------------------------|-----------|
|[WSController]                                        |[/ws/v0/{streamId}/select](#-ws-v0-streamId-select)  |`SUBSCRIBE`|
|[WSController]                                        |[/ws/v0/select](#-ws-v0-select)                    |`SUBSCRIBE`|


### /ws/v0/{streamId}/select

Returns messages ordered by time from the specified stream according to the specified options.

<br />

#### Request Parameters

|name               |type  |description        |constraints|example|
|-------------------|------|-------------------|-----------|-------|
|from               |header|Query start time (if not specified, will be used stream start time)   |optional|2018-06-28T09:30:00.000Z|
|to                 |header|Query end time (if not specified, will be used stream start time)     |optional|2018-07-10T00:00:00.000Z|
|types              |header|Specified message types to be subscribed. If undefined, then all stream types will be subscribed.|optional|deltix.timebase.api.messages.universal.PackageHeader|
|symbols            |header|Specified instruments (symbols) to be subscribed. If undefined, then all stream instruments will be subscribed.  |optional| BTCEUR,ETHEUR |
|live               |header|Ability to receive live updates   |optional|true or false|

#### Response Body

|media type      |data type            |description                            |
|----------------|---------------------|---------------------------------------|
|application/json|array of data rows   |List of rows.|

#### Example

Request:
```
SEND
destination:/ws/v0/GDAX/select
from:2018-06-28T02:54:14.670Z
symbols:BTCEUR,ETHEUR


```

Response:
```
MESSAGE
status:200
destination:/user/v1/responses
content-type:application/json;charset=UTF-8
content-length:4916

[{
  "symbol":"BTCEUR",
  "timestamp":"2018-06-28T02:54:14.670",
  "entries":
    [{
      "type":"L2EntryUpdate",
      "price":81.17,
      "size":40,
      "action":"UPDATE",
      "level":18,
      "side":"ASK"
    }],
  "packageType":"INCREMENTAL_UPDATE"
}]
```

<br />

### /ws/v0/select

Returns messages  ordered by time from the specified streams according to the specified options.
This endpoint is intended for streaming multiple streams at once, merged by time.

<br />

#### Request Parameters

|name               |type  |description        |constraints| example |
|-------------------|------|-------------------|-----------|---------|
|streams            |header|Specified list of streams to be subscribed.   |required   | GDAX,BITFINEX |
|from               |header|Query start time.   |optional|2018-06-28T09:30:00.000Z|
|to                 |header|Query end time.     |optional|2018-07-10T00:00:00.000Z|
|types              |header|Specified message types to be subscribed. If undefined, then all stream types will be subscribed.|optional |deltix.timebase.api.messages.universal.PackageHeader|
|symbols            |header|Specified instruments (symbols) to be subscribed. If undefined, then all stream instruments will be subscribed.  |optional| BTCEUR,ETHEUR |
|live               |header|Ability to receive live updates   |optional|true or false|

#### Response Body

|media type      |data type            |description                            |
|----------------|---------------------|---------------------------------------|
|application/json| Array of data rows   |List of rows.|

#### Example

Request:
```
SEND
destination:/ws/v0/select
streams:GDAX,BITFINEX
from:2018-06-28T02:54:14.670Z
symbols:BTCEUR,ETHEUR


```

Response:
```
MESSAGE
status:200
destination:/ws/v0/select
content-type:application/json;charset=UTF-8
content-length:4916

[{
  "symbol":"BTCEUR",
  "timestamp":"2018-06-28T02:54:14.670Z",
  "entries":
    [{
      "type":"L2EntryUpdate",
      "price":81.17,
      "size":40,
      "action":"UPDATE",
      "level":18,
      "side":"ASK"
    }],
  "packageType":"INCREMENTAL_UPDATE"
}]
```


#### Additional Subscription Examples
- Select one day of data <br/>
/ws/v0/GDAX/select?from=2018-06-28T00:00:00.000Z&to=2018-06-28T23:59:59.999Z

- Subcribe to live updates <br/>
/ws/v0/GDAX/select?from=2018-07-11T00:00:00.000Z&live=true

- Subcribe to several streams <br/>
/ws/v0/select?streams=GDAX,BITFINEX&from=2018-07-11T00:00:00.000Z

- Subcribe to several streams with specific message type<br/>
/ws/v0/select?streams=GDAX,BITFINEX&from=2018-07-11T00:00:00.000Z&types=deltix.timebase.api.messages.universal.PackageHeader
