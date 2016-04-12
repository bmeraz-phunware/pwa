


buildAuthHeader = function(params){
	
	var date = Math.round(Date.now() / 1000);
	var httpMethod = 'GET';
	var accessKey = '6f7b04a2afa589c7a913a8c47000c86daa0e368c';
	var signatureKey = 'b3675eeff9a879a145bcc5a011c64381c488811e';
	
	// Format the signature string.
	var signatureString = httpMethod +'&';
	signatureString += accessKey +'&';
	signatureString += date +'&';
	signatureString += params;
		
	var signatureHash = CryptoJS.HmacSHA256(signatureString,signatureKey).toString(CryptoJS.enc.Hex);;
	
	var xAuth = accessKey + ':' + date.toString() + ':' + signatureHash;
	
	console.log('[CME] AUTH HEADER: ' + xAuth);
	
	return xAuth;
}




fetchCMEData = function(){
	console.log('[CME] Entering fetchCMEData now...');
	
	var finalOffset = 0;
	var params = '{"containerId":"53adae0f050c25ea18000043", "structureId":6803, "offset":"'+finalOffset+'", "limit":5}';
	var url = 'http://cms-api.phunware.com/v1.0/content?'+params
	
	var XAuth = buildAuthHeader(params);
	
	var request = new XMLHttpRequest();
	request.open('GET', url, true);

	request.onreadystatechange = function(){
		
	    if (request.readyState == 4 && request.status==200){
	    	
	    	if(request.responseText != ''){
	    		app.hasRequestPending = false;
	    		response = JSON.parse(request.responseText);
	            console.log('[CME] Response from Network request: ' + JSON.stringify(response.data));
	    		
	            var newObjectData = {};
	            
	    		for(var i=0; i<response.data.length; i++){
	          	  var obj = response.data[i];
	          	  
	          	  for(var key in obj){
	          		  var image = obj['imageUrl'];
	          		  var username = obj['username'];
	          		  var date = obj['updatedAt'];
	                  var id = obj['id'];
	          	  }
	          	var newObjectData = {'image':image, 'username':username, 'date':date, 'id':id, 'fromCache':false}
	            console.log('[CME] Return' + newObjectData);
	            }
	    	}
	    }else{
	    	console.log('[CME] This is the response if both request.readyState == 4 && request.status==200 arent met: ' + JSON.stringify(request));
	    }
	}
	request.setRequestHeader("X-Auth", XAuth);
	request.send();
	
}
