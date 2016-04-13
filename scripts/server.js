/*
 * Brian Meraz
 * Phunware Inc. 2016
 */

(function(){
	
	var http = require("http");
	var https = require("https");
	var url = require("url");
	var fs = require("fs");
	
	var options = {
		key: fs.readFileSync('key.pem');
		cert: fs.readFileSync('key.cert');
	}
	
	
	https.createServer(options, function(req, response) {
		
		console.log('[Server] Entering node server now...');
		var timestamp = Math.round(Date.now() / 1000);
		 
		var request = require('request');
		var crypto = require('crypto');
		 
		var httpMethod = 'GET';
		var accessKey = '6f7b04a2afa589c7a913a8c47000c86daa0e368c';
		var signatureKey = 'b3675eeff9a879a145bcc5a011c64381c488811e';
		
		//pick off offset parameter from incoming url to attain offset value
		var parsedUrl = url.parse(req.url, true);
		var queryUrl = parsedUrl.query;
		var offset = queryUrl.offset;
		
		if(offset){
			var finalOffset = offset;
		}else{
			var finalOffset = 0;
		}
		
		console.log('[Server] Incoming offset: ' + finalOffset);
		var params = '{"containerId":"53adae0f050c25ea18000043", "structureId":6803, "offset":"'+finalOffset+'", "limit":5}';
		 
		// Format the signature string.
		var signatureString = httpMethod +'&';
		signatureString += accessKey +'&';
		signatureString += timestamp +'&';
		signatureString += params;
		 
		var signatureHash = crypto.createHmac('sha256',signatureKey).update(signatureString).digest('hex');	 
		
		var xAuthHeader = accessKey + ':' + timestamp + ':' + signatureHash;
		 	   		 
		var requestOptions = {
		    uri: 'http://cms-api.phunware.com/v1.0/content?'+params,
		    method: httpMethod,
		    headers: {
		        'X-Auth': xAuthHeader,
		        'Content-Type' : 'application/json'
		    },
		    body: params };
		 
		request(requestOptions, function(err, res, data) {
		    console.log('[Server] Final data returned: ' + data);
		    response.writeHead(200, { 'Content-Length':data.length,
                					  'Access-Control-Allow-Origin' : '*'
                					}
		    );
		    response.end(data);
		});
	  
	}).listen(8080);
	
	
})();