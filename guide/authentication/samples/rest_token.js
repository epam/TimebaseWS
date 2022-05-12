const http = require('http');

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

requestToken('localhost', 8099, 'admin', 'admin').then((tokenResp) => {
	token = JSON.parse(tokenResp).access_token;
	console.log(token)
	
	makeRequest({
			hostname: 'localhost',
			port: 8099,
			path: '/api/v0/BINANCE/select',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'bearer ' + token
			}
		}, 	
		JSON.stringify({	
			offset: 0,
			rows: 10,
			from: '2022-02-17T20:24:31.559Z'
		})
	).then((resp) => {
		console.log(resp)
	})
})

