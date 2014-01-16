define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/request/xhr'
], function(declare, lang, xhr) {

	return declare([], {

		xhrPromises: null,

		constructor: function() {
			this.xhrPromises = {};
		},

		loadData: function(key, url) {

			if (this.xhrPromises[key] !== undefined) {
				this.xhrPromises[key].cancel();
			}

			this.xhrPromises[key] = xhr.get(url, {
				handleAs: 'json'
			}).response.then(
				lang.hitch(this, function(response) {
					delete this.xhrPromises[key];
					this.handleData(key, response.data);
				}),
				lang.hitch(this, function(err) {
					delete this.xhrPromises[key];
					if (err.dojoType !== 'cancel') {
						this.handleError(err);
					}
				}));
		},

		handleData: function(key, data) {
			console.log('Received data for ' + key);
			console.log(data);
		},

		handleError: function(err) {
			console.error(err);
		}
	});
});
