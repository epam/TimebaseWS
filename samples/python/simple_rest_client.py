import requests
import json

url = "http://localhost:8099"
stream = "BINANCE"

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
    
def makeSelectRequest(url, token, stream, body):   
    header = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'bearer ' + token,
    }    
    response = requests.post(url + "/api/v0/" + stream + "/select", headers=header, data=json.dumps(body))
    return response.json()
    
# Example of getting token    
accessData = getToken(url, "admin", "admin")
token = accessData["access_token"]
print("Access token:\n",  token, "\n\n")

# Example of select request
requestBody = {
    'offset': 0,
    'rows': 10,
    'from': '2022-02-17T20:24:31.559Z'
}
response = makeSelectRequest(url, token, stream, requestBody)
print(response, "\n\n")


