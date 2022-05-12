const http = require('http');
const webSocket = require('ws');

// commentarii
function makeRequest(options, requestBody) {
	return new Promise((resolve, reject) => {
		const request = http.request(options, function(res) {
			var body = "";
			res.on('data', function(data) {
				 body += data;
			});
			res.on('error', function(e) {
				reject(e);
			});
			res.on('end', function() {
				resolve(body);
			})
		});
		request.write(new TextEncoder().encode(requestBody))
		request.end()
	});
}

function requestToken(url, port, username, password) {
	return makeRequest({
			hostname: url,
			port: port,
			path: '/oauth/token',
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Authorization': 'Basic d2ViOnNlY3JldA=='
			}
		}, 
		'grant_type=password&username=' + username + '&password=' + password + '&scope=trust'
	);
}

requestToken('localhost', 8099, 'admin', 'admin').then((response) => {
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
