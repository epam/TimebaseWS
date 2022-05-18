const webSocket = require('ws');
const restUtils = require('./restUtils.js');

restUtils.requestToken('localhost', 8099, 'admin', 'admin').then((response) => {
	token = JSON.parse(response).access_token;
	console.log(token);
	var options = {
	  headers: {
		'Authorization': 'bearer ' + token
	  }
	};

	let ws = new webSocket('ws://localhost:8099/ws/v0/BINANCE/select', options);
	ws.onopen = function () {
	  console.log('Connected');
	};
	ws.onmessage = function (message) {
	  console.log('Message: %s', message.data);
	};
}).catch((error) => {
	console.log(error);
});