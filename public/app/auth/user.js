define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/Deferred',
		'dojo/request/xhr'
], function(declare, lang, Deferred, xhr) {

	var User = declare([], {

		// id: Integer
		//     ID of the current user.
		id: null,

		// name: String
		//     Name of the current user.
		name: null,

		isLoggedIn: function() {
			return (this.id !== null && this.name !== null);
		},

		update: function() {
			// summary:
			//     Update current user info.
			var d = new Deferred();

			xhr.get('/me', {
				handleAs: 'json'
			}).response.then(
				lang.hitch(this, function(response) {
					this.id = response.data.id;
					this.name = response.data.name;
					d.resolve(this);
				}),
				lang.hitch(this, function(err) {
					if (err.response.status == 401) {
						this.id = null;
						this.name = null;
						d.resolve(this);
					}
					else {
						console.error(err);
						d.reject(err);
					}
				}));

			return d.promise;
		},

		logout: function() {
			var d = new Deferred();
			xhr.get('/auth/signout', {
				handleAs: 'json'
			}).response.then(
				lang.hitch(this, function() {
					this.id = null;
					this.name = null;
					d.resolve(true);
				}),
				lang.hitch(this, function(err) {
					console.error(err);
					d.reject(err);
				}));
			return d.promise;
		}

	});

	return new User();
});
