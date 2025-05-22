import requests
import json

url = "http://localhost:8099"
userName = 'admin'
userPassword = "***"
viewName = 'my_view'
viewQuery = 'select * from deribit'
viewLive = True

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
    
# Get token
accessData = getToken(url, userName, userPassword)
token = accessData["access_token"]

# Create view
headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'bearer ' + token,
}    
createViewBody = {
    'id': viewName,
    'query': viewQuery,
    'live': viewLive
}
response = requests.post(url + "/api/v0/timebase/views", headers=headers, data=json.dumps(createViewBody))
print(response.json())


