import websocket
import requests
import json

url = "http://localhost:8099"
stream = "BINANCE"

def onMessage(ws, message):
    print("MESSAGE: \n")
    print(message)

def onError(ws, error):
    print(error)

def onClose(ws):
    print("### closed ###")

def onOpen(ws):
    print("### opened ###")

def getToken(url, user, password):
    headers = {'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic d2ViOnNlY3JldA=='}
    data = {
        'grant_type': 'password',
        'username': user,
        'password': password,
        'scope': 'trust',
    }
    response = requests.post(url + "/oauth/token", headers=headers, data=data)
    accessDetails = response.json()
    return accessDetails

#Getting access token
accessData = getToken(url, "admin", "admin")
token = accessData["access_token"]
print("Access token:\n",  token, "\n\n")

websocket.enableTrace(True)
ws = websocket.WebSocketApp('ws://localhost:8099/ws/v0/' + stream + '/select',
                          on_open = onOpen,
                          on_message = onMessage,
                          on_error = onError,
                          on_close = onClose,
                          header={'Authorization': 'bearer ' + token})
ws.run_forever()

