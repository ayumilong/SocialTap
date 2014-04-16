define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/Deferred',
		'dojo/Evented',
		'dojo/request/xhr'
], function(declare, lang, Deferred, Evented, xhr) {

	var User = declare([Evented], {

		// id: Integer
		//     ID of the current user.
		id: null,

		info: null,

		isLoggedIn: function() {
			return (this.id !== null);
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
					this.info = response.data;
					this.emit('login', {
						id: this.id,
						name: this.info.identity.name
					});
					d.resolve(this);
				}),
				lang.hitch(this, function(err) {
					if (err.response.status == 401) {
						this.id = null;
						this.info = null;
						if (this.isLoggedIn()) {
							this.emit('logout');
						}
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
					this.info = null;
					this.emit('logout');
					d.resolve(true);
					window.location = '#/';
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
