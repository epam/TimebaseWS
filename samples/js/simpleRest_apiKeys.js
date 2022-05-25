const http = require('http');
var crypto = require('crypto');

var hmac = crypto.createHmac('sha384', 'TEST_API_SECRET');    
hmac.write('GET/api/v0/streams'); 
hmac.end();
signature = hmac.read().toString('base64');

var options = {
  headers: {
    'X-Deltix-ApiKey': 'TEST_API_KEY',
	'X-Deltix-Signature': signature
  }
};

request = http.get('http://localhost:8099/api/v0/streams', options, function(res) {
   var body = "";
   res.on('data', function(data) {
      body += data;
   });
   res.on('end', function() {
      console.log(body);
   })
   res.on('error', function(e) {
      onsole.log("Got error: " + e.message);
   });
});