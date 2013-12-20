define(['dojo/_base/declare',
		'dojo-mama/Module',
		'app/auth/LoginFormView'
], function(declare, Module, LoginFormView) {
	return declare([Module],{
		'class': 'datasetsModule',

		postCreate: function() {
			this.inherited(arguments);

			var lfv = new LoginFormView();
			this.registerView(lfv);
			this.rootView = lfv;
		}
	});
});
