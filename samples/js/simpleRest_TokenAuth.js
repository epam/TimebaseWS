const http = require('http');

const restUtils = require('./restUtils.js');

restUtils.requestToken('localhost', 8099, 'admin', 'admin').then((tokenResp) => {
	token = JSON.parse(tokenResp).access_token;
	console.log(token)
	
	restUtils.makeRequest({
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



