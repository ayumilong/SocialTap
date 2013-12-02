define(['dojo/_base/kernel',
		'dojo/request/script'
], function(kernel, script) {
	var loadStarted = false, d3, callbackQueue=[], callbackHash = {};
	return {
		load: function(id, require, callback) {
			console.log("ID " + id)
			if (d3) {
				callback(d3);
				return;
			}
			callbackQueue.push(callback);
			if (!loadStarted) {
				loadStarted = true;
				script.get("static/jquery.js").then(function(data) {
					var cb;
					d3 = kernel.global.d3;
					while(callbackQueue.length) {
						cb = callbackQueue.shift();
						cb(d3);
					}
				}, function(err) {
					console.error("cannot load jquery");
				});
			} else {
				callback(d3);
			}
		}
	};
});
