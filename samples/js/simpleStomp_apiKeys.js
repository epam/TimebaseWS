'use strict';

const webSocket = require('ws');
var crypto = require('crypto');

var apiKey = 'TEST_API_KEY'
var payload = '90dd333e-4858-4fba-a71b-12f958b36689'

var hmac = crypto.createHmac('sha384', 'TEST_API_SECRET');    
hmac.write('CONNECTX-Deltix-Payload=' + payload + '&X-Deltix-ApiKey=' + apiKey); 
hmac.end();
var signature = hmac.read().toString('base64');

console.log('Signature: ' + signature)

var options = {
  headers: {
	'X-Deltix-ApiKey': apiKey,
    'X-Deltix-Payload': payload,
	'X-Deltix-Signature': signature
  }
};

let ws = new webSocket('ws://localhost:8099/stomp/v0');
ws.onopen = function () {
  console.log('Connected');
  ws.send('CONNECT\nX-Deltix-ApiKey:' + apiKey + '\nX-Deltix-Payload:' + payload + '\nX-Deltix-Signature:' + signature + '\naccept-version:1.0,1.1\nheart-beat:10000,10000\n\n\0');
  ws.send('SUBSCRIBE\nack:auto\nid:sub-2\ndestination:/user/topic/monitor/bitmart\n\n\0');
};
ws.onmessage = function (message) {
  console.log('Message: %s', message.data);
};
ws.onerror = function (message) {
  console.log('ERROR: %s', message);
};