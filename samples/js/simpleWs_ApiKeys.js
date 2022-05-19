const http = require('http');
const webSocket = require('ws');
const crypto = require('crypto');

var hmac = crypto.createHmac('sha384', 'TEST_API_SECRET');    
hmac.write('GET/ws/v0/binance/select'); 
hmac.end();
signature = hmac.read().toString('base64');

var options = {
  headers: {
    'X-Deltix-ApiKey': 'TEST_API_KEY',
	'X-Deltix-Signature': signature
  }
};

let ws = new webSocket('ws://localhost:8099/ws/v0/BINANCE/select', options);
ws.onopen = function () {
  console.log('Connected');
};
ws.onmessage = function (message) {
  console.log('Message: %s', message.data);
};