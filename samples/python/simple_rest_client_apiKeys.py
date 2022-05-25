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