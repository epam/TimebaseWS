import websocket
from websockets.client import connect
import requests
import json
import time
import threading
import asyncio
import multiprocessing
from datetime import datetime

url = "http://localhost:8099"
date_format = "%Y-%m-%dT%H:%M:%S.%fZ"

class WebsocketBuilder:
    def __init__(
        self, keycloak_token: str, websocket_class
    ):
        self.keycloak_token = keycloak_token
        self.websocket_class = websocket_class

    def build(self, proc_id):
        return self.websocket_class(self.keycloak_token, proc_id)

class WebsocketHandler:
    def __init__(self, keycloak_token: str, proc_id):
        self.ws = None
        self.market = None
        self.keycloak_token = keycloak_token
        self.count = 0
        self.proc_id = proc_id
        self.print_time = datetime.utcnow().timestamp()

    async def start_listener(self, market: str):
        self.market = market

        print(f"Initing ws connection for {market}")
        async with connect(
            f"""ws://localhost:8099/ws/v0/query""",
            extra_headers={"Authorization": "bearer " + self.keycloak_token},
        ) as websocket:
            print(f"connected to timebase webadmin for {self.market}")
            r = QueryRequest(
                self.market, True, datetime.utcnow().isoformat() + "Z"
            )
            request = json.dumps(r.__dict__)
            await websocket.send(request)
            print(f"Sent streaming query to timebase for {self.market}")
            async for message in websocket:
                await self.onMessage(message)
        print(f"### closed connection to timebase webadmin for {self.market} ###")

    async def onMessage(self, message):
        #print(message)

        msg_data = json.loads(message)
        if isinstance(msg_data, dict):
            return

        self.count += 1

        msg_date_string = msg_data[0]['timestamp']
        msg_date_object = datetime.strptime(msg_date_string, date_format)
        msg_epoch_millis = int(msg_date_object.timestamp() * 1000)
        epoch_millis = int(datetime.utcnow().timestamp() * 1000)
        lat = epoch_millis - msg_epoch_millis
        if lat > 5000:
            if datetime.utcnow().timestamp() - self.print_time > 1:
                print(str(self.proc_id) + ": " + msg_date_string + " | LATENCY: " + str(lat))
                self.print_time = datetime.utcnow().timestamp()
        if self.count % 500 == 0:
            print(str(self.proc_id) + ": " + "Read: " + str(self.count) + " : " + msg_date_string + "; LAT: " + str(lat))

        return


class PriceStream(multiprocessing.Process):
    def __init__(
        self,
        market: str,
        run_as_daemon=True,
        ws_builder: WebsocketBuilder = None,
        proc_id=0
    ):
        super().__init__()
        self.daemon = run_as_daemon
        self.ws_builder = ws_builder
        self.market = market
        self.proc_id = proc_id

    def run(self):
        self.ws = self.ws_builder.build(self.proc_id)
        asyncio.run(self.ws.start_listener(self.market))

    def stop(self):
        self.terminate()
        self.join()
        LOGGER.info("Multi-processing stopped!")

class QueryRequest:
    def __init__(self, market, live, from_ts):
        self.messageType = "SUBSCRIBE_QUERY"
        self.query = self.get_query_by_market(market)
        self.live = live
        setattr(self, "from", from_ts)
        self.request = json.dumps(self.__dict__)

    def get_query_by_market(self, market):
        time_fields = "timestamp as 'timebaseTimestamp',"
        '''
        return f"""SELECT
            symbol as 'symbol',
            originalTimestamp as 'originalTimestamp',
            receivedTime as 'receivedTimestamp',
            timestamp as 'timebaseTimestamp',
            entries[0].price as bid_price_top,
            entries[0].price as ask_price_top,
            entries[0].size as bid_size_top,
            entries[0].size as ask_size_top,
            entries[-1].price as bid_price_low,
            entries[-1].price as ask_price_low,
            entries[-1].size as bid_size_low,
            entries[-1].size as ask_size_low
            FROM COINBASE_large_play
            where symbol == 'BTC/USDT'
        """
        '''
        return f"""WITH
            orderbook{{maxDepth: 100}}(this.packageType, this.entries[not this is TradeEntry]) AS book,
            book[(this as L2EntryNew).side == BID] as bid_side,
            book[(this as L2EntryNew).side == ASK] as ask_side
            SELECT running
            symbol as 'symbol',
            {time_fields}
            bid_side[0].price as bid_price_top,
            ask_side[0].price as ask_price_top,
            bid_side[0].size as bid_size_top,
            ask_side[0].size as ask_size_top,
            bid_side[-1].price as bid_price_low,
            ask_side[-1].price as ask_price_low,
            bid_side[-1].size as bid_size_low,
            ask_side[-1].size as ask_size_low
            FROM COINBASE_large_play
            where symbol == '{market}'
        """
        #'''

def getToken(url, user, password):
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    data = {
        'grant_type': 'client_credentials',
        'client_id': user,
        'client_secret': password,
        'scope': 'openid profile',
    }
    response = requests.post(url + "/oauth2/token", headers=headers, data=data)
    accessDetails = response.json()
    return accessDetails


def start_streamer():
    #Get access token
    accessData = getToken(url, "admin", "admin")
    token = accessData["access_token"]
    print("Access token:\n",  token, "\n\n")

    ws_builder = WebsocketBuilder(
        keycloak_token=token,
        websocket_class=WebsocketHandler
    )

    market = 'BTC/USDT'
    streamers = []
    for i in range(50):
        price_streamer = PriceStream(
            market=market,
            ws_builder=ws_builder,
            proc_id=i
        )
        price_streamer.start()
        streamers.append(price_streamer)

    for streamer in streamers:
        streamer.join()

if __name__ == "__main__":
    start_streamer()