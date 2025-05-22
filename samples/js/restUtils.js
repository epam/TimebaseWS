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
			path: '/oauth2/token',
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			}
		}, 
		'grant_type=client_credentials&client_id=' + username + '&client_secret=' + password + '&scope=openid profile'
	);
}

module.exports = {
   makeRequest: makeRequest,
   requestToken: requestToken
}

