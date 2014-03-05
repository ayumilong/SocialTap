define(['dojo/_base/declare',
		'dojo-mama/Module',
		'./ListView'
], function(declare, Module, ListView) {
	return declare([Module], {
		'class': 'reportsModule',

		postCreate: function() {
			this.inherited(arguments);

			var listView = new ListView();
			this.registerView(listView);
		}
	});
});
