define(['dojo/_base/kernel',
		'dojo/request/script'
], function(kernel, script) {
	return {
		load: function(id, require, callback) {
			// summary:
			//            This handles multiple incoming requests for javascript
			//            files. It asychronously loads then calls back to the
			//            function calling it. It will process the requests in the
			//            order that they are received.
			// id:
			//            A string containg the path to the javascript file that
			//            will be loaded. Also used as the index for callbackHash
			// callbackHash:
			//            An object containing information about individual
			//            requests.
			// callbackQueue:
			//            An array containing the order the requests were made.
			var callbackHash = {}; // An object containing incoming requests
			var callbackQueue = []; // An object that keeps the order of requests
			console.log("ID " + id);
			if (callbackHash[id] === undefined) {
				callbackHash[id] = {"loadStarted" : false, "callbacks" : []};
				callbackQueue.push(id);
			}
			if (callbackHash[id]["retObject"]  && callbackQueue[0] === id) {
				callback(callbackHash[id]["retObject"]);
				console.log("........Popped1........ " + id);
				callbackQueue.splice(callbackQueue.indexOf(id), 1);
				return;
			}
			callbackHash[id]["callbacks"].push(callback);
			
			while (callbackQueue.length !== 0) {
				if (callbackQueue[0] === id) {
					console.log("about to load: " + id);
					if (!callbackHash[id]["loadStarted"]) {
						console.log("started to load: " + id);
						callbackHash[id]["loadStarted"] = true;
						script.get(id/*, {jsonp : "callback"}*/).then(function(data) {
							callbackHash[id]["retObject"] = null;
							console.log("got script for " + id); 
							while(callbackHash[id]["callbacks"].length > 0) {
								cb = callbackHash[id]["callbacks"].shift();
								cb(callbackHash[id]["retObject"]);
								console.log("called back for " + id);
							}
							console.log(".......Popped2....... " + callbackQueue[0]);
							callbackQueue.shift();
						}, function(err) {
							console.error("cannot load object");
						});
					} else {
						callback(callbackHash[id]["retObject"]);
						console.log(".......Popped3....... " + callbackQueue[0]);
						callbackQueue.shift();
					}
				} else {
					console.log(id +  " ......waiting on....... " + callbackQueue[0]);
				}
			}
		}
	};
});
