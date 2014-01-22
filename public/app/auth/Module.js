define(['dojo/_base/declare',
		'dojo-mama/Module',
		'app/auth/LoginFormView',
		'app/auth/RegistrationFormView'
], function(declare, Module, LoginFormView, RegistrationFormView) {
	return declare([Module],{
		'class': 'authModule',

		postCreate: function() {
			this.inherited(arguments);

			var lfv = new LoginFormView();
			this.registerView(lfv);

			var rfv = new RegistrationFormView();
			this.registerView(rfv);
		}
	});
});
