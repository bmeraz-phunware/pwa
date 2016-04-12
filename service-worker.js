/*
 * Brian Meraz
 * Phunware Inc. 2016
 * Service Worker functions like a proxy server, allowing you to modify requests and responses, 
 * replace them with items from its own cache, and more.
 */

/*
 * Set up shell and data cache names
 */
var dataCacheName = 'phunPWAData-v1';
var cacheName = 'phunPWAShell-1';

/*
 * List of files required for the app shell
 */
var filesToCache = [
  '/PhunProgressiveWebApp',
  '/PhunProgressiveWebApp/index.html',
  '/PhunProgressiveWebApp/scripts/app.js',
  '/PhunProgressiveWebApp/images/ic_refresh_white_24px.svg'
];


/*
 * When the service worker is registered, an install event is triggered the first time the user visits the page. 
 * When the service worker is fired, it should open the caches object (filesToCache) and populate it with the assets necessary 
 * to load the App Shell.
 * Once the cache is open, we can then call cache.addAll(), which takes a list of URLs, then fetches them from the
 * server and adds the response to the cache. Unfortunately cache.addAll() is atomic, if any of the files fail, the
 * entire cache step will also fail!
 * The Service Worker’s brand new storage API — cache — a global on the service worker that allows us to store assets 
 * delivered by responses, and keyed by their requests. This API works in a similar way to the browser’s standard cache, 
 * but it is specific to your domain. It persists until you tell it not to — again, you have full control.
 */
self.addEventListener('install', function(e) {
  console.log('[ServiceWorker] Install');
  e.waitUntil(
	self.skipWaiting(
		caches.open(cacheName).then(function(cache) {
		      console.log('[ServiceWorker] Caching App Shell for cacheName: ' + cacheName + ' and files ' + filesToCache);
		      return cache.addAll(filesToCache);
		    })
	)
  )
  
});


/*
 * When the service worker is installed, it then receives an activate event. The primary use of onactivate 
 * is for cleanup of resources (remove old cache) used in previous versions of a Service Worker script.
 */
self.addEventListener('activate', function(e) {
  console.log('[ServiceWorker] Activate');
  e.waitUntil(
	self.clients.claim(
			caches.keys().then(function(keyList) {
			      return Promise.all(keyList.map(function(key) {
			        console.log('[ServiceWorker] Removing old cache', key);
			        if (key !== cacheName) {
			          return caches.delete(key);
			        }
			      }));
			    })
	)
    
  );
});


/*
 * This code intercepts the request and checks if the URL starts with the address of the
 * data API. If it does, we’ll use fetch to make the request. Once the response is returned,
 * our code opens the cache, clones the response, stores it in the cache and finally returns
 * the response to the original requestor.
 */   

self.addEventListener('fetch', function(e) {
	
  console.log('[ServiceWorker] Fetch', e.request.url); 
  var dataUrl = 'http://localhost:8080/data?offset=';
  
  if (e.request.url.indexOf(dataUrl) === 0) {
	console.log("[ServiceWorker] The request is the Data URL: " + dataUrl);
    e.respondWith(
      fetch(e.request)
        .then(function(response) {
          return caches.open(dataCacheName).then(function(cache) {
            cache.put(e.request.url, response.clone());
            console.log('[ServiceWorker] Request from Data URL has been put in cache: ' + dataCacheName);
            return response;
          });
        })
    );
  } else {
	/*
	 * Stepping from inside, out, caches.match() evaluates the web request that triggered the fetch event,
	 * and checks to see if it’s available in the cache (Everything we had cached in at SW install - filesToCache). 
	 * It then either responds with the cached version, or uses fetch to get a copy from the network. The response 
	 * is passed back to the web page with e.respondWith().
	 */
    e.respondWith(
      caches.match(e.request).then(function(response) {
    	console.log('[ServiceWorker] The request is NOT the Data URL: ' + e.request.url);
    	if(response){
    		console.log('[ServiceWorker] This request data is found in cache, returning now... ' + response);
    		return response;
    	}else{
    		console.log('[ServiceWorker] This request data is NOT found in cache, fetching from network and returning it.');
    		return fetch(e.request);
    	}
      })
    );
  }
});
