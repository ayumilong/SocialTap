define(['dojo/_base/declare',
		'dojo-mama/Module',
		'./View'
], function(declare, Module, View) {
	return declare([Module], {
		'class': 'visModule',

		postCreate: function() {
			this.inherited(arguments);

			var view = new View();
			this.registerView(view);
		}

	});
});
