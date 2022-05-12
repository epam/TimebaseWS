const http = require('http');

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

module.exports = {
   makeRequest: makeRequest,
   requestToken: requestToken
}

