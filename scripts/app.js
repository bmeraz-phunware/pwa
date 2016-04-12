/*
 * Brian Meraz 
 * Phunware Inc. 2016
 */

(function() {
  console.log('[App] app.js file initiated');
  
  //Set up app key/value defaults
  var app = {
    initialLoad: true,
    isLoading: true,
    hasRequestPending: false,
    spinner: document.querySelector('.loader'),
    cardTemplate: document.querySelector('.cardTemplate'),
    container: document.querySelector('.main'),
    childrenNodes: document.querySelector('.main').children,
    childNodeList: []
  };


  /*****************************************************************************
   *
   * Event listeners for UI
   *
   ****************************************************************************/

  document.getElementById('butRefresh').addEventListener('click', function() {
	console.log('[App] Event listener for data refresh activated');
	
    // Refresh all of the data currently already loaded on page
    app.getData();
    
  });

  
 /*
  * Event listener type Scroll. We calculate when the last card enters the viewport. Once it does,
  * we use API to fetch data from CME to load the next batch of data objects (pagination)
  */
 document.querySelector('.main').addEventListener('scroll', function(){	 	 
	 var lastCardIDFromList = app.childNodeList[app.childNodeList.length - 1];
	 var lastCard = document.getElementById(lastCardIDFromList);
	 var lastCardID = lastCard.getAttribute('id');
	 var nodeHeight = getComputedStyle(lastCard).height.split('px')[0];
	 var docViewTop = document.querySelector('.main').scrollTop;
	 var docViewBottom = docViewTop + window.innerHeight;
	 var elementPositionCal = lastCard.getBoundingClientRect();
	 var lastElementPosition = elementPositionCal.top + window.scrollY;

	 console.log('[App] docViewTop: ' + docViewTop + ' docViewBottom: ' + docViewBottom + ' lastElementPosition: ' + lastElementPosition);
	 
	 if( (docViewTop + lastElementPosition) <= docViewBottom ){
		 var offset = app.childNodeList.length;
		 console.log('[App] Offset for next data object batch is: ' + offset);
		 console.log('[App] Last child node is in view, making call for next batch of data objects now...');
		 app.getData(offset);
	 }
 });

  /*****************************************************************************
   *
   * Methods to update the UI
   *
   ****************************************************************************/

  /* 
   * Updates a data card with the latest data from API. If the card doesn't already exist,
   * it's cloned from the template living on index.html.
   */ 
  app.updateDataCard = function(data) {
	console.log('[App] Entering updateDataCard');
	//console.log('[App] Incoming data: ' + JSON.stringify(data));


	/*
	 * Check if incoming data obj ID is in the childNodeList where we are storing all data object IDS
	 * If ID is not in the list, create a new node in the, 'else' case
	 */ 
	if(app.childNodeList.indexOf(data.id) > -1){
		console.log('[App] This data object ID is in the childNodeList. Starting update now for ID: ' + data.id);
		
		var card = document.getElementById(data.id);
		card.querySelector('.image').setAttribute('src', data.image);
	    card.querySelector('.username').querySelector('h1').textContent = data.username;
	    card.querySelector('.date').querySelector('p').textContent = data.date;
		
	}else{
		console.log('[App] This data object ID is not in the childNodeList. Initial build of this data object ID: ' + data.id + ' starts now...');
		
		var card = app.cardTemplate.cloneNode(true);
	    card.classList.remove('cardTemplate');
	    card.classList.add('card');
	    card.removeAttribute('hidden');
	    app.container.appendChild(card);
		
	    var nameNode = document.createElement('h1');
	    var dateNode = document.createElement('p');
	    
	    card.querySelector('.image').setAttribute('src', data.image);
	    card.querySelector('.username').appendChild(nameNode).textContent = data.username;
	    card.querySelector('.date').appendChild(dateNode).textContent = data.date;
	    card.setAttribute('id', data.id); 
	}
	
	
	//Iterate children nodes, 'card' from index.html, to create a list of all current existing card node IDs
	for(i=0; i < app.childrenNodes.length; i++){
		
		if(app.childrenNodes.length > 0 && app.childrenNodes[i].className === 'card'){
			
			var id = app.childrenNodes[i].getAttribute('id');
			var idCheck = app.childNodeList.indexOf(id) > -1;
			
			console.log('[App] Card ID is: ' + id);
			console.log('[App] This incoming data object ID in the childNodeList: ' + idCheck);
			
			if(id !== null && idCheck === false){
				app.childNodeList.push(id);
			}			
		}
	}
	
	console.log('[App] Node count (First node is a template, doesnt count) :' + (app.childrenNodes.length));
	console.log('[App] Final child node list: ' + app.childNodeList);
	console.log('[App] Final child node list length: ' + app.childNodeList.length);
	
	//Add & remove loader
    if (app.isLoading) {
      app.spinner.setAttribute('hidden', true);
      app.container.removeAttribute('hidden');
      app.isLoading = false;
    }
    
  };


  /*****************************************************************************
   *
   * Methods for dealing with the model
   *
   ****************************************************************************/
  

  /*
   * This app is using the cache first, then network strategy
   * Two asynchronous requests, ONE TO THE CACHE, AND ONE TO THE NETWORK. Under normal circumstances,
   * the cached data will be return almost immediately providing the app with recent data it can use.
   * Then, when the network request returns, the app will be updated using the latest data from the network.
   * 
   * Built a middleware component node server that will make the CME API calls for us and return the data (server.js) 
   */
  
  app.getData = function(offset) {
	console.log('[App] Entering getData');
	
	if(!offset){
		var finalOffset = 0;
	}
	
	var url = 'http://localhost:8080/data?offset='+finalOffset;
    
        
    /*
     * Call ONE (Asynchronous, 'one' doesn't refer to order of call)
     * Check if the caches object is available in the global window object.
     * Request data from cache.
     * If the server request is still outstanding (hasRequestPending) update the app with the cached data. 
     */
    if ('caches' in window) {
      console.log('[App] Cache is supported by the window, checking cache now...');
      console.log('[App] Checking if url: ' + url + ' is stored in SW cache now...');
      
      caches.match(url).then(function(response) {
        if (response) {
          console.log('[App] There is a response from getData cache');
          response.json().then(function(json) {
            // Only update if the XHR is still pending, otherwise the XHR
            // has already returned and provided the latest data.
            if(app.hasRequestPending) {
              console.log('[App] Data will be UPDATED FROM CACHE');
              //console.log('[App] This is the cached json file: ' + JSON.stringify(json));
              
              var newObjectData = {};
              
	      		for(var i=0; i<json.data.length; i++){
	            	  var obj = json.data[i];
	            	  
	            	  for(var key in obj){
	            		  var image = obj['imageUrl'];
	            		  var username = obj['username'];
	            		  var date = obj['updatedAt'];
	            		  var id = obj['id'];
	                    
	            	  }
	            	var newObjectData = {'image':image, 'username':username, 'date':date, 'id':id, 'fromCache':true}
	                console.log('[App] Now data will be UPDATED FROM CACHE');
	                app.updateDataCard(newObjectData);
	              }
            }
          });
        }else{
        	console.log('[App] There was no response from cache, moving onto to network call.');
        }
      });
    }
    
    /*
     * Call TWO (Asynchronous, 'two' doesn't refer to order of call)
     * Request data from the server.
     * Save the data for quick access later.
     * Update the app with the fresh data from the server.
     */
    
    app.hasRequestPending = true;    
    
    if(app.hasRequestPending){
    	console.log('[App] Entering Network request now...');
   
    	
        var request = new XMLHttpRequest();
        request.open('GET', url, true);        
        
        request.onreadystatechange = function(){
        	
            if (request.readyState == 4 && request.status==200){
            	
            	if(request.responseText != ''){
            		app.hasRequestPending = false;
            		response = JSON.parse(request.responseText);
                    console.log('[App] Response from Network request: ' + JSON.stringify(response.data));
            		
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
                    console.log('[App] Now data will be UPDATED FROM NETWORK');
                    app.updateDataCard(newObjectData);
                    }
            	}
            }else{
            	console.log('[App] This is the response if both request.readyState == 4 && request.status==200 arent met: ' + JSON.stringify(request));
            }
    	}
        request.send();
    }  
  }
  
  
  //NOT IN USE
//  app.buildAuthHeader = function(params){
//		
//		var date = Math.round(Date.now() / 1000);
//		var httpMethod = 'GET';
//		var accessKey = '6f7b04a2afa589c7a913a8c47000c86daa0e368c';
//		var signatureKey = 'b3675eeff9a879a145bcc5a011c64381c488811e';
//		
//		// Format the signature string.
//		var signatureString = httpMethod +'&';
//		signatureString += accessKey +'&';
//		signatureString += date +'&';
//		signatureString += params;
//			
//		var signatureHash = CryptoJS.HmacSHA256(signatureString,signatureKey).toString(CryptoJS.enc.Hex);;
//		
//		var xAuth = accessKey + ':' + date.toString() + ':' + signatureHash;
//		
//		console.log('[CME] AUTH HEADER: ' + xAuth);
//		
//		return xAuth;
//	}
  
  
  
  
  if(app.initialLoad){
	  console.log('[App] Initial load starting now.');
	  app.getData();
  }
  
  
  /*****************************************************************************
  *
  * Conditional for service worker check. If true, register SW.
  * If not, the application will function as normal (network only), 
  * without the benefits of the SW
  *
  ****************************************************************************/  
  if('serviceWorker' in navigator) {
    navigator.serviceWorker
             .register('/PhunProgressiveWebApp/service-worker.js')
             .then(function() { console.log('[App] Service Worker Registered'); });
  }

})();
