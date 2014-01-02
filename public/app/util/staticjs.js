define(['dojo/_base/kernel',
		'dojo/request/script'
], function(kernel, script) {
	var callbackHash = {}; // An object containing incoming requests
	var callbackQueue = []; // An object that keeps the order of requests
	var grab = function(id) {
		var cb, callback;
		if (id == callbackQueue[0]) {
			if (!callbackHash[id].loadStarted) {
				callbackHash[id].loadStarted = true;
					script.get(id).then(function(data) {
					callbackHash[id].retObject = null;
					while(callbackHash[id].callbacks.length > 0) {
						cb = callbackHash[id].callbacks.shift();
						cb(callbackHash[id].retObject);
					}
					callbackQueue.shift();
					if (callbackQueue.length !== 0) {
						grab(callbackQueue[0]);
					}
				}, function(err) {
				});
			} else {
				callback(callbackHash[id]["retObject"]);
				callbackQueue.shift();
			}
		}
	};


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
			if (callbackHash[id] === undefined) {
				callbackHash[id] = {"loadStarted" : false, "callbacks" : []};
				callbackQueue.push(id);
			}
			if (callbackHash[id].retObject  && callbackQueue[0] === id) {
				callback(callbackHash[id].retObject);
				callbackQueue.splice(callbackQueue.indexOf(id), 1);
				return;
			}
			callbackHash[id].callbacks.push(callback);
			if (id == callbackQueue[0]) {
				grab(id);
			}
		} 
	};
});
