import requests
import json

url = "http://localhost:8099"
userName = 'admin'
userPassword = "***"
viewName = 'my_view'
viewQuery = 'select * from deribit'
viewLive = True

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


